// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title NeuroArtVaultV2
 * @notice Cofre de uma obra fracionada (implementação usada por clones ERC-1167).
 * @dev Correções em relação ao v1:
 *  - name()/symbol() vêm do storage do clone (no v1 o constructor não roda no clone e o token ficava sem nome)
 *  - _disableInitializers() no constructor: a implementação não pode ser inicializada por terceiros
 *  - destinatário das frações separado do artista (permite mintar direto para quem vai listar)
 * Threshold Redemption: quem tiver 100% das frações resgata a obra física (tokens queimados).
 */
contract NeuroArtVaultV2 is ERC20, Initializable {
    uint256 public constant MAX_FRACTIONS = 100_000_000;

    string private _vaultName;
    string private _vaultSymbol;

    uint256 public obraId;
    string public ipfsHash;
    address public artist;
    bool public isRedeemed;
    uint256 public totalFractions; // em unidades de 18 decimais

    event VaultInitialized(uint256 indexed obraId, address indexed artist, address indexed recipient, string ipfsHash, uint256 fractions);
    event PhysicalRedeemed(address indexed redeemer, uint256 indexed obraId);

    constructor() ERC20("", "") {
        _disableInitializers();
    }

    /**
     * @param name_      nome do token (ex: "NeuroArt El Olvidao")
     * @param symbol_    símbolo (ex: "NA-OLV")
     * @param obraId_    ID da obra no banco
     * @param ipfsHash_  CID dos metadados
     * @param artist_    carteira do artista (registro on-chain da autoria)
     * @param fractions_ número inteiro de frações (1 .. 100.000.000)
     * @param recipient_ quem recebe 100% das frações mintadas
     */
    function initialize(
        string calldata name_,
        string calldata symbol_,
        uint256 obraId_,
        string calldata ipfsHash_,
        address artist_,
        uint256 fractions_,
        address recipient_
    ) external initializer {
        require(bytes(name_).length > 0 && bytes(symbol_).length > 0, "Vault: name/symbol required");
        require(artist_ != address(0) && recipient_ != address(0), "Vault: zero address");
        require(fractions_ >= 1 && fractions_ <= MAX_FRACTIONS, "Vault: fractions out of range");

        _vaultName = name_;
        _vaultSymbol = symbol_;
        obraId = obraId_;
        ipfsHash = ipfsHash_;
        artist = artist_;
        totalFractions = fractions_ * 1e18;
        _mint(recipient_, totalFractions);

        emit VaultInitialized(obraId_, artist_, recipient_, ipfsHash_, fractions_);
    }

    function name() public view override returns (string memory) {
        return _vaultName;
    }

    function symbol() public view override returns (string memory) {
        return _vaultSymbol;
    }

    /// @notice Resgate físico: exige 100% das frações na carteira de quem chama. Queima tudo.
    function redeemPhysical() external {
        require(!isRedeemed, "Vault: already redeemed");
        require(balanceOf(msg.sender) == totalFractions, "Vault: need 100% of fractions");
        isRedeemed = true;
        _burn(msg.sender, totalFractions);
        emit PhysicalRedeemed(msg.sender, obraId);
    }

    /// @notice Participação em basis points (1% = 100 bps)
    function ownershipBps(address holder) external view returns (uint256) {
        if (totalFractions == 0) return 0;
        return (balanceOf(holder) * 10_000) / totalFractions;
    }
}
