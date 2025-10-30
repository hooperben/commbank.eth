// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {OApp, Origin, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

import "./PoseidonMerkleTree.sol";

abstract contract PrivateStargateOApp is PoseidonMerkleTree, OApp {
    constructor(
        address _endpoint,
        address _owner
    ) PoseidonMerkleTree(12) OApp(_endpoint, _owner) {}

    function _lzReceive(
        Origin calldata,
        bytes32,
        bytes calldata payload,
        address, // Executor address as specified by the OApp.
        bytes calldata // Any extra data or options to trigger on receipt.
    ) internal override {
        // Decode the payload as uint256[]
        uint256[] memory notes = abi.decode(payload, (uint256[]));

        // Insert each note into the Merkle tree
        for (uint256 i = 0; i < notes.length; i++) {
            _insert(notes[i]);
        }
    }

    function quote(
        uint32 _dstEid, // Destination chain's endpoint ID.
        uint256[] memory notes,
        bytes calldata _options,
        bool _payInLzToken // boolean for which token to return fee in
    ) public view returns (uint256 nativeFee, uint256 lzTokenFee) {
        bytes memory _payload = abi.encode(notes);
        MessagingFee memory fee = _quote(
            _dstEid,
            _payload,
            _options,
            _payInLzToken
        );
        return (fee.nativeFee, fee.lzTokenFee);
    }
}
