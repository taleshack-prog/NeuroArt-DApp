// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/// @dev Interface mínima de um feed Chainlink (evita dependência do pacote @chainlink/contracts)
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/**
 * @title FractionMarketplaceV2
 * @notice Venda primária de frações de obras NeuroArt na Base.
 *
 * Regra de preço: o valor da obra é fixo em BRL. O preço por fração é guardado em USD (6 decimais),
 * atualizado diariamente por um keeper com a cotação BRL/USD. ETH é convertido na hora da compra
 * pelo feed Chainlink ETH/USD.
 *
 * Papéis:
 *  - DEFAULT_ADMIN_ROLE: parâmetros, carteira da DApp, gestão de papéis
 *  - FOUNDER_ROLE:       listar/deslistar obras, corrigir preço sem teto, pausar
 *  - PRICE_KEEPER_ROLE:  só atualizar preços, com teto de variação e intervalo mínimo
 *
 * Split: 80% artista / 20% DApp (mesmo do v1).
 */
contract FractionMarketplaceV2 is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant FOUNDER_ROLE = keccak256("FOUNDER_ROLE");
    bytes32 public constant PRICE_KEEPER_ROLE = keccak256("PRICE_KEEPER_ROLE");

    uint256 public constant BPS = 10_000;
    uint256 public constant ARTIST_SHARE_BPS = 8_000; // 80%
    uint256 public constant SEQUENCER_GRACE_PERIOD = 1 hours;

    IERC20 public immutable usdc;
    AggregatorV3Interface public immutable ethUsdFeed;
    AggregatorV3Interface public immutable sequencerUptimeFeed; // pode ser address(0) (ex: testes)
    uint8 private immutable _feedDecimals;

    address public dappWallet;

    uint256 public maxPriceAge = 36 hours;         // preço do keeper mais velho que isso bloqueia compras
    uint256 public maxOracleAge = 3 hours;         // idade máxima aceitável do feed ETH/USD
    uint256 public maxDeviationBps = 1_000;        // keeper só altera ±10% por atualização
    uint256 public minUpdateInterval = 12 hours;   // keeper só atualiza a mesma obra a cada 12h

    struct Listing {
        address vault;          // ERC20 das frações
        address artist;         // recebe 80%
        uint256 priceUsd6;      // preço por fração inteira (1e18 unidades) em USD com 6 decimais
        uint64 priceUpdatedAt;
        bool active;
    }

    mapping(uint256 => Listing) private _listings;
    mapping(address => uint256) public vaultToObra; // impede o mesmo vault em duas obras (saldo seria contado duas vezes)

    event Listed(uint256 indexed obraId, address indexed vault, address indexed artist, uint256 priceUsd6, uint256 deposited);
    event Delisted(uint256 indexed obraId);
    event PriceUpdated(uint256 indexed obraId, uint256 oldPriceUsd6, uint256 newPriceUsd6, address indexed by);
    event FractionsWithdrawn(uint256 indexed obraId, address indexed to, uint256 amount);
    event FractionBought(uint256 indexed obraId, address indexed buyer, uint256 amount, string currency, uint256 paid);
    event DappWalletUpdated(address newWallet);
    event ParamsUpdated(uint256 maxPriceAge, uint256 maxOracleAge, uint256 maxDeviationBps, uint256 minUpdateInterval);

    constructor(
        address usdc_,
        address ethUsdFeed_,
        address sequencerUptimeFeed_,
        address dappWallet_,
        address admin_,
        address coFounder_
    ) {
        require(usdc_ != address(0) && ethUsdFeed_ != address(0), "MP: zero address");
        require(dappWallet_ != address(0) && admin_ != address(0), "MP: zero address");
        usdc = IERC20(usdc_);
        ethUsdFeed = AggregatorV3Interface(ethUsdFeed_);
        sequencerUptimeFeed = AggregatorV3Interface(sequencerUptimeFeed_);
        _feedDecimals = AggregatorV3Interface(ethUsdFeed_).decimals();
        dappWallet = dappWallet_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(FOUNDER_ROLE, admin_);
        if (coFounder_ != address(0)) _grantRole(FOUNDER_ROLE, coFounder_);
    }

    // ---------------------------------------------------------------- listagem

    /**
     * @notice Lista (ou relista) uma obra. Puxa `amountToSell` frações de quem chama (precisa de approve antes).
     * @dev amountToSell pode ser 0 se as frações já estiverem no marketplace.
     */
    function listObra(uint256 obraId, address vault, address artist, uint256 priceUsd6, uint256 amountToSell)
        external
        onlyRole(FOUNDER_ROLE)
    {
        require(vault != address(0) && artist != address(0), "MP: zero address");
        require(priceUsd6 > 0, "MP: price required");
        Listing storage existing = _listings[obraId];
        require(existing.vault == address(0) || existing.vault == vault, "MP: vault mismatch");
        require(obraId != 0, "MP: invalid obraId");
        uint256 owner_ = vaultToObra[vault];
        require(owner_ == 0 || owner_ == obraId, "MP: vault used by another obra");
        vaultToObra[vault] = obraId;

        if (amountToSell > 0) {
            IERC20(vault).safeTransferFrom(msg.sender, address(this), amountToSell);
        }
        require(IERC20(vault).balanceOf(address(this)) > 0, "MP: no fractions deposited");

        _listings[obraId] = Listing({
            vault: vault,
            artist: artist,
            priceUsd6: priceUsd6,
            priceUpdatedAt: uint64(block.timestamp),
            active: true
        });
        emit Listed(obraId, vault, artist, priceUsd6, amountToSell);
    }

    function delist(uint256 obraId) external onlyRole(FOUNDER_ROLE) {
        require(_listings[obraId].active, "MP: not listed");
        _listings[obraId].active = false;
        emit Delisted(obraId);
    }

    /// @notice Devolve frações de uma obra deslistada.
    function withdrawFractions(uint256 obraId, address to, uint256 amount) external onlyRole(FOUNDER_ROLE) {
        Listing storage l = _listings[obraId];
        require(l.vault != address(0), "MP: unknown obra");
        require(!l.active, "MP: delist first");
        require(to != address(0), "MP: zero address");
        IERC20(l.vault).safeTransfer(to, amount);
        emit FractionsWithdrawn(obraId, to, amount);
    }

    // ---------------------------------------------------------------- preço

    /// @notice Keeper diário: só altera dentro do teto de variação e após o intervalo mínimo.
    function updatePrices(uint256[] calldata obraIds, uint256[] calldata pricesUsd6)
        external
        onlyRole(PRICE_KEEPER_ROLE)
    {
        require(obraIds.length == pricesUsd6.length, "MP: length mismatch");
        for (uint256 i = 0; i < obraIds.length; ++i) {
            Listing storage l = _listings[obraIds[i]];
            require(l.active, "MP: not listed");
            require(block.timestamp >= uint256(l.priceUpdatedAt) + minUpdateInterval, "MP: too soon");
            uint256 oldP = l.priceUsd6;
            uint256 newP = pricesUsd6[i];
            require(newP > 0, "MP: price required");
            uint256 diff = newP > oldP ? newP - oldP : oldP - newP;
            require(diff * BPS <= oldP * maxDeviationBps, "MP: deviation too high");
            l.priceUsd6 = newP;
            l.priceUpdatedAt = uint64(block.timestamp);
            emit PriceUpdated(obraIds[i], oldP, newP, msg.sender);
        }
    }

    /// @notice Correção manual pelos fundadores (sem teto).
    function setPrice(uint256 obraId, uint256 priceUsd6) external onlyRole(FOUNDER_ROLE) {
        Listing storage l = _listings[obraId];
        require(l.vault != address(0), "MP: unknown obra");
        require(priceUsd6 > 0, "MP: price required");
        uint256 oldP = l.priceUsd6;
        l.priceUsd6 = priceUsd6;
        l.priceUpdatedAt = uint64(block.timestamp);
        emit PriceUpdated(obraId, oldP, priceUsd6, msg.sender);
    }

    // ---------------------------------------------------------------- compra

    /**
     * @param amount  frações em unidades de 18 decimais (1 fração = 1e18)
     * @param maxUsdc teto que o comprador aceita pagar (proteção caso o preço mude entre a cotação e a transação)
     */
    function buyWithUSDC(uint256 obraId, uint256 amount, uint256 maxUsdc) external nonReentrant whenNotPaused {
        Listing memory l = _requireBuyable(obraId, amount);
        uint256 total = _usdTotal(l.priceUsd6, amount);
        require(total > 0, "MP: amount too small");
        require(total <= maxUsdc, "MP: price above max");

        uint256 artistPart = (total * ARTIST_SHARE_BPS) / BPS;
        IERC20(l.vault).safeTransfer(msg.sender, amount);
        usdc.safeTransferFrom(msg.sender, l.artist, artistPart);
        usdc.safeTransferFrom(msg.sender, dappWallet, total - artistPart);

        emit FractionBought(obraId, msg.sender, amount, "USDC", total);
    }

    /// @notice msg.value é o teto; o excesso é devolvido.
    function buyWithETH(uint256 obraId, uint256 amount) external payable nonReentrant whenNotPaused {
        Listing memory l = _requireBuyable(obraId, amount);
        uint256 total = _usdToWei(_usdTotal(l.priceUsd6, amount));
        require(total > 0, "MP: amount too small");
        require(msg.value >= total, "MP: insufficient ETH");

        uint256 artistPart = (total * ARTIST_SHARE_BPS) / BPS;
        IERC20(l.vault).safeTransfer(msg.sender, amount);
        Address.sendValue(payable(l.artist), artistPart);
        Address.sendValue(payable(dappWallet), total - artistPart);
        if (msg.value > total) {
            Address.sendValue(payable(msg.sender), msg.value - total);
        }

        emit FractionBought(obraId, msg.sender, amount, "ETH", total);
    }

    // ---------------------------------------------------------------- views

    function getListing(uint256 obraId) external view returns (Listing memory) {
        return _listings[obraId];
    }

    function available(uint256 obraId) public view returns (uint256) {
        address vault = _listings[obraId].vault;
        return vault == address(0) ? 0 : IERC20(vault).balanceOf(address(this));
    }

    function isPriceFresh(uint256 obraId) public view returns (bool) {
        return block.timestamp <= uint256(_listings[obraId].priceUpdatedAt) + maxPriceAge;
    }

    /// @notice Total em USDC (6 decimais) para `amount` frações. Mesma conta da compra.
    function quoteUSDC(uint256 obraId, uint256 amount) external view returns (uint256) {
        return _usdTotal(_listings[obraId].priceUsd6, amount);
    }

    /// @notice Total em wei para `amount` frações, pela cotação Chainlink atual. Reverte se o oráculo estiver inválido.
    function quoteETH(uint256 obraId, uint256 amount) external view returns (uint256) {
        return _usdToWei(_usdTotal(_listings[obraId].priceUsd6, amount));
    }

    // ---------------------------------------------------------------- admin

    function pause() external onlyRole(FOUNDER_ROLE) { _pause(); }

    function unpause() external onlyRole(FOUNDER_ROLE) { _unpause(); }

    function setDappWallet(address newWallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newWallet != address(0), "MP: zero address");
        dappWallet = newWallet;
        emit DappWalletUpdated(newWallet);
    }

    function setParams(uint256 maxPriceAge_, uint256 maxOracleAge_, uint256 maxDeviationBps_, uint256 minUpdateInterval_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(maxPriceAge_ >= 1 hours && maxPriceAge_ <= 7 days, "MP: bad maxPriceAge");
        require(maxOracleAge_ >= 1 minutes && maxOracleAge_ <= 2 days, "MP: bad maxOracleAge");
        require(maxDeviationBps_ >= 100 && maxDeviationBps_ <= 5_000, "MP: bad maxDeviation");
        require(minUpdateInterval_ >= 1 hours && minUpdateInterval_ <= 7 days, "MP: bad minUpdateInterval");
        maxPriceAge = maxPriceAge_;
        maxOracleAge = maxOracleAge_;
        maxDeviationBps = maxDeviationBps_;
        minUpdateInterval = minUpdateInterval_;
        emit ParamsUpdated(maxPriceAge_, maxOracleAge_, maxDeviationBps_, minUpdateInterval_);
    }

    // ---------------------------------------------------------------- internos

    function _requireBuyable(uint256 obraId, uint256 amount) internal view returns (Listing memory l) {
        l = _listings[obraId];
        require(l.active, "MP: not listed");
        require(amount > 0, "MP: zero amount");
        require(isPriceFresh(obraId), "MP: stale price");
        require(available(obraId) >= amount, "MP: not enough fractions");
    }

    /// @dev arredonda para cima: o comprador nunca paga menos que o preço
    function _usdTotal(uint256 priceUsd6, uint256 amount) internal pure returns (uint256) {
        return Math.mulDiv(priceUsd6, amount, 1e18, Math.Rounding.Ceil);
    }

    /// @dev USD (6 dec) -> wei, com o preço ETH/USD do feed (feedDecimals dec). Arredonda para cima.
    function _usdToWei(uint256 usd6) internal view returns (uint256) {
        uint256 ethUsd = _ethUsdPrice();
        return Math.mulDiv(usd6, 10 ** (12 + uint256(_feedDecimals)), ethUsd, Math.Rounding.Ceil);
    }

    function _ethUsdPrice() internal view returns (uint256) {
        if (address(sequencerUptimeFeed) != address(0)) {
            (, int256 status, uint256 startedAt,,) = sequencerUptimeFeed.latestRoundData();
            require(status == 0, "MP: sequencer down");
            require(startedAt != 0 && block.timestamp - startedAt > SEQUENCER_GRACE_PERIOD, "MP: sequencer grace period");
        }
        (, int256 answer,, uint256 updatedAt,) = ethUsdFeed.latestRoundData();
        require(answer > 0, "MP: invalid oracle price");
        require(updatedAt != 0 && block.timestamp - updatedAt <= maxOracleAge, "MP: stale oracle");
        return uint256(answer);
    }
}
