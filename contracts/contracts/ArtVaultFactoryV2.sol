// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

interface INeuroArtVaultV2 {
    function initialize(
        string calldata name_,
        string calldata symbol_,
        uint256 obraId_,
        string calldata ipfsHash_,
        address artist_,
        uint256 fractions_,
        address recipient_
    ) external;
}

/**
 * @title ArtVaultFactoryV2
 * @notice Cria um vault (clone ERC-1167) por obra.
 * @dev Correções em relação ao v1:
 *  - massDeploy chamava `this.createVault`, o que trocava o msg.sender para a própria factory
 *    e fazia o onlyFounders reverter sempre. Agora usa uma função interna.
 *  - Papéis via AccessControl: DEFAULT_ADMIN_ROLE (gestão de papéis) e FOUNDER_ROLE (criar vaults).
 */
contract ArtVaultFactoryV2 is AccessControl {
    using Clones for address;

    bytes32 public constant FOUNDER_ROLE = keccak256("FOUNDER_ROLE");

    address public immutable IMPLEMENTATION;

    mapping(uint256 => address) public obraToVault;
    uint256[] public allObraIds;

    event VaultDeployed(uint256 indexed obraId, address indexed vault, address indexed artist, string ipfsHash, uint256 fractions);

    struct VaultParams {
        uint256 obraId;
        string name;
        string symbol;
        string ipfsHash;
        address artist;
        uint256 fractions;
        address recipient;
    }

    /**
     * @param implementation_ endereço do NeuroArtVaultV2 de referência
     * @param admin_          administrador (ex: neuroarte.eth)
     * @param coFounder_      cofundador (recebe FOUNDER_ROLE; pode ser address(0))
     */
    constructor(address implementation_, address admin_, address coFounder_) {
        require(implementation_ != address(0) && admin_ != address(0), "Factory: zero address");
        IMPLEMENTATION = implementation_;
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(FOUNDER_ROLE, admin_);
        if (coFounder_ != address(0)) _grantRole(FOUNDER_ROLE, coFounder_);
    }

    function createVault(VaultParams calldata p) external onlyRole(FOUNDER_ROLE) returns (address) {
        return _createVault(p);
    }

    function massDeploy(VaultParams[] calldata ps) external onlyRole(FOUNDER_ROLE) {
        for (uint256 i = 0; i < ps.length; ++i) {
            _createVault(ps[i]);
        }
    }

    function _createVault(VaultParams calldata p) internal returns (address vault) {
        require(obraToVault[p.obraId] == address(0), "Factory: vault exists");
        vault = IMPLEMENTATION.clone();
        INeuroArtVaultV2(vault).initialize(p.name, p.symbol, p.obraId, p.ipfsHash, p.artist, p.fractions, p.recipient);
        obraToVault[p.obraId] = vault;
        allObraIds.push(p.obraId);
        emit VaultDeployed(p.obraId, vault, p.artist, p.ipfsHash, p.fractions);
    }

    function getVault(uint256 obraId) external view returns (address) {
        return obraToVault[obraId];
    }

    function totalObras() external view returns (uint256) {
        return allObraIds.length;
    }
}
