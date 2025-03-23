// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./MerkleTree.sol";
import "./verifiers/NoteVerifier.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "hardhat/console.sol";

contract CommBankDotEth is MerkleTree {
    NoteVerifier noteVerifier;

    constructor() MerkleTree() {
        noteVerifier = new NoteVerifier();
    }

    function reconstructAddressFromArray(
        bytes32[] calldata _inputs
    ) public pure returns (address) {
        require(_inputs.length == 20, "Invalid length");

        bytes32 result;

        for (uint256 i = 0; i < 20; i++) {
            // Extract the least significant byte from each bytes32 element
            uint8 lsb = uint8(uint256(_inputs[i]) & 0xff);

            // Shift it to its correct position in the final result and combine with OR
            // We need to place bytes in positions 19-0 (least significant 20 bytes)
            result = result | bytes32(uint256(lsb) << (8 * (19 - i)));
        }

        return address(uint160(uint256(result)));
    }

    function reconstructBytes32FromArray(
        bytes32[] calldata _inputs
    ) public pure returns (bytes32) {
        require(_inputs.length == 32, "Input must have exactly 32 elements");

        bytes32 result;

        for (uint256 i = 0; i < 32; i++) {
            // Extract the least significant byte from each bytes32 element
            uint8 lsb = uint8(uint256(_inputs[i]) & 0xff);

            // Shift it to its correct position in the final result and combine with OR
            result = result | bytes32(uint256(lsb) << (8 * (31 - i)));
        }

        return result;
    }

    function deposit(
        address _erc20,
        uint256 _amount, // !dev no exponent here
        bytes calldata _proof,
        bytes32[] calldata _publicInputs
    ) public {
        uint8 decimals = ERC20(_erc20).decimals();

        bool depositTransfer = ERC20(_erc20).transferFrom(
            msg.sender,
            address(this),
            _amount * 10 ** decimals
        );

        require(depositTransfer, "failed to transfer");

        // Log each public input for debugging
        console.log("Public Inputs Length:", _publicInputs.length);

        bytes32 noteHash = reconstructBytes32FromArray(_publicInputs[0:32]);
        console.logBytes32(noteHash);

        address depositAddress = reconstructAddressFromArray(
            _publicInputs[65:85]
        );
        bytes32 value = _publicInputs[32];
        require(_erc20 == depositAddress, "invalid address reconstruction");
        require(uint256(value) == _amount, "invalid amount reconstruction");

        // bytes32 otherValue = reconstructBytes32FromArray(_publicInputs[33:65]);
        // console.log(uint256(otherValue));

        bool validProof = noteVerifier.verify(_proof, _publicInputs);

        require(validProof, "Proof Failed");
    }
}
