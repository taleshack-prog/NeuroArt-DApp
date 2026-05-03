// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NeuroToken ($NEURO)
 * @dev Token ERC20 deflacionário do ecossistema NeuroArt DApp.
 * Supply total: 10.000.000 NEURO
 * Distribuição: 70% público, 15% Tales Hack, 15% Prof. Alexandre Fortis
 * Burn: 1% nas taxas de marketplace
 */
contract NeuroToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant BURN_RATE_BPS = 100; // 1% = 100 basis points
    uint256 public constant TOTAL_SUPPLY = 10_000_000 * 10 ** 18;

    event TokensBurned(address indexed from, uint256 amount);

    constructor() ERC20("NeuroArt Token", "NEURO") Ownable(msg.sender) {
        _mint(msg.sender, TOTAL_SUPPLY);
    }

    /**
     * @dev Transferência com burn automático de 1% — usada pelo marketplace
     */
    function transferWithBurn(address to, uint256 amount) external returns (bool) {
        uint256 burnAmount = (amount * BURN_RATE_BPS) / 10_000;
        uint256 transferAmount = amount - burnAmount;
        _burn(msg.sender, burnAmount);
        _transfer(msg.sender, to, transferAmount);
        emit TokensBurned(msg.sender, burnAmount);
        return true;
    }
}
