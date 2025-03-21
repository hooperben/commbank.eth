// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Keccak256Proof {
    constructor() {}

    function keccakTest() public pure returns (bytes32) {
        bytes32 test = keccak256(abi.encode(bytes32(0)));
        return test;
    }
}
