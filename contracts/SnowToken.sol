// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BWSToken is ERC20 {
    constructor() ERC20("Real Estate Farm", "BWS") {
        _mint(msg.sender, 1050 * 10 ** uint(18));
    }

    function decimals() public view virtual override returns (uint8) {
        return 18;
    }
}
