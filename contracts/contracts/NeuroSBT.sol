// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NeuroSBT — Soulbound Token
 * @dev Identidade imutável do artista neurodivergente verificado.
 * INTRANSFERÍVEL: transferFrom e approve sempre revertem.
 * Emitido pelos fundadores Tales Hack e Prof. Alexandre Fortis.
 */
contract NeuroSBT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    mapping(address => bool) public hasSBT;
    mapping(uint256 => string) private _tokenURIs;

    event SBTMinted(address indexed artist, uint256 indexed tokenId, string metadataURI);

    constructor() ERC721("NeuroArt Soulbound", "NSBT") Ownable(msg.sender) {}

    function mintSBT(address artist, string memory metadataURI) external onlyOwner {
        require(!hasSBT[artist], "SBT: artist already verified");
        uint256 tokenId = ++_tokenIdCounter;
        hasSBT[artist] = true;
        _tokenURIs[tokenId] = metadataURI;
        _mint(artist, tokenId);
        emit SBTMinted(artist, tokenId, metadataURI);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    // SOULBOUND — bloqueio total de transferência
    function transferFrom(address, address, uint256) public pure override {
        revert("SBT: non-transferable");
    }

    function safeTransferFrom(address, address, uint256, bytes memory) public pure override {
        revert("SBT: non-transferable");
    }

    function approve(address, uint256) public pure override {
        revert("SBT: non-transferable");
    }

    function setApprovalForAll(address, bool) public pure override {
        revert("SBT: non-transferable");
    }
}
