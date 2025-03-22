// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("test", "test") {}

    function mint(address _recipient, uint256 _amount) public {
        _mint(_recipient, _amount);
    }
}
