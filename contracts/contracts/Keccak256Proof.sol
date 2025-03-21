// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./contract.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract Keccak256Proof {
    HonkVerifier verifier;

    constructor() {
        verifier = new HonkVerifier();
    }

    function convertToByte32(
        uint8[32] memory _array
    ) public view returns (bytes32) {
        bytes32 result;

        for (uint256 i = 0; i < 32; i++) {
            // Shift each byte to its correct position and OR it with the result
            result = result | bytes32(uint256(_array[i]) << (8 * (31 - i)));
        }

        return result;
    }

    function keccakTest() public view returns (bytes32) {
        uint8[32] memory array = [
            41,
            13,
            236,
            217,
            84,
            139,
            98,
            168,
            214,
            3,
            69,
            169,
            136,
            56,
            111,
            200,
            75,
            166,
            188,
            149,
            72,
            64,
            8,
            246,
            54,
            47,
            147,
            22,
            14,
            243,
            229,
            99
        ];

        bytes32 recon = convertToByte32(array);

        console.logBytes32(recon);

        bytes32 test = keccak256(abi.encode(bytes32(0)));
        return test;
    }
}
