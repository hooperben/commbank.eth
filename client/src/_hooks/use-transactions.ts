import type { Transaction, TransactionStatus, TransactionType } from "@/_types";
import {
  addTransaction as addTransactionDB,
  deleteTransaction as deleteTransactionDB,
  getAllTransactions,
  getLockedNoteCommitments as getLockedNoteCommitmentsDB,
  getPendingTransactions as getPendingTransactionsDB,
  getTransactionByHash as getTransactionByHashDB,
  getTransactionsByChainId as getTransactionsByChainIdDB,
  getTransactionsByStatus as getTransactionsByStatusDB,
  getTransactionsByType as getTransactionsByTypeDB,
  updateTransaction as updateTransactionDB,
} from "@/lib/db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SupportedAsset } from "shared/constants/token";
import { toast } from "sonner";

/**
 * Hook to fetch all transactions from IndexedDB
 */
export function useTransactions() {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: getAllTransactions,
  });
}

/**
 * Hook to fetch transactions by chain ID
 */
export function useTransactionsByChainId(chainId: number | undefined) {
  return useQuery({
    queryKey: ["transactions", "chainId", chainId],
    queryFn: () =>
      chainId !== undefined ? getTransactionsByChainIdDB(chainId) : [],
    enabled: chainId !== undefined,
  });
}

/**
 * Hook to fetch transactions by type
 */
export function useTransactionsByType(type: TransactionType | undefined) {
  return useQuery({
    queryKey: ["transactions", "type", type],
    queryFn: () => (type !== undefined ? getTransactionsByTypeDB(type) : []),
    enabled: type !== undefined,
  });
}

/**
 * Hook to fetch a transaction by hash
 */
export function useTransactionByHash(hash: string | undefined) {
  return useQuery({
    queryKey: ["transactions", "hash", hash],
    queryFn: () => (hash !== undefined ? getTransactionByHashDB(hash) : null),
    enabled: hash !== undefined,
  });
}

/**
 * Hook to fetch pending transactions by chain ID
 */
export function usePendingTransactions(chainId: number | undefined) {
  return useQuery({
    queryKey: ["transactions", "pending", chainId],
    queryFn: () =>
      chainId !== undefined ? getPendingTransactionsDB(chainId) : [],
    enabled: chainId !== undefined,
    // Poll more frequently for pending transactions
    refetchInterval: 10000, // 10 seconds
  });
}

/**
 * Hook to fetch transactions by status
 */
export function useTransactionsByStatus(
  chainId: number | undefined,
  status: TransactionStatus | undefined,
) {
  return useQuery({
    queryKey: ["transactions", "status", chainId, status],
    queryFn: () =>
      chainId !== undefined && status !== undefined
        ? getTransactionsByStatusDB(chainId, status)
        : [],
    enabled: chainId !== undefined && status !== undefined,
  });
}

/**
 * Hook to get locked note commitments (notes in pending transactions)
 */
export function useLockedNoteCommitments(chainId: number | undefined) {
  return useQuery({
    queryKey: ["lockedNotes", chainId],
    queryFn: () =>
      chainId !== undefined ? getLockedNoteCommitmentsDB(chainId) : new Set(),
    enabled: chainId !== undefined,
  });
}

/**
 * Hook to calculate total pending outbound amount for an asset
 */
export function usePendingOutAmount(
  chainId: number | undefined,
  asset: SupportedAsset | undefined,
) {
  const { data: pendingTxs } = usePendingTransactions(chainId);

  if (!pendingTxs || !asset) {
    return { data: 0n };
  }

  const totalPending = pendingTxs.reduce((total, tx) => {
    // Only count outbound transactions (transfers and withdrawals)
    if (tx.type !== "Transfer" && tx.type !== "Withdraw") {
      return total;
    }

    // Check if this transaction is for the specified asset
    if (
      tx.asset?.address &&
      tx.asset.address.toLowerCase() === asset.address.toLowerCase()
    ) {
      return total + BigInt(tx.asset.amount);
    }

    return total;
  }, 0n);

  return { data: totalPending };
}

/**
 * Hook to add a new transaction
 */
export function useAddTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      transaction: Omit<Transaction, "id" | "timestamp" | "createdAt">,
    ) => {
      const now = Date.now();
      const newTransaction: Transaction = {
        ...transaction,
        id: transaction.transactionHash || crypto.randomUUID(),
        timestamp: now,
        createdAt: now,
        inputNotes: transaction.inputNotes || [],
        outputNotes: transaction.outputNotes || [],
        status: transaction.status || "confirmed",
      };
      await addTransactionDB(newTransaction);
      return newTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["lockedNotes"] });
    },
    onError: (error) => {
      console.error("Failed to add transaction:", error);
      toast.error("Failed to add transaction");
    },
  });
}

/**
 * Hook to update an existing transaction
 */
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Transaction) => {
      await updateTransactionDB(transaction);
      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["lockedNotes"] });
    },
    onError: (error) => {
      console.error("Failed to update transaction:", error);
      toast.error("Failed to update transaction");
    },
  });
}

/**
 * Hook to delete a transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteTransactionDB(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["lockedNotes"] });
      toast.success("Transaction deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete transaction:", error);
      toast.error("Failed to delete transaction");
    },
  });
}

/**
 * Filter transactions by multiple criteria
 */
export function useFilteredTransactions({
  chainId,
  type,
  search,
  status,
}: {
  chainId?: number;
  type?: TransactionType;
  search?: string;
  status?: TransactionStatus;
}) {
  const { data: transactions, ...rest } = useTransactions();

  const filteredTransactions = transactions?.filter((transaction) => {
    // Filter by chainId if provided
    if (chainId !== undefined && transaction.chainId !== chainId) {
      return false;
    }

    // Filter by type if provided
    if (type !== undefined && transaction.type !== type) {
      return false;
    }

    // Filter by status if provided
    if (status !== undefined && transaction.status !== status) {
      return false;
    }

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      const hashMatches =
        transaction.transactionHash?.toLowerCase().includes(searchLower) ??
        false;
      const toMatches = transaction.to.toLowerCase().includes(searchLower);
      const typeMatches = transaction.type.toLowerCase().includes(searchLower);
      const assetMatches =
        transaction.asset?.symbol.toLowerCase().includes(searchLower) ?? false;
      const recipientMatches =
        transaction.recipient?.nickname?.toLowerCase().includes(searchLower) ??
        transaction.recipient?.evmAddress
          ?.toLowerCase()
          .includes(searchLower) ??
        false;

      return (
        hashMatches ||
        toMatches ||
        typeMatches ||
        assetMatches ||
        recipientMatches
      );
    }

    return true;
  });

  return {
    data: filteredTransactions,
    ...rest,
  };
}
