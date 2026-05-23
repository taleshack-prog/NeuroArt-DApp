// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./NeuroArtAMM.sol";

/**
 * @title NeuroArtAMMFactory
 * @dev Cria pools AMM para cada obra tokenizada
 * Integrado com ArtVaultFactory existente
 */
contract NeuroArtAMMFactory is Ownable {

    address public immutable neuroToken;
    address public immutable daoWallet;
    address public immutable strategicWallet;

    mapping(address => address) public obraToPool;
    address[] public allPools;

    event PoolCreated(
        address indexed obraToken,
        address indexed pool,
        address indexed artistWallet,
        uint256 totalFractions
    );

    constructor(
        address _neuroToken,
        address _daoWallet,
        address _strategicWallet
    ) Ownable(msg.sender) {
        neuroToken = _neuroToken;
        daoWallet = _daoWallet;
        strategicWallet = _strategicWallet;
    }

    /**
     * @dev Cria pool AMM para uma obra ja tokenizada
     * Chamado pelos fundadores apos aprovacao da obra
     */
    function createPool(
        address obraToken,
        address artistWallet,
        uint256 totalFractions
    ) external onlyOwner returns (address pool) {
        require(obraToPool[obraToken] == address(0), "Pool already exists");
        require(obraToken != address(0), "Invalid obra token");
        require(artistWallet != address(0), "Invalid artist wallet");
        require(totalFractions > 0, "Invalid fractions");

        NeuroArtAMM newPool = new NeuroArtAMM(
            obraToken,
            neuroToken,
            artistWallet,
            daoWallet,
            strategicWallet,
            totalFractions
        );

        pool = address(newPool);
        obraToPool[obraToken] = pool;
        allPools.push(pool);

        emit PoolCreated(obraToken, pool, artistWallet, totalFractions);
    }

    /**
     * @dev Bootstrap inicial de liquidez pelos fundadores
     * Usa NEURO ja existente — sem mint
     */
    function bootstrapLiquidity(
        address obraToken,
        uint256 amountFractions,
        uint256 amountNeuro,
        uint256 minFractions,
        uint256 minNeuro
    ) external onlyOwner {
        address pool = obraToPool[obraToken];
        require(pool != address(0), "Pool does not exist");

        IERC20(obraToken).transferFrom(msg.sender, address(this), amountFractions);
        IERC20(neuroToken).transferFrom(msg.sender, address(this), amountNeuro);

        IERC20(obraToken).approve(pool, amountFractions);
        IERC20(neuroToken).approve(pool, amountNeuro);

        NeuroArtAMM(pool).addLiquidity(
            amountFractions,
            amountNeuro,
            minFractions,
            minNeuro
        );
    }

    function getPool(address obraToken) external view returns (address) {
        return obraToPool[obraToken];
    }

    function totalPools() external view returns (uint256) {
        return allPools.length;
    }

    function isPoolActive(address obraToken) external view returns (bool) {
        address pool = obraToPool[obraToken];
        if (pool == address(0)) return false;
        (uint256 rA, uint256 rB) = NeuroArtAMM(pool).getReserves();
        return rA > 0 && rB > 0;
    }
}
