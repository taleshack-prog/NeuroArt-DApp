// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./NeuroArtAMM.sol";
import "./NeuroArtAMMFactory.sol";

/**
 * @title NeuroArtRouter
 * @dev Router para swaps no marketplace NeuroArt
 * Suporta: USDC -> NEURO -> Fracao e Fracao -> NEURO -> USDC
 * Rede Base L2 — NEURO fixo 10.000.000
 */
contract NeuroArtRouter is ReentrancyGuard {

    NeuroArtAMMFactory public immutable factory;
    IERC20 public immutable neuroToken;
    IERC20 public immutable usdc;

    // Base Mainnet USDC
    address public constant USDC_BASE = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    event SwapUSDCForFraction(address indexed buyer, address obraToken, uint256 usdcIn, uint256 fractionsOut);
    event SwapFractionForUSDC(address indexed seller, address obraToken, uint256 fractionsIn, uint256 usdcOut);
    event SwapNEUROForFraction(address indexed buyer, address obraToken, uint256 neuroIn, uint256 fractionsOut);
    event SwapFractionForNEURO(address indexed seller, address obraToken, uint256 fractionsIn, uint256 neuroOut);

    constructor(address _factory, address _neuroToken) {
        factory = NeuroArtAMMFactory(_factory);
        neuroToken = IERC20(_neuroToken);
        usdc = IERC20(USDC_BASE);
    }

    /**
     * @dev Compra fracoes com NEURO diretamente
     */
    function swapNEUROForFraction(
        address obraToken,
        uint256 amountNEURO,
        uint256 minFractionsOut
    ) external nonReentrant returns (uint256 fractionsOut) {
        address pool = factory.getPool(obraToken);
        require(pool != address(0), "Pool not found");

        neuroToken.transferFrom(msg.sender, address(this), amountNEURO);
        neuroToken.approve(pool, amountNEURO);

        fractionsOut = NeuroArtAMM(pool).swapBForA(amountNEURO, minFractionsOut);
        IERC20(obraToken).transfer(msg.sender, fractionsOut);

        emit SwapNEUROForFraction(msg.sender, obraToken, amountNEURO, fractionsOut);
    }

    /**
     * @dev Vende fracoes por NEURO
     */
    function swapFractionForNEURO(
        address obraToken,
        uint256 amountFractions,
        uint256 minNEUROOut
    ) external nonReentrant returns (uint256 neuroOut) {
        address pool = factory.getPool(obraToken);
        require(pool != address(0), "Pool not found");

        IERC20(obraToken).transferFrom(msg.sender, address(this), amountFractions);
        IERC20(obraToken).approve(pool, amountFractions);

        neuroOut = NeuroArtAMM(pool).swapAForB(amountFractions, minNEUROOut);
        neuroToken.transfer(msg.sender, neuroOut);

        emit SwapFractionForNEURO(msg.sender, obraToken, amountFractions, neuroOut);
    }

    /**
     * @dev Preview do output sem executar o swap
     */
    function getAmountOut(
        address obraToken,
        uint256 amountIn,
        bool neuroForFraction
    ) external view returns (uint256) {
        address pool = factory.getPool(obraToken);
        if (pool == address(0)) return 0;
        return NeuroArtAMM(pool).getAmountOut(amountIn, !neuroForFraction);
    }

    function getPrice(address obraToken) external view returns (uint256) {
        address pool = factory.getPool(obraToken);
        if (pool == address(0)) return 0;
        return NeuroArtAMM(pool).getPrice();
    }

    function getReserves(address obraToken) external view returns (uint256 rFractions, uint256 rNeuro) {
        address pool = factory.getPool(obraToken);
        if (pool == address(0)) return (0, 0);
        return NeuroArtAMM(pool).getReserves();
    }
}
