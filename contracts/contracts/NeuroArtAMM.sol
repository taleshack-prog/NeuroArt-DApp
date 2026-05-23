// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title NeuroArtAMM
 * @dev Constant product AMM (x*y=k) para frações de obras de arte
 * Taxas: 1% artista, 0.75% DAO, 0.5% LPs, 0.25% fundo estratégico = 2.5% total
 * Supply NEURO fixo: 10.000.000 — sem mint adicional
 */
contract NeuroArtAMM is ReentrancyGuard {

    IERC20 public immutable tokenA;  // frações da obra (ERC20 vault)
    IERC20 public immutable tokenB;  // $NEURO

    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    // Taxas em basis points (10000 = 100%)
    uint256 public constant ARTIST_FEE_BPS   = 100;  // 1%
    uint256 public constant DAO_FEE_BPS      = 75;   // 0.75%
    uint256 public constant LP_FEE_BPS       = 50;   // 0.5%
    uint256 public constant STRATEGIC_FEE_BPS = 25;  // 0.25%
    uint256 public constant TOTAL_FEE_BPS    = 250;  // 2.5%

    address public immutable artistWallet;
    address public immutable daoWallet;
    address public immutable strategicWallet;

    // Threshold de resgate: 100% das fracoes
    uint256 public immutable totalFractions;
    bool public isRedeemed;

    event Swap(address indexed sender, address tokenIn, uint256 amountIn, uint256 amountOut, uint256 feeArtist, uint256 feeDao);
    event AddLiquidity(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event RemoveLiquidity(address indexed provider, uint256 amountA, uint256 amountB, uint256 liquidity);
    event Redeemed(address indexed redeemer, uint256 fractionsAmount);
    event FeesDistributed(uint256 artist, uint256 dao, uint256 strategic);

    constructor(
        address _tokenA,
        address _tokenB,
        address _artistWallet,
        address _daoWallet,
        address _strategicWallet,
        uint256 _totalFractions
    ) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        artistWallet = _artistWallet;
        daoWallet = _daoWallet;
        strategicWallet = _strategicWallet;
        totalFractions = _totalFractions;
    }

    modifier notRedeemed() {
        require(!isRedeemed, "Pool redeemed");
        _;
    }

    // ─── SWAP ────────────────────────────────────────────────────────────────

    function swapAForB(uint256 amountAIn, uint256 minAmountBOut)
        external nonReentrant notRedeemed returns (uint256 amountBOut)
    {
        require(amountAIn > 0, "Zero input");
        require(reserveA > 0 && reserveB > 0, "No liquidity");

        // Calcula output com taxa LP (0.5%) — LPs ficam com a taxa no pool
        uint256 amountInWithLPFee = amountAIn * (10000 - LP_FEE_BPS);
        uint256 numerator = amountInWithLPFee * reserveB;
        uint256 denominator = reserveA * 10000 + amountInWithLPFee;
        amountBOut = numerator / denominator;

        require(amountBOut >= minAmountBOut, "Slippage too high");
        require(amountBOut < reserveB, "Insufficient liquidity");

        // Calcula taxas sobre o output
        uint256 feeArtist    = (amountBOut * ARTIST_FEE_BPS) / 10000;
        uint256 feeDao       = (amountBOut * DAO_FEE_BPS) / 10000;
        uint256 feeStrategic = (amountBOut * STRATEGIC_FEE_BPS) / 10000;
        uint256 amountBNet   = amountBOut - feeArtist - feeDao - feeStrategic;

        tokenA.transferFrom(msg.sender, address(this), amountAIn);
        tokenB.transfer(msg.sender, amountBNet);
        tokenB.transfer(artistWallet, feeArtist);
        tokenB.transfer(daoWallet, feeDao);
        tokenB.transfer(strategicWallet, feeStrategic);

        _update(tokenA.balanceOf(address(this)), tokenB.balanceOf(address(this)));
        emit Swap(msg.sender, address(tokenA), amountAIn, amountBNet, feeArtist, feeDao);
        emit FeesDistributed(feeArtist, feeDao, feeStrategic);
    }

    function swapBForA(uint256 amountBIn, uint256 minAmountAOut)
        external nonReentrant notRedeemed returns (uint256 amountAOut)
    {
        require(amountBIn > 0, "Zero input");
        require(reserveA > 0 && reserveB > 0, "No liquidity");

        uint256 amountInWithLPFee = amountBIn * (10000 - LP_FEE_BPS);
        uint256 numerator = amountInWithLPFee * reserveA;
        uint256 denominator = reserveB * 10000 + amountInWithLPFee;
        amountAOut = numerator / denominator;

        require(amountAOut >= minAmountAOut, "Slippage too high");
        require(amountAOut < reserveA, "Insufficient liquidity");

        uint256 feeArtist    = (amountAOut * ARTIST_FEE_BPS) / 10000;
        uint256 feeDao       = (amountAOut * DAO_FEE_BPS) / 10000;
        uint256 feeStrategic = (amountAOut * STRATEGIC_FEE_BPS) / 10000;
        uint256 amountANet   = amountAOut - feeArtist - feeDao - feeStrategic;

        tokenB.transferFrom(msg.sender, address(this), amountBIn);
        tokenA.transfer(msg.sender, amountANet);
        tokenA.transfer(artistWallet, feeArtist);
        tokenA.transfer(daoWallet, feeDao);
        tokenA.transfer(strategicWallet, feeStrategic);

        _update(tokenA.balanceOf(address(this)), tokenB.balanceOf(address(this)));
        emit Swap(msg.sender, address(tokenB), amountBIn, amountANet, feeArtist, feeDao);
        emit FeesDistributed(feeArtist, feeDao, feeStrategic);
    }

    // ─── LIQUIDITY ───────────────────────────────────────────────────────────

    function addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant notRedeemed returns (uint256 liquidity) {
        require(amountADesired > 0 && amountBDesired > 0, "Zero input");

        uint256 amountA;
        uint256 amountB;

        if (totalSupply == 0) {
            amountA = amountADesired;
            amountB = amountBDesired;
        } else {
            uint256 amountBOptimal = (amountADesired * reserveB) / reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Insufficient B amount");
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint256 amountAOptimal = (amountBDesired * reserveA) / reserveB;
                require(amountAOptimal >= amountAMin, "Insufficient A amount");
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
        }

        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transferFrom(msg.sender, address(this), amountB);

        if (totalSupply == 0) {
            liquidity = _sqrt(amountA * amountB);
        } else {
            liquidity = _min(
                (amountA * totalSupply) / reserveA,
                (amountB * totalSupply) / reserveB
            );
        }

        require(liquidity > 0, "Insufficient liquidity minted");
        totalSupply += liquidity;
        balanceOf[msg.sender] += liquidity;
        _update(tokenA.balanceOf(address(this)), tokenB.balanceOf(address(this)));
        emit AddLiquidity(msg.sender, amountA, amountB, liquidity);
    }

    function removeLiquidity(
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin
    ) external nonReentrant returns (uint256 amountA, uint256 amountB) {
        require(liquidity > 0, "Zero liquidity");
        require(balanceOf[msg.sender] >= liquidity, "Insufficient LP balance");

        amountA = (liquidity * reserveA) / totalSupply;
        amountB = (liquidity * reserveB) / totalSupply;
        require(amountA >= amountAMin, "Insufficient A output");
        require(amountB >= amountBMin, "Insufficient B output");

        balanceOf[msg.sender] -= liquidity;
        totalSupply -= liquidity;
        tokenA.transfer(msg.sender, amountA);
        tokenB.transfer(msg.sender, amountB);
        _update(tokenA.balanceOf(address(this)), tokenB.balanceOf(address(this)));
        emit RemoveLiquidity(msg.sender, amountA, amountB, liquidity);
    }

    // ─── REDEEM ──────────────────────────────────────────────────────────────

    /**
     * @dev Resgate físico: quem tiver 100% das frações pode resgatar a obra
     * Queima os tokens e emite evento para iniciar entrega física
     */
    function redeem() external nonReentrant notRedeemed {
        uint256 callerBalance = tokenA.balanceOf(msg.sender);
        require(callerBalance >= totalFractions, "Must hold 100% of fractions");

        isRedeemed = true;

        // Devolve NEURO da pool para LPs proporcionalmente — pool encerra
        uint256 neuroInPool = tokenB.balanceOf(address(this));
        if (neuroInPool > 0) {
            tokenB.transfer(daoWallet, neuroInPool);
        }

        emit Redeemed(msg.sender, callerBalance);
    }

    // ─── VIEW ────────────────────────────────────────────────────────────────

    function getReserves() external view returns (uint256 _reserveA, uint256 _reserveB) {
        return (reserveA, reserveB);
    }

    function getPrice() external view returns (uint256 priceAInB) {
        if (reserveA == 0) return 0;
        return (reserveB * 1e18) / reserveA;
    }

    function getAmountOut(uint256 amountIn, bool aToB) external view returns (uint256) {
        if (reserveA == 0 || reserveB == 0) return 0;
        uint256 rIn  = aToB ? reserveA : reserveB;
        uint256 rOut = aToB ? reserveB : reserveA;
        uint256 amountInWithFee = amountIn * (10000 - LP_FEE_BPS);
        return (amountInWithFee * rOut) / (rIn * 10000 + amountInWithFee);
    }

    // ─── INTERNAL ────────────────────────────────────────────────────────────

    function _update(uint256 balanceA, uint256 balanceB) private {
        reserveA = balanceA;
        reserveB = balanceB;
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) { z = x; x = (y / x + x) / 2; }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
