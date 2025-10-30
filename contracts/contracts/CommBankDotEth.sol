// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

//                             ___.                  __               __  .__
//   ____  ____   _____   _____\_ |__ _____    ____ |  | __     _____/  |_|  |__
// _/ ___\/  _ \ /     \ /     \| __ \\__  \  /    \|  |/ /   _/ __ \   __\  |  \
// \  \__(  <_> )  Y Y  \  Y Y  \ \_\ \/ __ \|   |  \    <    \  ___/|  | |   Y  \
//  \___  >____/|__|_|  /__|_|  /___  (____  /___|  /__|_ \ /\ \___  >__| |___|  /
//      \/            \/      \/    \/     \/     \/     \/ \/     \/          \/
//
// author: benhooper.eth

import "./PoseidonMerkleTree.sol";

import {DepositVerifier} from "./verifiers/DepositVerifier.sol";
import {TransferVerifier} from "./verifiers/TransferVerifier.sol";
import {WithdrawVerifier} from "./verifiers/WithdrawVerifier.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract CommBankDotEth is PoseidonMerkleTree, AccessControl {
    DepositVerifier depositVerifier;
    TransferVerifier transferVerifier;
    WithdrawVerifier withdrawVerifier;

    mapping(bytes32 => bool) public nullifierUsed;

    bytes32 public DEPOSIT_ROLE = keccak256("DEPOSIT_ROLE");

    event NullifierUsed(uint256 indexed nullifier);
    event NotePayload(bytes encryptedNote);

    uint256 constant NOTES_INPUT_LENGTH = 3;
    uint256 constant EXIT_ASSET_START_INDEX = 4;
    uint256 constant EXIT_AMOUNT_START_INDEX = 7;
    uint256 constant EXIT_ADDRESSES_START_INDEX = 10;

    constructor(
        address _noteVerifier,
        address _transactVerifier,
        address _withdrawalVerifier
    ) PoseidonMerkleTree(12) {
        depositVerifier = DepositVerifier(_noteVerifier);
        transferVerifier = TransferVerifier(_transactVerifier);
        withdrawVerifier = WithdrawVerifier(_withdrawalVerifier);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEPOSIT_ROLE, msg.sender);
    }

    function deposit(
        address _erc20,
        uint64 _amount, // with decimals !!
        bytes calldata _proof,
        bytes32[] calldata _publicInputs,
        bytes[] calldata _payload
    ) public onlyRole(DEPOSIT_ROLE) {
        bool depositTransfer = ERC20(_erc20).transferFrom(
            msg.sender,
            address(this),
            _amount
        );
        require(depositTransfer, "failed to transfer deposit");

        // VERIFY PROOF
        bool isValidProof = depositVerifier.verify(_proof, _publicInputs);
        require(isValidProof, "Invalid deposit proof!");

        // CHECK INPUT ADDRESS AND AMOUNT MATCH PROOF INPUTS
        require(
            _erc20 == address(uint160(uint256(_publicInputs[1]))),
            "ERC20 address mismatch"
        );
        require(
            _amount == uint64(uint256(_publicInputs[2])),
            "Address amount incorrect"
        );

        // INSERT NOTE INTO TREE
        _insert(uint256(_publicInputs[0]));

        for (uint256 i = 0; i < 3 && i < _payload.length; i++) {
            if (_payload[i].length != 0) {
                emit NotePayload(_payload[i]);
            }
        }
    }

    function transfer(
        bytes calldata _proof,
        bytes32[] calldata _publicInputs,
        bytes[] calldata _payload
    ) public {
        // verify the root is in the trees history
        require(isKnownRoot(uint256(_publicInputs[0])), "Invalid Root!");

        // verify the proof
        bool isValidProof = transferVerifier.verify(_proof, _publicInputs);
        require(isValidProof, "Invalid transfer proof");

        // if proof is valid, write nullifiers as spent
        for (uint256 i = 1; i < NOTES_INPUT_LENGTH + 1; i++) {
            if (_publicInputs[i] != bytes32(0)) {
                // check not spent
                require(
                    nullifierUsed[_publicInputs[i]] == false,
                    "Nullifier already spent"
                );
                // mark as spent
                nullifierUsed[_publicInputs[i]] = true;

                emit NullifierUsed(uint256(_publicInputs[i]));
            }
        }

        // and insert output note commitments
        for (
            uint256 i = NOTES_INPUT_LENGTH + 1;
            i < NOTES_INPUT_LENGTH + 1 + NOTES_INPUT_LENGTH;
            i++
        ) {
            if (_publicInputs[i] != bytes32(0)) {
                _insert(uint256(_publicInputs[i]));
            }
        }

        // emit payload note parameters
        for (uint256 i = 0; i < 3 && i < _payload.length; i++) {
            if (_payload[i].length != 0) {
                emit NotePayload(_payload[i]);
            }
        }
    }

    function withdraw(
        bytes calldata _proof,
        bytes32[] calldata _publicInputs
    ) public {
        require(isKnownRoot(uint256(_publicInputs[0])), "Invalid Root!");

        bool isValidProof = withdrawVerifier.verify(_proof, _publicInputs);
        require(isValidProof, "Invalid withdraw proof");

        // Mark nullifiers as spent
        for (uint256 i = 1; i <= NOTES_INPUT_LENGTH; i++) {
            if (_publicInputs[i] != bytes32(0)) {
                // check not spent
                require(
                    nullifierUsed[_publicInputs[i]] == false,
                    "Nullifier already spent"
                );
                // mark as spent
                nullifierUsed[_publicInputs[i]] = true;

                emit NullifierUsed(uint256(_publicInputs[i]));
            }
        }

        // Process withdrawals
        for (uint256 i = 0; i < NOTES_INPUT_LENGTH; i++) {
            uint256 assetIndex = EXIT_ASSET_START_INDEX + i;
            uint256 amountIndex = EXIT_AMOUNT_START_INDEX + i;
            uint256 addressIndex = EXIT_ADDRESSES_START_INDEX + i;

            address exitAsset = address(
                uint160(uint256(_publicInputs[assetIndex]))
            );
            uint256 exitAmount = uint256(_publicInputs[amountIndex]);
            address exitAddress = address(
                uint160(uint256(_publicInputs[addressIndex]))
            );

            if (exitAmount > 0) {
                // Transfer tokens to the exit address
                bool success = ERC20(exitAsset).transfer(
                    exitAddress,
                    exitAmount
                );
                require(success, "Token transfer failed");
            }
        }
    }
}
