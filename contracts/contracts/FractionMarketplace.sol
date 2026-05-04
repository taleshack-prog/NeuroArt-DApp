// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FractionMarketplace
 * @dev Marketplace para compra de frações de obras de arte.
 * Split automático: 80% artista / 20% DApp
 * Aceita: USDC e ETH
 * Fundadores: Tales Hack e Prof. Alexandre de Souza Fortis
 */
contract FractionMarketplace is Ownable, ReentrancyGuard {

    // Endereço USDC na Base Sepolia
    IERC20 public usdc;

    // Carteira da DApp (recebe 20%)
    address public dappWallet;

    // Split: 80% artista, 20% DApp
    uint256 public constant ARTIST_SHARE = 80;
    uint256 public constant DAPP_SHARE   = 20;

    struct Listing {
        address vaultToken;    // endereço do ERC20 das frações
        address artist;        // carteira do artista
        uint256 priceUSDC;     // preço por fração em USDC (6 decimais)
        uint256 priceETH;      // preço por fração em ETH (18 decimais)
        bool    active;
    }

    // obraId => Listing
    mapping(uint256 => Listing) public listings;

    event Listed(uint256 indexed obraId, address vaultToken, uint256 priceUSDC, uint256 priceETH);
    event FractionBought(uint256 indexed obraId, address indexed buyer, uint256 amount, string currency);
    event PriceUpdated(uint256 indexed obraId, uint256 newPriceUSDC, uint256 newPriceETH);

    constructor(address _usdc, address _dappWallet) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        dappWallet = _dappWallet;
    }

    /**
     * @dev Fundadores listam uma obra para venda.
     * @param obraId ID da obra
     * @param vaultToken endereço do ERC20 das frações
     * @param artist carteira do artista
     * @param priceUSDC preço por fração em USDC (ex: 11220000 = 11.22 USDC com 6 decimais)
     * @param priceETH preço por fração em ETH (ex: 2000000000000000 = 0.002 ETH)
     */
    function listObra(
        uint256 obraId,
        address vaultToken,
        address artist,
        uint256 priceUSDC,
        uint256 priceETH
    ) external onlyOwner {
        require(vaultToken != address(0), "Invalid vault");
        require(artist != address(0), "Invalid artist");
        require(priceUSDC > 0 || priceETH > 0, "Price required");

        listings[obraId] = Listing({
            vaultToken: vaultToken,
            artist: artist,
            priceUSDC: priceUSDC,
            priceETH: priceETH,
            active: true
        });

        emit Listed(obraId, vaultToken, priceUSDC, priceETH);
    }

    /**
     * @dev Compra frações com USDC.
     * @param obraId ID da obra
     * @param amount quantidade de frações (com 18 decimais)
     */
    function buyWithUSDC(uint256 obraId, uint256 amount) external nonReentrant {
        Listing memory l = listings[obraId];
        require(l.active, "Obra not listed");
        require(l.priceUSDC > 0, "USDC not accepted");

        uint256 totalUSDC = (l.priceUSDC * amount) / 1e18;
        uint256 artistAmount = (totalUSDC * ARTIST_SHARE) / 100;
        uint256 dappAmount   = totalUSDC - artistAmount;

        // Transferir USDC do comprador
        require(usdc.transferFrom(msg.sender, l.artist, artistAmount), "USDC artist transfer failed");
        require(usdc.transferFrom(msg.sender, dappWallet, dappAmount), "USDC dapp transfer failed");

        // Transferir frações para o comprador
        require(IERC20(l.vaultToken).transfer(msg.sender, amount), "Fraction transfer failed");

        emit FractionBought(obraId, msg.sender, amount, "USDC");
    }

    /**
     * @dev Compra frações com ETH.
     * @param obraId ID da obra
     * @param amount quantidade de frações (com 18 decimais)
     */
    function buyWithETH(uint256 obraId, uint256 amount) external payable nonReentrant {
        Listing memory l = listings[obraId];
        require(l.active, "Obra not listed");
        require(l.priceETH > 0, "ETH not accepted");

        uint256 totalETH = (l.priceETH * amount) / 1e18;
        require(msg.value >= totalETH, "Insufficient ETH");

        uint256 artistAmount = (totalETH * ARTIST_SHARE) / 100;
        uint256 dappAmount   = totalETH - artistAmount;

        // Distribuir ETH
        (bool sentArtist,) = l.artist.call{value: artistAmount}("");
        require(sentArtist, "ETH artist transfer failed");

        (bool sentDapp,) = dappWallet.call{value: dappAmount}("");
        require(sentDapp, "ETH dapp transfer failed");

        // Devolver excesso
        if (msg.value > totalETH) {
            (bool refund,) = msg.sender.call{value: msg.value - totalETH}("");
            require(refund, "Refund failed");
        }

        // Transferir frações
        require(IERC20(l.vaultToken).transfer(msg.sender, amount), "Fraction transfer failed");

        emit FractionBought(obraId, msg.sender, amount, "ETH");
    }

    /**
     * @dev Atualiza preços (quando a cotação mudar).
     */
    function updatePrice(uint256 obraId, uint256 newPriceUSDC, uint256 newPriceETH) external onlyOwner {
        require(listings[obraId].active, "Not listed");
        listings[obraId].priceUSDC = newPriceUSDC;
        listings[obraId].priceETH  = newPriceETH;
        emit PriceUpdated(obraId, newPriceUSDC, newPriceETH);
    }

    function getListing(uint256 obraId) external view returns (Listing memory) {
        return listings[obraId];
    }

    function updateDappWallet(address _new) external onlyOwner {
        dappWallet = _new;
    }
}
