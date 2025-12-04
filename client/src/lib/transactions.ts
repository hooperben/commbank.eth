import type { Transaction } from "@/_types";

export const getAssetAddress = (transaction: Transaction) => {
  if (transaction.type === "Deposit") {
    const asset =
      `0x${transaction.data?.substring(34, 74)?.toLowerCase()}`.toLowerCase();
    return asset;
  }
  return transaction.to.toLowerCase();
};

export const getAssetAmount = (transaction: Transaction) => {
  if (transaction.type === "Deposit") {
    const amount = `0x${transaction.data?.substring(74, 138)}`;
    return BigInt(amount);
  }
  return 0n;
};

export const getTransactionVerb = (txType: string) => {
  if (txType === "Deposit") {
    return "Encrypt";
  }
  return txType;
};
