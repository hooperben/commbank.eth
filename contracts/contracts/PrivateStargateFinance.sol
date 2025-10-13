// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

import {DepositVerifier} from "./verifiers/DepositVerifier.sol";
import {TransferVerifier} from "./verifiers/TransferVerifier.sol";
import {WithdrawVerifier} from "./verifiers/WithdrawVerifier.sol";
import {WarpVerifier} from "./verifiers/WarpVerifier.sol";
import {IStargatePool} from "./IStargatePool.sol";

import "./PrivateStargateOApp.sol";
import "./StargateSenderBase.sol";

uint256 constant NOTES_INPUT_LENGTH = 3;
uint256 constant EXIT_ASSET_START_INDEX = 4;
uint256 constant EXIT_AMOUNT_START_INDEX = 7;
uint256 constant EXIT_ADDRESSES_START_INDEX = 10;

contract PrivateStargateFinance is
    PrivateStargateOApp,
    StargateSenderBase,
    AccessControl
{
    DepositVerifier public depositVerifier;
    TransferVerifier public transferVerifier;
    WithdrawVerifier public withdrawVerifier;
    WarpVerifier public warpVerifier;

    bytes32 public DEPOSIT_ROLE = keccak256("DEPOSIT_ROLE"); // :(

    mapping(bytes32 => bool) public nullifierUsed;
    mapping(address => bool) public availableOFTs;

    event NullifierUsed(uint256 indexed nullifier);
    event NotePayload(bytes encryptedNote);

    constructor(
        address _endpoint,
        address _owner,
        address _depositVerifier,
        address _transferVerifier,
        address _withdrawVerifier,
        address _warpVerifier
    ) Ownable(_owner) PrivateStargateOApp(_endpoint, _owner) {
        depositVerifier = DepositVerifier(_depositVerifier);
        transferVerifier = TransferVerifier(_transferVerifier);
        withdrawVerifier = WithdrawVerifier(_withdrawVerifier);
        warpVerifier = WarpVerifier(_warpVerifier);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEPOSIT_ROLE, msg.sender);
    }

    function deposit(
        address _erc20,
        uint64 _amount, // !dev no exponent here
        bytes calldata _proof,
        bytes32[] calldata _publicInputs,
        bytes[] calldata _payload
    ) public onlyRole(DEPOSIT_ROLE) {
        uint8 decimals = ERC20(_erc20).decimals();
        bool depositTransfer = ERC20(_erc20).transferFrom(
            msg.sender,
            address(this),
            _amount * 10 ** decimals
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

        // emit payload note parameters
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

        // Process withdrawals - FIX: correct index calculations
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
                // Get token decimals and calculate actual amount to transfer
                uint8 decimals = ERC20(exitAsset).decimals();
                uint256 actualAmount = exitAmount * 10 ** decimals;

                // Transfer tokens to the exit address
                bool success = ERC20(exitAsset).transfer(
                    exitAddress,
                    actualAmount
                );
                require(success, "Token transfer failed");
            }
        }
    }

    function warp(
        uint32 _dstEid,
        bytes calldata _proof,
        bytes32[] calldata _publicInputs,
        bytes calldata _options,
        bytes[] calldata _payload
    ) public payable {
        // verify root is in the history of the tree
        require(isKnownRoot(uint256(_publicInputs[0])), "Invalid Root!");

        // verify the warp proof
        bool isValidProof = warpVerifier.verify(_proof, _publicInputs);
        require(isValidProof, "Invalid warp proof");

        // check that all assets used in this cross chain request are supported
        for (uint256 i = 7; i < 9; i++) {
            if (_publicInputs[i] != bytes32(0)) {
                address exitAsset = address(uint160(uint256(_publicInputs[i])));
                require(availableOFTs[exitAsset], "Not a supported OFT");
            }
        }

        // publicInputs layout:
        // 0 = root
        // 1 - 3 = nullifiers
        // 4 - 6 = output hashes
        // 7 - 9 = stargate asset addresses
        // 10 - 12 = stargate amounts

        // Mark nullifiers as spent
        for (uint256 i = 1; i <= NOTES_INPUT_LENGTH; i++) {
            if (_publicInputs[i] != bytes32(0)) {
                require(
                    nullifierUsed[_publicInputs[i]] == false,
                    "Nullifier already spent"
                );
                nullifierUsed[_publicInputs[i]] = true;
                emit NullifierUsed(uint256(_publicInputs[i]));
            }
        }

        // Extract non-zero output hashes for cross-chain payload
        uint256[] memory finalNotes = _extractOutputHashes(_publicInputs);

        // send the note hashes to insert through LZ
        bytes memory lzPayload = abi.encode(finalNotes);
        _lzSend(
            _dstEid,
            lzPayload,
            _options,
            // Fee in native gas and ZRO token.
            MessagingFee(msg.value, 0),
            // Refund address in case of failed source message.
            payable(address(this))
        );

        // get the address of private stargate finance on the remote chain
        bytes32 peer = peers[_dstEid];

        // send the stargate assets to the PSF on the remote chain
        _sendStargateAssets(_dstEid, peer, _publicInputs, _options);

        // emit payload note parameters
        for (uint256 i = 0; i < 3 && i < _payload.length; i++) {
            if (_payload[i].length != 0) {
                emit NotePayload(_payload[i]);
            }
        }
    }

    function addSupportedOFT(
        address _oft,
        bool _enabled
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        availableOFTs[_oft] = _enabled;
    }

    fallback() external payable {}

    receive() external payable {}

    function _extractOutputHashes(
        bytes32[] calldata _publicInputs
    ) internal pure returns (uint256[] memory) {
        uint256[] memory notes = new uint256[](NOTES_INPUT_LENGTH);
        uint256 noteCount = 0;

        for (uint256 i = 4; i <= 6; i++) {
            // output hashes are at indices 4-6
            if (_publicInputs[i] != bytes32(0)) {
                notes[noteCount] = uint256(_publicInputs[i]);
                noteCount++;
            }
        }

        // Resize notes array to actual count
        uint256[] memory finalNotes = new uint256[](noteCount);
        for (uint256 i = 0; i < noteCount; i++) {
            finalNotes[i] = notes[i];
        }

        return finalNotes;
    }
}
