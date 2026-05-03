// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DocumentRegistry
 * @dev Registro imutável de documentos oficiais do NeuroArt DApp.
 * Armazena hashes SHA-256 de documentos para prova de existência e integridade.
 * Controlado pelos fundadores: Tales Hack e Prof. Alexandre de Souza Fortis.
 */
contract DocumentRegistry is Ownable {
    struct Document {
        string name;
        bytes32 hash;
        string ipfsCid;
        uint256 timestamp;
        address registeredBy;
    }

    mapping(bytes32 => Document) public documents;
    bytes32[] public allDocumentHashes;

    event DocumentRegistered(
        bytes32 indexed hash,
        string name,
        string ipfsCid,
        address indexed registeredBy,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Registra um documento pelo seu hash SHA-256.
     * @param name Nome do documento
     * @param sha256Hash Hash SHA-256 em bytes32
     * @param ipfsCid CID IPFS do documento (opcional, pode ser vazio)
     */
    function registerDocument(
        string calldata name,
        bytes32 sha256Hash,
        string calldata ipfsCid
    ) external onlyOwner {
        require(documents[sha256Hash].timestamp == 0, "Registry: document already registered");
        documents[sha256Hash] = Document({
            name: name,
            hash: sha256Hash,
            ipfsCid: ipfsCid,
            timestamp: block.timestamp,
            registeredBy: msg.sender
        });
        allDocumentHashes.push(sha256Hash);
        emit DocumentRegistered(sha256Hash, name, ipfsCid, msg.sender, block.timestamp);
    }

    /**
     * @dev Verifica se um documento está registrado.
     */
    function verifyDocument(bytes32 sha256Hash) external view returns (bool exists, uint256 timestamp, string memory name) {
        Document memory doc = documents[sha256Hash];
        return (doc.timestamp > 0, doc.timestamp, doc.name);
    }

    function totalDocuments() external view returns (uint256) {
        return allDocumentHashes.length;
    }
}
