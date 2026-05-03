// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface INeuroArtFractionalVault {
    function initialize(
        uint256 obraId,
        string calldata ipfsHash,
        address artist,
        uint256 totalFractions
    ) external;
}

/**
 * @title ArtVaultFactory
 * @dev Fábrica de cofres usando Minimal Proxy ERC1167.
 * Cada obra tem seu próprio vault com frações definidas pelo artista.
 * Controlada pelos fundadores: Tales Hack e Prof. Alexandre Fortis.
 */
contract ArtVaultFactory is Ownable {
    using Clones for address;

    address public immutable IMPLEMENTATION;
    address public coFounder;

    mapping(uint256 => address) public obraToVault;
    uint256[] public allObraIds;

    event VaultDeployed(
        uint256 indexed obraId,
        address indexed vault,
        address indexed artist,
        string ipfsHash,
        uint256 totalFractions
    );
    event CoFounderUpdated(address newCoFounder);

    constructor(address _implementation, address _coFounder) Ownable(msg.sender) {
        IMPLEMENTATION = _implementation;
        coFounder = _coFounder;
    }

    modifier onlyFounders() {
        require(
            msg.sender == owner() || msg.sender == coFounder,
            "Factory: only founders"
        );
        _;
    }

    /**
     * @param obraId        ID único da obra
     * @param ipfsHash      CID IPFS dos metadados
     * @param artist        Carteira do artista
     * @param totalFractions Quantidade de frações (decisão do artista, mín 100)
     */
    function createVault(
        uint256 obraId,
        string calldata ipfsHash,
        address artist,
        uint256 totalFractions
    ) external onlyFounders returns (address vault) {
        require(obraToVault[obraId] == address(0), "Factory: vault exists");
        require(artist != address(0), "Factory: invalid artist");
        vault = IMPLEMENTATION.clone();
        INeuroArtFractionalVault(vault).initialize(obraId, ipfsHash, artist, totalFractions);
        obraToVault[obraId] = vault;
        allObraIds.push(obraId);
        emit VaultDeployed(obraId, vault, artist, ipfsHash, totalFractions);
    }

    function massDeploy(
        uint256[] calldata obraIds,
        string[] calldata ipfsHashes,
        address[] calldata artists,
        uint256[] calldata fractionAmounts
    ) external onlyFounders {
        require(
            obraIds.length == ipfsHashes.length &&
            ipfsHashes.length == artists.length &&
            artists.length == fractionAmounts.length,
            "Factory: length mismatch"
        );
        for (uint256 i = 0; i < obraIds.length; ++i) {
            this.createVault(obraIds[i], ipfsHashes[i], artists[i], fractionAmounts[i]);
        }
    }

    function getVault(uint256 obraId) external view returns (address) {
        return obraToVault[obraId];
    }

    function totalObras() external view returns (uint256) {
        return allObraIds.length;
    }

    function updateCoFounder(address _new) external onlyOwner {
        coFounder = _new;
        emit CoFounderUpdated(_new);
    }
}
