import type { Transaction, TransactionStatus } from "@/_types";

/**
 * Get asset address from transaction
 * Uses enhanced asset details if available, otherwise falls back to legacy parsing
 */
export const getAssetAddress = (transaction: Transaction): string => {
  // Use enhanced asset details if available
  if (transaction.asset?.address) {
    return transaction.asset.address.toLowerCase();
  }

  // Legacy: Parse from calldata for deposits
  if (transaction.type === "Deposit" && transaction.data) {
    const asset =
      `0x${transaction.data.substring(34, 74)?.toLowerCase()}`.toLowerCase();
    return asset;
  }

  return transaction.to.toLowerCase();
};

/**
 * Get asset amount from transaction
 * Uses enhanced asset details if available, otherwise falls back to legacy parsing
 */
export const getAssetAmount = (transaction: Transaction): bigint => {
  // Use enhanced asset details if available
  if (transaction.asset?.amount) {
    return BigInt(transaction.asset.amount);
  }

  // Legacy: Parse from calldata for deposits
  if (transaction.type === "Deposit" && transaction.data) {
    const amount = `0x${transaction.data.substring(74, 138)}`;
    return BigInt(amount);
  }

  return 0n;
};

/**
 * Get human-readable verb for transaction type
 */
export const getTransactionVerb = (txType: string): string => {
  switch (txType) {
    case "Deposit":
      return "Encrypt";
    case "Deposit-Pending":
      return "Encrypting";
    case "Withdraw":
      return "Decrypt";
    case "Transfer":
      return "Transfer";
    case "PrivateTransfer":
      return "Private Transfer";
    case "Approval":
      return "Approval";
    default:
      return txType;
  }
};

/**
 * Get color scheme for transaction status
 */
export const getStatusColor = (
  status: TransactionStatus | undefined,
): {
  bg: string;
  text: string;
  border: string;
} => {
  switch (status) {
    case "pending":
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-600 dark:text-yellow-400",
        border: "border-yellow-500/30",
      };
    case "confirmed":
      return {
        bg: "bg-green-500/10",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-500/30",
      };
    case "failed":
      return {
        bg: "bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        border: "border-red-500/30",
      };
    case "replaced":
      return {
        bg: "bg-gray-500/10",
        text: "text-gray-600 dark:text-gray-400",
        border: "border-gray-500/30",
      };
    default:
      // For backward compatibility, treat undefined as confirmed
      return {
        bg: "bg-green-500/10",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-500/30",
      };
  }
};

/**
 * Format transaction recipient for display
 */
export const formatRecipient = (transaction: Transaction): string | null => {
  if (!transaction.recipient) return null;

  if (transaction.recipient.nickname) {
    return transaction.recipient.nickname;
  }

  if (transaction.recipient.evmAddress) {
    const addr = transaction.recipient.evmAddress;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  if (transaction.recipient.privateAddress) {
    const addr = transaction.recipient.privateAddress;
    return `${addr.slice(0, 10)}...`;
  }

  return null;
};
