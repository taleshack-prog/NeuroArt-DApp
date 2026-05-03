// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title NeuroArtFractionalVault
 * @dev Cofre de obra fracionada. Um deploy por obra de arte.
 * O artista define quantas frações quer emitir no momento da tokenização.
 * Threshold Redemption: 100% das frações = resgate físico da obra.
 *
 * Exemplos de uso:
 *   - Obra popular:  10.000.000 frações (muitos investidores pequenos)
 *   - Obra exclusiva:      1.000 frações (poucos colecionadores)
 *   - Obra média:        100.000 frações (padrão recomendado)
 */
contract NeuroArtFractionalVault is ERC20, Initializable {
    uint256 public obraId;
    string public ipfsHash;
    address public artist;
    bool public isRedeemed;
    uint256 public totalFractions; // definido pelo artista

    event VaultInitialized(uint256 indexed obraId, address indexed artist, string ipfsHash, uint256 totalFractions);
    event PhysicalRedeemed(address indexed redeemer, uint256 indexed obraId);

    constructor() ERC20("NeuroArt Fraction", "NAF") {}

    /**
     * @param _obraId       ID único da obra
     * @param _ipfsHash     CID IPFS dos metadados da obra
     * @param _artist       Carteira do artista (recebe 100% das frações)
     * @param _totalFractions Quantidade de frações definida pelo artista
     */
    function initialize(
        uint256 _obraId,
        string calldata _ipfsHash,
        address _artist,
        uint256 _totalFractions
    ) external initializer {
        require(_totalFractions >= 1, "Vault: minimum 1 fraction");
        require(_totalFractions <= 100_000_000 * 10 ** 18, "Vault: maximum 100M fractions");
        obraId = _obraId;
        ipfsHash = _ipfsHash;
        artist = _artist;
        isRedeemed = false;
        totalFractions = _totalFractions * 10 ** 18;
        _mint(_artist, totalFractions);
        emit VaultInitialized(_obraId, _artist, _ipfsHash, _totalFractions);
    }

    /**
     * @dev Resgate físico: exige 100% das frações em carteira.
     * Queima todos os tokens e registra o resgate on-chain.
     */
    function redeemPhysical() external {
        require(!isRedeemed, "Vault: already redeemed");
        require(balanceOf(msg.sender) == totalFractions, "Vault: need 100% of fractions");
        isRedeemed = true;
        _burn(msg.sender, totalFractions);
        emit PhysicalRedeemed(msg.sender, obraId);
    }

    /**
     * @dev Retorna participação em basis points (1% = 100 bps)
     */
    function ownershipBps(address holder) external view returns (uint256) {
        return (balanceOf(holder) * 10_000) / totalFractions;
    }
}
