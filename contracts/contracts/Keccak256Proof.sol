// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./verifiers/contract.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./TestToken.sol";

import "hardhat/console.sol";

contract Keccak256Proof {
    HonkVerifier verifier;
    TestToken testToken;

    constructor() {
        verifier = new HonkVerifier();
        testToken = new TestToken();
    }

    error NumTooBig();

    address proofRan;

    function testProof(
        bytes calldata _proof,
        bytes32[] calldata _publicInputs
    ) public {
        bytes32 willItWork = combinePublicInputs(_publicInputs);

        bool validProof = verifier.verify(_proof, _publicInputs);

        require(validProof, "Proof Failed");

        proofRan = address(1);

        console.logBytes32(willItWork);
    }

    function deposit(
        address _erc20,
        uint64 _depositAmount,
        bytes32 _leaf
    ) public {
        if (_depositAmount == type(uint64).max) {
            revert NumTooBig();
        }

        ERC20 token = ERC20(_erc20);

        uint256 erc20Amount = _depositAmount * 10 ** token.decimals();

        token.transferFrom(msg.sender, address(this), erc20Amount);
    }

    function convertToBytes32(
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
        bytes32 test = keccak256(abi.encode(bytes32(0)));
        return test;
    }

    function combinePublicInputs(
        bytes32[] calldata _publicInputs
    ) public pure returns (bytes32) {
        require(
            _publicInputs.length == 32,
            "Input must have exactly 32 elements"
        );

        bytes32 result;

        for (uint256 i = 0; i < 32; i++) {
            // Extract the least significant byte from each bytes32 element
            uint8 lsb = uint8(uint256(_publicInputs[i]) & 0xff);

            // Shift it to its correct position in the final result and combine with OR
            result = result | bytes32(uint256(lsb) << (8 * (31 - i)));
        }

        return result;
    }
}
