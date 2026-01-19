#!/bin/bash

# Verify all contracts deployed to a chain
# Run from the contracts/ directory with: bash scripts/bash/verify-contracts.sh [--chain CHAIN_ID]
# Example: bash scripts/bash/verify-contracts.sh --chain 11155111

# Default chain ID (Sepolia)
CHAIN_ID="1"
NETWORK="mainnet"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --chain)
            CHAIN_ID="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--chain CHAIN_ID]"
            echo "Example: $0 --chain 11155111"
            exit 1
            ;;
    esac
done

# Map chain ID to network name for Hardhat
case $CHAIN_ID in
    1)
        NETWORK="mainnet"
        ;;
    11155111)
        NETWORK="sepolia"
        ;;
    *)
        echo "Warning: Unknown chain ID $CHAIN_ID, using 'sepolia' as network name"
        NETWORK="sepolia"
        ;;
esac

echo "Using chain ID: $CHAIN_ID (network: $NETWORK)"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install it with:"
    echo "  macOS: brew install jq"
    echo "  Ubuntu: sudo apt-get install jq"
    exit 1
fi

# Path to deployed addresses JSON
DEPLOYED_ADDRESSES_FILE="ignition/deployments/chain-${CHAIN_ID}/deployed_addresses.json"

# Check if deployment file exists
if [ ! -f "$DEPLOYED_ADDRESSES_FILE" ]; then
    echo "Error: Deployment file not found at $DEPLOYED_ADDRESSES_FILE"
    echo "Please deploy contracts first with: npx hardhat ignition deploy --network $NETWORK"
    exit 1
fi

# Extract addresses from JSON using jq
DEPOSIT_VERIFIER_LIB=$(jq -r '."depositVerifier#DepositVerifierLib"' "$DEPLOYED_ADDRESSES_FILE")
TRANSFER_VERIFIER_LIB=$(jq -r '."transferVerifier#TransferVerifierLib"' "$DEPLOYED_ADDRESSES_FILE")
WITHDRAW_VERIFIER_LIB=$(jq -r '."withdrawVerifier#WithdrawVerifierLib"' "$DEPLOYED_ADDRESSES_FILE")
TRANSFER_EXTERNAL_LIB=$(jq -r '."transferExternalVerifier#TransferVerifierLib"' "$DEPLOYED_ADDRESSES_FILE")
DEPOSIT_VERIFIER=$(jq -r '."depositVerifier#DepositVerifier"' "$DEPLOYED_ADDRESSES_FILE")
TRANSFER_VERIFIER=$(jq -r '."transferVerifier#TransferVerifier"' "$DEPLOYED_ADDRESSES_FILE")
WITHDRAW_VERIFIER=$(jq -r '."withdrawVerifier#WithdrawVerifier"' "$DEPLOYED_ADDRESSES_FILE")
# TransferExternalVerifier transferExternalVerifier#TransferExternalVerifier
TRANSFER_EXTERNAL_VERIFIER=$(jq -r '."transferExternalVerifier#TransferExternalVerifier"' "$DEPLOYED_ADDRESSES_FILE")
COMMBANK_DOT_ETH=$(jq -r '."commbankDotEth#CommBankDotEth"' "$DEPLOYED_ADDRESSES_FILE")

# Verify addresses were extracted
if [ "$DEPOSIT_VERIFIER_LIB" == "null" ] || [ -z "$DEPOSIT_VERIFIER_LIB" ]; then
    echo "Error: Could not extract addresses from $DEPLOYED_ADDRESSES_FILE"
    echo "Please ensure the deployment file is valid JSON"
    exit 1
fi

# Print addresses for verification
echo "========================================"
echo "Verifying contracts with addresses:"
echo "========================================"
echo "DepositVerifierLib:    $DEPOSIT_VERIFIER_LIB"
echo "TransferVerifierLib:   $TRANSFER_VERIFIER_LIB"
echo "WithdrawVerifierLib:   $WITHDRAW_VERIFIER_LIB"
echo "TransferExternalLib: $TRANSFER_EXTERNAL_LIB"
echo "DepositVerifier:       $DEPOSIT_VERIFIER"
echo "TransferVerifier:      $TRANSFER_VERIFIER"
echo "WithdrawVerifier:      $WITHDRAW_VERIFIER"
echo "TransferExternalVerifier: $TRANSFER_EXTERNAL_VERIFIER"
echo "CommBankDotEth:        $COMMBANK_DOT_ETH"
echo "========================================"
echo ""

# Verify libraries
# echo "Verifying DepositVerifierLib (ZKTranscriptLib)..."
# npx hardhat verify --network "$NETWORK" "$DEPOSIT_VERIFIER_LIB" --contract contracts/verifiers/DepositVerifier.sol:ZKTranscriptLib

# echo "Verifying TransferVerifierLib (ZKTranscriptLib)..."
# npx hardhat verify --network "$NETWORK" "$TRANSFER_VERIFIER_LIB" --contract contracts/verifiers/TransferVerifier.sol:ZKTranscriptLib

# echo "Verifying WithdrawVerifierLib (ZKTranscriptLib)..."
# npx hardhat verify --network "$NETWORK" "$WITHDRAW_VERIFIER_LIB" --contract contracts/verifiers/WithdrawVerifier.sol:ZKTranscriptLib

echo "Verifying TransferExternalVerifierLib (ZKTranscriptLib)..."
npx hardhat verify --network "$NETWORK" "$TRANSFER_EXTERNAL_LIB" --contract contracts/verifiers/TransferExternalVerifier.sol:ZKTranscriptLib


# Verify verifier contracts
# echo "Verifying DepositVerifier..."
# npx hardhat verify --network "$NETWORK" "$DEPOSIT_VERIFIER" 

# echo "Verifying TransferVerifier..."
# npx hardhat verify --network "$NETWORK" "$TRANSFER_VERIFIER" 

# echo "Verifying WithdrawVerifier..."
# npx hardhat verify --network "$NETWORK" "$WITHDRAW_VERIFIER"

# echo "Verifying TransferExternalVerifier..."
# npx hardhat verify --network "$NETWORK" "$TRANSFER_EXTERNAL_VERIFIER"

# # Verify main contract
# echo "Verifying CommBankDotEth..."
# npx hardhat verify --network "$NETWORK" "$COMMBANK_DOT_ETH" "$DEPOSIT_VERIFIER" "$TRANSFER_VERIFIER" "$WITHDRAW_VERIFIER" "$TRANSFER_EXTERNAL_VERIFIER"

echo ""
echo "========================================"
echo "Done!"
echo "========================================"
