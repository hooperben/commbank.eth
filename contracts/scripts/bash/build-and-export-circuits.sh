#!/bin/bash

ORIGINAL_DIR=$(pwd)

echo "$ORIGINAL_DIR"

echo "building keccak verify"
cd ../circuits/

nargo compile
bb write_vk_ultra_keccak_honk -b ./target/circuits.json
bb contract_ultra_honk

mkdir -p ../../contracts/verifiers

mv ./target/contract.sol ../contracts/contracts/verifiers/contract.sol || { echo "Error: Failed to copy contract.sol"; exit 1; }

echo "Contract copied to contracts/verifiers/contract.sol"