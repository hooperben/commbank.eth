#!/bin/bash

# Verify all contracts deployed to Sepolia
# Run from the contracts/ directory with: bash verify-contracts.sh

echo "Verifying DepositVerifierLib (ZKTranscriptLib)..."
pnpm hardhat verify --network sepolia 0x273f123d03ca9dbdEB3a8Be09Fa65D11360656AB --contract contracts/verifiers/DepositVerifier.sol:ZKTranscriptLib

echo "Verifying TransferVerifierLib (ZKTranscriptLib)..."
pnpm hardhat verify --network sepolia 0x09A7eC66dc43013EDaFc7d22c113e1cBeaC69C30 --contract contracts/verifiers/TransferVerifier.sol:ZKTranscriptLib

echo "Verifying WithdrawVerifierLib (ZKTranscriptLib)..."
pnpm hardhat verify --network sepolia 0x3260d8A8081e18D540AFd6390d3086D180e3d5fa --contract contracts/verifiers/WithdrawVerifier.sol:ZKTranscriptLib

echo "Verifying DepositVerifier..."
pnpm hardhat verify --network sepolia 0x135bbd40aD98Cd14d3d48745EA7a58f9bD0b2Fc1 --libraries contracts/verifiers/DepositVerifier.sol:ZKTranscriptLib=0x273f123d03ca9dbdEB3a8Be09Fa65D11360656AB

echo "Verifying TransferVerifier..."
pnpm hardhat verify --network sepolia 0x0414D1a9840bC22aCebba9Deb666871424D91794 --libraries contracts/verifiers/TransferVerifier.sol:ZKTranscriptLib=0x09A7eC66dc43013EDaFc7d22c113e1cBeaC69C30

echo "Verifying WithdrawVerifier..."
pnpm hardhat verify --network sepolia 0x1Ed884cB7022737402ee0a8FB8fb2F9d62c046A1 --libraries contracts/verifiers/WithdrawVerifier.sol:ZKTranscriptLib=0x3260d8A8081e18D540AFd6390d3086D180e3d5fa

echo "Verifying CommBankDotEth..."
pnpm hardhat verify --network sepolia 0x42C1D35B4C235e541332Ee247210fD149eb84DC7 0x135bbd40aD98Cd14d3d48745EA7a58f9bD0b2Fc1 0x0414D1a9840bC22aCebba9Deb666871424D91794 0x1Ed884cB7022737402ee0a8FB8fb2F9d62c046A1

echo "Done!"
