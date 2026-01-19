/**
 * Transaction Monitor Service
 *
 * Background service that monitors pending transactions and updates their status.
 * - Polls pending transactions every 15 seconds
 * - Checks on-chain status via provider.getTransactionReceipt()
 * - Marks transactions as confirmed or failed
 * - Handles 1-hour timeout for stuck transactions
 * - Shows toast notifications on status changes
 * - Marks input notes as used on confirmation
 */

import { SUPPORTED_NETWORKS } from "@/_constants/networks";
import type { Transaction } from "@/_types";
import {
  getNoteByCommitment,
  getPendingTransactions,
  updateNote,
  updateTransactionStatus,
} from "@/lib/db";
import { ethers } from "ethers";
import { defaultNetwork } from "shared/constants/token";
import { toast } from "sonner";

const POLL_INTERVAL = 15_000; // 15 seconds
const TIMEOUT_MS = 60 * 60 * 1000; // 1 hour

class TransactionMonitor {
  private pollInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the transaction monitor
   */
  start() {
    if (this.pollInterval || this.isRunning) return;

    this.isRunning = true;
    console.log("Transaction monitor started");

    // Check immediately
    this.checkPendingTransactions();

    // Then poll periodically
    this.pollInterval = setInterval(() => {
      this.checkPendingTransactions();
    }, POLL_INTERVAL);
  }

  /**
   * Stop the transaction monitor
   */
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
    console.log("Transaction monitor stopped");
  }

  /**
   * Check all pending transactions
   */
  async checkPendingTransactions() {
    try {
      const pendingTxs = await getPendingTransactions(defaultNetwork);

      for (const tx of pendingTxs) {
        await this.checkTransaction(tx);
      }
    } catch (error) {
      console.error("Error checking pending transactions:", error);
    }
  }

  /**
   * Check a single transaction's status
   */
  async checkTransaction(tx: Transaction) {
    // Check for timeout
    const age = Date.now() - tx.createdAt;
    if (age > TIMEOUT_MS) {
      await this.handleTimeout(tx);
      return;
    }

    // Check on-chain status if we have a transaction hash
    if (tx.transactionHash) {
      await this.checkOnChainStatus(tx);
    }
  }

  /**
   * Handle transaction timeout
   */
  async handleTimeout(tx: Transaction) {
    await updateTransactionStatus(tx.id, "failed", {
      errorMessage: "Transaction timed out (1 hour)",
    });

    // Note: Don't mark notes as used - they're still valid
    // The locked notes will be automatically released because
    // the transaction is no longer "pending"

    // Show notification
    toast.error(`Transaction timed out`, {
      description: `Your ${this.getTransactionTypeLabel(tx.type)} transaction did not confirm within 1 hour.`,
    });

    console.log(`Transaction ${tx.id} timed out`);
  }

  /**
   * Check on-chain status of a transaction
   */
  async checkOnChainStatus(tx: Transaction) {
    const chain = SUPPORTED_NETWORKS[tx.chainId];
    if (!chain) return;

    const provider = new ethers.JsonRpcProvider(chain.rpc);

    try {
      const receipt = await provider.getTransactionReceipt(tx.transactionHash!);

      if (receipt) {
        if (receipt.status === 1) {
          // Success
          await this.handleConfirmation(tx, receipt);
        } else {
          // Reverted
          await updateTransactionStatus(tx.id, "failed", {
            errorMessage: "Transaction reverted on-chain",
          });

          toast.error(`Transaction failed`, {
            description: `Your ${this.getTransactionTypeLabel(tx.type)} transaction was reverted on-chain.`,
          });
        }
      }
      // If no receipt, transaction is still pending
    } catch (error) {
      console.error("Error checking transaction status:", error);
    }
  }

  /**
   * Handle successful transaction confirmation
   */
  async handleConfirmation(
    tx: Transaction,
    receipt: ethers.TransactionReceipt,
  ) {
    await updateTransactionStatus(tx.id, "confirmed", {
      confirmedAt: Date.now(),
      gasUsed: receipt.gasUsed.toString(),
    });

    // Mark input notes as used
    for (const noteInfo of tx.inputNotes || []) {
      const note = await getNoteByCommitment(noteInfo.commitment);
      if (note) {
        await updateNote({ ...note, isUsed: true });
      }
    }

    // Note: Output notes (change notes) were already added when the tx was submitted
    // by the use-private-transfer or use-decrypt hooks during background monitoring

    console.log(`Transaction ${tx.id} confirmed`);
  }

  /**
   * Get human-readable label for transaction type
   */
  private getTransactionTypeLabel(type: string): string {
    switch (type) {
      case "Deposit":
        return "encrypt";
      case "Withdraw":
        return "decrypt";
      case "Transfer":
      case "PrivateTransfer":
        return "transfer";
      case "Approval":
        return "approval";
      default:
        return type.toLowerCase();
    }
  }
}

// Export singleton instance
export const transactionMonitor = new TransactionMonitor();
