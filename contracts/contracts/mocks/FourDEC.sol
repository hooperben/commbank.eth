// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract FourDEC is ERC20 {
    constructor() ERC20("FourDEC", "FourDEC") {
        _mint(msg.sender, 1000 * 10 ** 4);
    }

    function decimals() public pure override returns (uint8) {
        return 4;
    }

    function mint(address _recipient, uint256 _amount) public {
        _mint(_recipient, _amount);
    }
}
