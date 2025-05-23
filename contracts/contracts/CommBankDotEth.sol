// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./KeccakMerkleTree.sol";

import {NoteVerifier} from "./verifiers/NoteVerifier.sol";
import {TransactVerifier} from "./verifiers/TransactVerifier.sol";
import {WithdrawVerifier} from "./verifiers/WithdrawVerifier.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

//                             ___.                  __               __  .__
//   ____  ____   _____   _____\_ |__ _____    ____ |  | __     _____/  |_|  |__
// _/ ___\/  _ \ /     \ /     \| __ \\__  \  /    \|  |/ /   _/ __ \   __\  |  \
// \  \__(  <_> )  Y Y  \  Y Y  \ \_\ \/ __ \|   |  \    <    \  ___/|  | |   Y  \
//  \___  >____/|__|_|  /__|_|  /___  (____  /___|  /__|_ \ /\ \___  >__| |___|  /
//      \/            \/      \/    \/     \/     \/     \/ \/     \/          \/
//
// author: benhooper.eth

contract CommBankDotEth is KeccakMerkleTree {
    NoteVerifier noteVerifier;
    TransactVerifier transactVerifier;
    WithdrawVerifier withdrawVerifier;

    mapping(bytes32 => bool) public nullifierUsed;

    constructor(
        address _noteVerifier,
        address _transactVerifier,
        address _withdrawalVerifier
    ) KeccakMerkleTree() {
        noteVerifier = NoteVerifier(_noteVerifier);
        transactVerifier = TransactVerifier(_transactVerifier);
        withdrawVerifier = WithdrawVerifier(_withdrawalVerifier);
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

    event LeafAdded(uint256 indexed leafIndex, bytes32 indexed leaf);
    event EncryptedSecret(uint256 indexed leafIndex, bytes payload);
    event NullifierUsed(bytes32 indexed nullifier);
    event Withdrawal(address withdrawTo, address asset, uint256 amount);

    function deposit(
        address _erc20,
        uint256 _amount, // !dev no exponent here
        bytes calldata _proof,
        bytes32[] calldata _publicInputs,
        bytes calldata _payload
    ) public {
        // !! REQUIRED ON MAINNET !!
        // require(
        //     msg.sender == 0x0981c335A692a5Fd933887B02F74d13148f50323,
        //     "Sorry :( I don't make the rules"
        // );

        uint8 decimals = ERC20(_erc20).decimals();

        bool depositTransfer = ERC20(_erc20).transferFrom(
            msg.sender,
            address(this),
            _amount * 10 ** decimals
        );

        require(depositTransfer, "failed to transfer");

        bytes32 noteHash = reconstructBytes32FromArray(_publicInputs[0:32]);
        address depositAddress = reconstructAddressFromArray(
            _publicInputs[65:85]
        );
        bytes32 value = _publicInputs[32];
        require(_erc20 == depositAddress, "invalid address reconstruction");
        require(uint256(value) == _amount, "invalid amount reconstruction");

        bool validProof = noteVerifier.verify(_proof, _publicInputs);

        require(validProof, "Proof Failed");

        uint256 index = _insert(noteHash);

        emit LeafAdded(index, noteHash);
        emit EncryptedSecret(index, _payload);
    }

    // NOTE: this is currently only accepting 2 input/output notes proof times were getting
    // too large
    function transfer(
        bytes calldata _proof,
        bytes32[] calldata _publicInputs,
        bytes[] calldata _payloads
    ) public {
        bool validProof = transactVerifier.verify(_proof, _publicInputs);
        require(validProof, "not a valid proof");

        // Reconstruct the root, nullifiers, and output hashes
        bytes32 root = reconstructBytes32FromArray(_publicInputs[0:32]);

        // Verify the root exists in our Merkle tree
        require(isKnownRoot(root), "Unknown Merkle root");

        bytes32 nullifier1 = reconstructBytes32FromArray(_publicInputs[32:64]);
        require(!nullifierUsed[nullifier1], "nullifier1 is already used");

        bytes32 nullifier2 = reconstructBytes32FromArray(_publicInputs[64:96]);
        require(!nullifierUsed[nullifier2], "nullifier2 is already used");

        // nullifiers are used, mark them as used
        if (nullifier1 != bytes32(0)) {
            nullifierUsed[nullifier1] = true;
            emit NullifierUsed(nullifier1);
        }
        if (nullifier2 != bytes32(0)) {
            nullifierUsed[nullifier2] = true;
            emit NullifierUsed(nullifier2);
        }

        bytes32 outputHash1 = reconstructBytes32FromArray(
            _publicInputs[96:128]
        );
        bytes32 outputHash2 = reconstructBytes32FromArray(
            _publicInputs[128:160]
        );

        // Insert new output notes into the tree
        uint256 index1 = _insert(outputHash1);
        uint256 index2 = _insert(outputHash2);

        // Emit events for the new leaves
        emit LeafAdded(index1, outputHash1);
        emit EncryptedSecret(index1, _payloads[0]);

        emit LeafAdded(index2, outputHash2);
        emit EncryptedSecret(index2, _payloads[1]);
    }

    function withdraw(
        bytes calldata _proof,
        bytes32[] calldata _publicInputs,
        address _withdrawTo
    ) public {
        bool validProof = withdrawVerifier.verify(_proof, _publicInputs);
        require(validProof, "not a valid proof");

        // Reconstruct the root and check we have it in our history
        bytes32 root = reconstructBytes32FromArray(_publicInputs[0:32]);
        require(isKnownRoot(root), "Unknown Merkle root");

        // ensure nullifiers aren't spent
        bytes32 nullifier1 = reconstructBytes32FromArray(_publicInputs[32:64]);
        require(!nullifierUsed[nullifier1], "nullifier1 is already used");

        bytes32 nullifier2 = reconstructBytes32FromArray(_publicInputs[64:96]);
        require(!nullifierUsed[nullifier2], "nullifier2 is already used");

        address address1 = reconstructAddressFromArray(_publicInputs[96:116]);
        address address2 = reconstructAddressFromArray(_publicInputs[116:136]);

        uint256 amount1 = uint256(_publicInputs[136]);
        uint256 amount2 = uint256(_publicInputs[137]);

        // nullifiers are used, mark them as used
        if (nullifier1 != bytes32(0)) {
            nullifierUsed[nullifier1] = true;
            emit NullifierUsed(nullifier1);
        }
        if (nullifier2 != bytes32(0)) {
            nullifierUsed[nullifier2] = true;
            emit NullifierUsed(nullifier2);
        }

        if (address1 != address(0)) {
            bool withdraw1 = ERC20(address1).transfer(
                _withdrawTo,
                amount1 * 10 ** ERC20(address1).decimals()
            );
            require(withdraw1, "failed to withdraw1");
            emit Withdrawal(_withdrawTo, address1, amount1);
        }

        if (address2 != address(0)) {
            bool withdraw2 = ERC20(address2).transfer(
                _withdrawTo,
                amount2 * 10 ** ERC20(address2).decimals()
            );
            require(withdraw2, "failed to withdraw2");

            emit Withdrawal(_withdrawTo, address2, amount2);
        }
    }
}
