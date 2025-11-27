#!/bin/bash

echo "Getting gate counts for all circuits..."

echo "----------------------------------"

echo "Deposit circuit gate count:"
bb gates -b ../circuits/deposit/target/deposit.json -v -s ultra_honk
echo "----------------------------------"

echo "Transfer circuit gate count:"
bb gates -b ../circuits/transfer/target/transfer.json
echo "----------------------------------"

echo "Withdraw circuit gate count:"
bb gates -b ../circuits/withdraw/target/withdraw.json
echo "----------------------------------"
