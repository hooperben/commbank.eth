#!/bin/bash

ORIGINAL_DIR=$(pwd)

echo "$ORIGINAL_DIR"

echo "building deposit verifier"
cd ../circuits/deposit/

nargo compile
bb write_vk_ultra_keccak_honk -b ./target/circuits.json
bb contract_ultra_honk

mkdir -p ../../contracts/contracts/verifiers

mv ./target/contract.sol ../../contracts/contracts/verifiers/NoteVerifier.sol || { echo "Error: Failed to copy contract.sol"; exit 1; }

# Replace 'contract HonkVerifier' with 'contract NoteVerifier' in the generated contract
sed -i '' 's/contract HonkVerifier/contract NoteVerifier/g' ../../contracts/contracts/verifiers/NoteVerifier.sol

echo "Contract copied to contracts/verifiers/NoteVerifier.sol"