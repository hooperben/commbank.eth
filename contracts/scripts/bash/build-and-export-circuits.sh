#!/bin/bash

ORIGINAL_DIR=$(pwd)

echo "$ORIGINAL_DIR"

echo "building deposit verifier (1/3)"
cd ../keccak-circuits/deposit/

nargo compile
bb write_vk_ultra_keccak_honk -b ./target/circuits.json
bb contract_ultra_honk

mkdir -p ../../contracts/contracts/verifiers

mv ./target/contract.sol ../../contracts/contracts/verifiers/NoteVerifier.sol || { echo "Error: Failed to copy contract.sol"; exit 1; }

# Replace 'contract HonkVerifier' with 'contract NoteVerifier' in the generated contract
sed -i '' 's/contract HonkVerifier/contract NoteVerifier/g' ../../contracts/contracts/verifiers/NoteVerifier.sol

echo "Deposit copied to contracts/verifiers/NoteVerifier.sol"

# -------------------------------------------
echo "building deposit verifier (2/3)"

cd "../transact"

nargo compile
bb write_vk_ultra_keccak_honk -b ./target/transact.json
bb contract_ultra_honk

mv ./target/contract.sol ../../contracts/contracts/verifiers/TransactVerifier.sol || { echo "Error: Failed to copy contract.sol"; exit 1; }

# Replace 'contract HonkVerifier' with 'contract TransactVerifier' in the generated contract
sed -i '' 's/contract HonkVerifier/contract TransactVerifier/g' ../../contracts/contracts/verifiers/TransactVerifier.sol

echo "Transact copied to contracts/verifiers/TransactVerifier.sol"

# -------------------------------------------

echo "building withdraw verifier (3/3)"

cd "../withdraw"

nargo compile
bb write_vk_ultra_keccak_honk -b ./target/withdraw.json
bb contract_ultra_honk

mv ./target/contract.sol ../../contracts/contracts/verifiers/WithdrawVerifier.sol || { echo "Error: Failed to copy contract.sol"; exit 1; }

# Replace 'contract HonkVerifier' with 'contract WithdrawVerifier' in the generated contract
sed -i '' 's/contract HonkVerifier/contract WithdrawVerifier/g' ../../contracts/contracts/verifiers/WithdrawVerifier.sol

echo "Withdraw copied to contracts/verifiers/WithdrawVerifier.sol"

