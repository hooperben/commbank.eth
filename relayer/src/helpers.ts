import { ethers, parseUnits } from "ethers";
import type { QueuedTransaction, TxStatus } from "./types";
import { RPC_URLS, CONTRACT_ADDRESSES } from "./constants";
import { commbankDotEthAbi } from "shared/constants/abi/commbankdoteth";

// Transaction queue and lookup map
export const transactionQueue: QueuedTransaction[] = [];
export const transactionMap: Map<string, QueuedTransaction> = new Map();
let isProcessingQueue = false;

/**
 * Generate a unique transaction ID
 */
export function generateTxId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Get adjusted gas price from provider.
 * Doubles the gas price to ensure transaction inclusion.
 * Falls back to 2 gwei if gas price is unavailable.
 */
export async function getDoubledGasPrice(
  provider: ethers.JsonRpcProvider,
): Promise<bigint> {
  const feeData = await provider.getFeeData();

  // Use maxFeePerGas (EIP-1559) or gasPrice (legacy), with 2x multiplier
  const basePrice = feeData.maxFeePerGas ?? feeData.gasPrice;

  if (!basePrice) {
    // Fallback to 2 gwei if provider returns nothing
    return parseUnits("2", "gwei");
  }

  // Double the gas price
  return basePrice * 2n;
}

/**
 * Update transaction status and notify
 */
export function updateTxStatus(
  txId: string,
  status: TxStatus,
  updates: Partial<QueuedTransaction> = {},
): void {
  const tx = transactionMap.get(txId);
  if (tx) {
    tx.status = status;
    tx.updatedAt = Date.now();
    Object.assign(tx, updates);
    console.log(`  [tx] Transaction ${txId} status: ${status}`);
  }
}

/**
 * Process a single transaction from the queue
 */
async function processTransaction(queuedTx: QueuedTransaction): Promise<void> {
  const { txId, request } = queuedTx;

  console.log(`\n[queue] Processing transaction ${txId}...`);
  updateTxStatus(txId, "processing");

  try {
    // Get RPC URL for chain
    const rpcUrl = RPC_URLS[String(request.chainId)];
    if (!rpcUrl) {
      throw new Error(`RPC not configured for chain ${request.chainId}`);
    }

    // Get sponsor private key
    const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY;
    if (!sponsorPrivateKey) {
      throw new Error("SPONSOR_PRIVATE_KEY not configured");
    }

    // Get contract address
    const contractAddress = CONTRACT_ADDRESSES[request.chainId];
    if (!contractAddress) {
      throw new Error(`Contract not configured for chain ${request.chainId}`);
    }

    console.log("  - Type:", request.type);
    console.log("  - Chain ID:", request.chainId);

    // Set up provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(sponsorPrivateKey, provider);

    // Get doubled gas price
    const gasPrice = await getDoubledGasPrice(provider);
    console.log(
      "  - Gas price (2x):",
      ethers.formatUnits(gasPrice, "gwei"),
      "gwei",
    );

    // Initialize contract
    const contract = new ethers.Contract(
      contractAddress,
      commbankDotEthAbi,
      wallet,
    );

    // Submit transaction
    let tx: ethers.ContractTransactionResponse;

    if (request.type === "transfer") {
      tx = await contract.transfer(
        request.proof,
        request.publicInputs,
        request.payload,
        { gasPrice },
      );
    } else {
      tx = await contract.transferExternal(
        request.proof,
        request.publicInputs,
        request.payload,
        { gasPrice },
      );
    }

    console.log("  [ok] Transaction submitted:", tx.hash);
    updateTxStatus(txId, "submitted", { transactionHash: tx.hash });

    // Wait for confirmation in background (don't block queue)
    tx.wait()
      .then(() => {
        console.log(`  [ok] Transaction ${txId} confirmed`);
        updateTxStatus(txId, "confirmed");
      })
      .catch((error) => {
        console.error(
          `  [error] Transaction ${txId} failed on-chain:`,
          error.message,
        );
        updateTxStatus(txId, "failed", {
          errorMessage:
            error instanceof Error ? error.message : "Transaction reverted",
        });
      });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`  [error] Transaction ${txId} failed:`, errorMessage);
    updateTxStatus(txId, "failed", { errorMessage });
  }
}

/**
 * Process the transaction queue sequentially
 */
export async function processQueue(): Promise<void> {
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;

  while (transactionQueue.length > 0) {
    const queuedTx = transactionQueue[0];

    // Update queue positions for all waiting transactions
    transactionQueue.forEach((tx, index) => {
      tx.queuePosition = index;
    });

    // Process the first transaction
    await processTransaction(queuedTx);

    // Remove from queue after processing (regardless of success/failure)
    transactionQueue.shift();
  }

  isProcessingQueue = false;
}
