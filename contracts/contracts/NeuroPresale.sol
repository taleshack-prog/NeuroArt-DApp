// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title NeuroPresale
 * @dev Pre-venda do token $NEURO
 * Preco: $0.20 USDC por NEURO
 * Minimo: 200 NEURO
 * Maximo: 100.000 NEURO por carteira
 * Desconto: 5% para compras acima de 20.000 NEURO
 * Periodo: 10/06/2026 - 20/10/2026
 * Fundadores: Tales Hack e Prof. Alexandre de Souza Fortis
 */
contract NeuroPresale is Ownable, ReentrancyGuard {

    IERC20 public neuroToken;
    IERC20 public usdc;

    // Preco: 0.20 USDC por NEURO (6 decimais USDC)
    uint256 public constant PRICE_USDC = 200000; // 0.20 USDC = 200000 (6 decimais)

    // Limites
    uint256 public constant MIN_PURCHASE = 200 * 1e18;     // 200 NEURO
    uint256 public constant MAX_PURCHASE = 100000 * 1e18;  // 100.000 NEURO
    uint256 public constant DISCOUNT_THRESHOLD = 20000 * 1e18; // 20.000 NEURO
    uint256 public constant DISCOUNT_BPS = 500; // 5% = 500 basis points

    // Periodo
    uint256 public startTime;
    uint256 public endTime;

    // Total disponivel
    uint256 public totalAvailable = 2000000 * 1e18; // 2.000.000 NEURO
    uint256 public totalSold;

    // Controle por carteira
    mapping(address => uint256) public purchased;

    // Carteira que recebe os fundos
    address public treasury;

    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost, string currency);
    event PresaleStarted(uint256 startTime, uint256 endTime);

    constructor(
        address _neuroToken,
        address _usdc,
        address _treasury
    ) Ownable(msg.sender) {
        neuroToken = IERC20(_neuroToken);
        usdc = IERC20(_usdc);
        treasury = _treasury;

        // 10/06/2026 00:00 UTC
        startTime = 1749513600;
        // 20/10/2026 23:59 UTC
        endTime = 1761004740;
    }

    modifier presaleActive() {
        require(block.timestamp >= startTime, "Presale not started");
        require(block.timestamp <= endTime, "Presale ended");
        _;
    }

    /**
     * @dev Calcula o custo em USDC para uma quantidade de NEURO
     * Aplica desconto de 5% para compras acima de 20.000 NEURO
     */
    function calculateCost(uint256 amount) public pure returns (uint256) {
        uint256 baseCost = (amount * PRICE_USDC) / 1e18;
        if (amount >= DISCOUNT_THRESHOLD) {
            baseCost = (baseCost * (10000 - DISCOUNT_BPS)) / 10000;
        }
        return baseCost;
    }

    /**
     * @dev Compra NEURO com USDC
     */
    function buyWithUSDC(uint256 amount) external nonReentrant presaleActive {
        _validatePurchase(amount);

        uint256 cost = calculateCost(amount);
        require(usdc.transferFrom(msg.sender, treasury, cost), "USDC transfer failed");

        _deliverTokens(msg.sender, amount);
        emit TokensPurchased(msg.sender, amount, cost, "USDC");
    }

    /**
     * @dev Compra NEURO com ETH
     * Preco ETH calculado via ratio com USDC (owner atualiza)
     */
    function buyWithETH(uint256 amount) external payable nonReentrant presaleActive {
        _validatePurchase(amount);
        require(ethPrice > 0, "ETH price not set");

        // Calcula custo em ETH baseado no preco USDC
        uint256 usdcCost = calculateCost(amount);
        uint256 ethCost = (usdcCost * 1e18) / ethPrice;
        require(msg.value >= ethCost, "Insufficient ETH");

        (bool sent,) = treasury.call{value: ethCost}("");
        require(sent, "ETH transfer failed");

        // Devolve excesso
        if (msg.value > ethCost) {
            (bool refund,) = msg.sender.call{value: msg.value - ethCost}("");
            require(refund, "Refund failed");
        }

        _deliverTokens(msg.sender, amount);
        emit TokensPurchased(msg.sender, amount, ethCost, "ETH");
    }

    // Preco do ETH em USDC (6 decimais) — owner atualiza periodicamente
    uint256 public ethPrice;

    function setEthPrice(uint256 _ethPrice) external onlyOwner {
        ethPrice = _ethPrice;
    }

    function _validatePurchase(uint256 amount) internal view {
        require(amount >= MIN_PURCHASE, "Below minimum purchase");
        require(purchased[msg.sender] + amount <= MAX_PURCHASE, "Exceeds maximum per wallet");
        require(totalSold + amount <= totalAvailable, "Exceeds available supply");
    }

    function _deliverTokens(address buyer, uint256 amount) internal {
        purchased[buyer] += amount;
        totalSold += amount;
        require(neuroToken.transfer(buyer, amount), "Token transfer failed");
    }

    // Informacoes publicas
    function getPresaleInfo() external view returns (
        uint256 _startTime,
        uint256 _endTime,
        uint256 _totalAvailable,
        uint256 _totalSold,
        uint256 _remaining,
        bool _isActive
    ) {
        return (
            startTime,
            endTime,
            totalAvailable,
            totalSold,
            totalAvailable - totalSold,
            block.timestamp >= startTime && block.timestamp <= endTime
        );
    }

    function getWalletInfo(address wallet) external view returns (
        uint256 _purchased,
        uint256 _remaining
    ) {
        return (purchased[wallet], MAX_PURCHASE - purchased[wallet]);
    }

    // Owner pode recuperar tokens nao vendidos apos o fim
    function withdrawUnsoldTokens() external onlyOwner {
        require(block.timestamp > endTime, "Presale not ended");
        uint256 balance = neuroToken.balanceOf(address(this));
        neuroToken.transfer(owner(), balance);
    }

    function updateTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }
}
