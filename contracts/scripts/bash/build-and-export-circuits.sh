#!/bin/bash

ORIGINAL_DIR=$(pwd)

echo "$ORIGINAL_DIR"

echo "building keccak verify"
cd ../circuits/

nargo compile
bb write_vk -b ./target/circuits.json
bb contract
mkdir -p ../../contracts/verifiers

mv ./target/contract.sol ../contracts/contracts/verifiers/contract.sol || { echo "Error: Failed to copy contract.sol"; exit 1; }

echo "Contract copied to contracts/verifiers/contract.sol"