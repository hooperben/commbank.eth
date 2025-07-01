// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IOFT, SendParam, OFTReceipt} from "@layerzerolabs/oft-evm/contracts/interfaces/IOFT.sol";

import {MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

contract StargateSenderBase {
    function _sendStargateAssets(
        uint32 _dstEid,
        bytes32 peer,
        bytes32[] calldata _publicInputs,
        bytes calldata _options
    ) internal {
        for (uint256 i = 7; i < 10; i++) {
            address stargateAssetAddress = address(
                uint160(uint256(_publicInputs[i]))
            );

            if (stargateAssetAddress != address(0)) {
                _sendSingleStargateAsset(
                    _dstEid,
                    peer,
                    stargateAssetAddress,
                    uint256(_publicInputs[i + 3]), // amount is at i+3 (indices 10-12)
                    _options
                );
            }
        }
    }

    function _sendSingleStargateAsset(
        uint32 _dstEid,
        bytes32 peer,
        address stargateAssetAddress,
        uint256 amount,
        bytes calldata _options
    ) internal {
        uint256 adjustedAmount = amount *
            10 ** ERC20(stargateAssetAddress).decimals();

        SendParam memory sendParam = SendParam(
            _dstEid,
            peer,
            adjustedAmount,
            adjustedAmount,
            _options,
            "",
            ""
        );

        MessagingFee memory fee = IOFT(stargateAssetAddress).quoteSend(
            sendParam,
            false
        );

        IOFT(stargateAssetAddress).send{value: fee.nativeFee}(
            sendParam,
            fee,
            payable(msg.sender)
        );
    }
}
