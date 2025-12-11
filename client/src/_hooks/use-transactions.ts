import type { Transaction, TransactionType } from "@/_types";
import {
  addTransaction as addTransactionDB,
  deleteTransaction as deleteTransactionDB,
  getAllTransactions,
  getTransactionsByChainId as getTransactionsByChainIdDB,
  getTransactionsByType as getTransactionsByTypeDB,
  getTransactionByHash as getTransactionByHashDB,
  updateTransaction as updateTransactionDB,
} from "@/lib/db";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
 * Hook to add a new transaction
 */
export function useAddTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, "id" | "timestamp">) => {
      const newTransaction: Transaction = {
        ...transaction,
        id: transaction.transactionHash || crypto.randomUUID(),
        timestamp: Date.now(),
      };
      await addTransactionDB(newTransaction);
      return newTransaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
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
}: {
  chainId?: number;
  type?: TransactionType;
  search?: string;
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

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        transaction.transactionHash.toLowerCase().includes(searchLower) ||
        transaction.to.toLowerCase().includes(searchLower) ||
        transaction.type.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  return {
    data: filteredTransactions,
    ...rest,
  };
}
