// SPDX-License-Identifier: UNLICENSED
















pragma solidity ^0.8.15;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Part: IERC20Taxable

interface IERC20Taxable is IERC20 {
    function getCurrentTaxRate() external returns (uint256);
}
