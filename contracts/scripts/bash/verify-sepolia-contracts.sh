#!/bin/bash

# Verify all contracts deployed to Sepolia
# Run from the contracts/ directory with: bash scripts/bash/verify-sepolia-contracts.sh

echo "Verifying DepositVerifierLib (ZKTranscriptLib)..."
npx hardhat verify --network sepolia 0x751b0fd43e81c7eA4B0Edc808c7A8AeB9AC2dAC8 --contract contracts/verifiers/DepositVerifier.sol:ZKTranscriptLib

echo "Verifying TransferVerifierLib (ZKTranscriptLib)..."
npx hardhat verify --network sepolia 0xa13055099b42ea918711f0124Da67705D7BE0d7D --contract contracts/verifiers/TransferVerifier.sol:ZKTranscriptLib

echo "Verifying WithdrawVerifierLib (ZKTranscriptLib)..."
npx hardhat verify --network sepolia 0x4629CeE4E75091775b3400d391FE6B123F37Bbd0 --contract contracts/verifiers/WithdrawVerifier.sol:ZKTranscriptLib

echo "Verifying DepositVerifier..."
npx hardhat verify --network sepolia 0xc56287e24913BC667fBCC0a38e5c8F4c93357632 --libraries contracts/verifiers/DepositVerifier.sol:ZKTranscriptLib=0x751b0fd43e81c7eA4B0Edc808c7A8AeB9AC2dAC8

echo "Verifying TransferVerifier..."
npx hardhat verify --network sepolia 0x2Adbe9B0110704ce793d6Eb1997e57D1b59E1EEa --libraries contracts/verifiers/TransferVerifier.sol:ZKTranscriptLib=0xa13055099b42ea918711f0124Da67705D7BE0d7D

echo "Verifying WithdrawVerifier..."
npx hardhat verify --network sepolia 0x2F2Dbe3059C99DAF2318D188161A4cf12ff49EFc --libraries contracts/verifiers/WithdrawVerifier.sol:ZKTranscriptLib=0x4629CeE4E75091775b3400d391FE6B123F37Bbd0

echo "Verifying CommBankDotEth..."
npx hardhat verify --network sepolia 0x6813974e8A965fE09efEEc1cD4DC6D8FBa0831dC 0xc56287e24913BC667fBCC0a38e5c8F4c93357632 0x2Adbe9B0110704ce793d6Eb1997e57D1b59E1EEa 0x2F2Dbe3059C99DAF2318D188161A4cf12ff49EFc

echo "Done!"
