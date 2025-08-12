#!/bin/bash

ORIGINAL_DIR=$(pwd)

echo "$ORIGINAL_DIR"

echo "building deposit verifier (1/4)"
cd ../circuits/deposit/

nargo compile

bb write_vk -b ./target/deposit.json -o ./target --oracle_hash keccak
bb write_solidity_verifier -k ./target/vk -o ./target/contract.sol

mkdir -p ../../contracts/contracts/verifiers

mv ./target/contract.sol ../../contracts/contracts/verifiers/DepositVerifier.sol || { echo "Error: Failed to copy contract.sol"; exit 1; }

# Replace 'contract HonkVerifier' with 'contract DepositVerifier' in the generated contract
sed -i '' 's/contract HonkVerifier/contract DepositVerifier/g' ../../contracts/contracts/verifiers/DepositVerifier.sol

echo "Deposit copied to contracts/verifiers/DepositVerifier.sol"

# -------------------------------------------
echo "building deposit verifier (2/4)"

cd "../transfer"

nargo compile
bb write_vk -b ./target/transfer.json -o ./target --oracle_hash keccak
bb write_solidity_verifier -k ./target/vk -o ./target/contract.sol

mv ./target/contract.sol ../../contracts/contracts/verifiers/TransferVerifier.sol || { echo "Error: Failed to copy contract.sol"; exit 1; }

# Replace 'contract HonkVerifier' with 'contract TransferVerifier' in the generated contract
sed -i '' 's/contract HonkVerifier/contract TransferVerifier/g' ../../contracts/contracts/verifiers/TransferVerifier.sol

echo "transfer copied to contracts/verifiers/TransferVerifier.sol"

# -------------------------------------------

echo "building withdraw verifier (3/4)"

cd "../withdraw"

nargo compile
bb write_vk -b ./target/withdraw.json -o ./target --oracle_hash keccak
bb write_solidity_verifier -k ./target/vk -o ./target/contract.sol

mv ./target/contract.sol ../../contracts/contracts/verifiers/WithdrawVerifier.sol || { echo "Error: Failed to copy contract.sol"; exit 1; }

# Replace 'contract HonkVerifier' with 'contract WithdrawVerifier' in the generated contract
sed -i '' 's/contract HonkVerifier/contract WithdrawVerifier/g' ../../contracts/contracts/verifiers/WithdrawVerifier.sol

echo "Withdraw copied to contracts/verifiers/WithdrawVerifier.sol"


# -------------------------------------------

echo "building warp verifier (3/4)"

cd "../warp"

nargo compile
bb write_vk -b ./target/warp.json -o ./target --oracle_hash keccak
bb write_solidity_verifier -k ./target/vk -o ./target/contract.sol

mv ./target/contract.sol ../../contracts/contracts/verifiers/WarpVerifier.sol || { echo "Error: Failed to copy contract.sol"; exit 1; }

# Replace 'contract HonkVerifier' with 'contract WarpVerifier' in the generated contract
sed -i '' 's/contract HonkVerifier/contract WarpVerifier/g' ../../contracts/contracts/verifiers/WarpVerifier.sol

echo "Withdraw copied to contracts/verifiers/WarpVerifier.sol"
