import { SUPPORTED_NETWORKS } from "@/_constants/networks";
import { useAuth } from "@/_providers/auth-provider";
import type { Contact, Transaction } from "@/_types";
import { addTransaction, updateTransactionStatus } from "@/lib/db";
import { getAdjustedGasPrice } from "@/lib/gas";
import { useMutation } from "@tanstack/react-query";
import { Contract, ethers, formatUnits } from "ethers";
import { defaultNetwork, type SupportedAsset } from "shared/constants/token";
import { useTransactionsByChainId } from "./use-transactions";

// Standard ERC20 ABI for transfer
const ERC20_ABI = [
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

interface PublicTransferParams {
  amount: bigint;
  asset: SupportedAsset;
  recipient: Contact;
}

export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  totalCost: bigint;
  formattedCost: string;
  hasEnoughEth: boolean;
  ethBalance: bigint;
  formattedEthBalance: string;
}

/**
 * Estimate gas for a public ERC20 transfer
 */
export async function estimatePublicTransferGas(
  asset: SupportedAsset,
  from: string,
  to: string,
  amount: bigint,
): Promise<GasEstimate> {
  const chain = SUPPORTED_NETWORKS[defaultNetwork];
  if (!chain) throw new Error("Network not configured");

  const provider = new ethers.JsonRpcProvider(chain.rpc);

  // Get ETH balance for gas
  const ethBalance = await provider.getBalance(from);

  // Get adjusted gas price
  const gasPrice = await getAdjustedGasPrice(provider);

  // Estimate gas for the transfer
  const contract = new Contract(asset.address, ERC20_ABI, provider);

  let gasLimit: bigint;
  try {
    gasLimit = await contract.transfer.estimateGas(to, amount, { from });
    // Add 20% buffer for safety
    gasLimit = (gasLimit * 120n) / 100n;
  } catch {
    // Fallback to standard ERC20 transfer gas (65k is typical)
    gasLimit = 65000n;
  }

  const totalCost = gasLimit * gasPrice;
  const hasEnoughEth = ethBalance >= totalCost;

  return {
    gasLimit,
    gasPrice,
    totalCost,
    formattedCost: formatUnits(totalCost, 18),
    hasEnoughEth,
    ethBalance,
    formattedEthBalance: formatUnits(ethBalance, 18),
  };
}

export function usePublicTransfer({
  onTxSubmitted,
  onTxConfirmed,
}: {
  onTxSubmitted?: (txHash: string) => void;
  onTxConfirmed?: () => void;
} = {}) {
  const { getMnemonic, address } = useAuth();
  const { refetch: refetchTransactions } =
    useTransactionsByChainId(defaultNetwork);

  return useMutation({
    mutationFn: async ({ amount, asset, recipient }: PublicTransferParams) => {
      if (!recipient.evmAddress) {
        throw new Error(
          "Recipient must have an EVM address for public transfer",
        );
      }

      // Generate unique transaction ID upfront
      const txId = crypto.randomUUID();

      // Get mnemonic and create wallet
      const mnemonic = await getMnemonic();
      if (!mnemonic) {
        throw new Error("No mnemonic available");
      }

      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      // Get network configuration
      const chain = SUPPORTED_NETWORKS[defaultNetwork];
      if (!chain) throw new Error("Network not configured");

      // Connect to provider
      const provider = new ethers.JsonRpcProvider(chain.rpc);
      const signer = wallet.connect(provider);

      // Estimate gas and check ETH balance
      const gasEstimate = await estimatePublicTransferGas(
        asset,
        wallet.address,
        recipient.evmAddress,
        amount,
      );

      if (!gasEstimate.hasEnoughEth) {
        throw new Error(
          `Insufficient ETH for gas. Need ${gasEstimate.formattedCost} ETH but only have ${gasEstimate.formattedEthBalance} ETH`,
        );
      }

      // Create pending transaction record
      const pendingTx: Transaction = {
        id: txId,
        chainId: defaultNetwork,
        type: "Transfer",
        status: "pending",
        createdAt: Date.now(),
        timestamp: Date.now(),
        to: asset.address,
        asset: {
          address: asset.address,
          symbol: asset.symbol,
          decimals: asset.decimals,
          amount: amount.toString(),
          formattedAmount: formatUnits(amount, asset.decimals),
        },
        sender: {
          evmAddress: address || undefined,
          isSelf: true,
        },
        recipient: {
          evmAddress: recipient.evmAddress,
          nickname: recipient.nickname,
          isSelf: false,
        },
        inputNotes: [],
        outputNotes: [],
      };

      await addTransaction(pendingTx);
      console.log("Created pending public transfer:", txId);

      try {
        // Create contract instance
        const contract = new Contract(asset.address, ERC20_ABI, signer);

        // Execute transfer
        const transferTx = await contract.transfer(
          recipient.evmAddress,
          amount,
          {
            gasLimit: gasEstimate.gasLimit,
            gasPrice: gasEstimate.gasPrice,
          },
        );

        console.log("Public transfer submitted:", transferTx.hash);

        // Update transaction with hash
        await updateTransactionStatus(txId, "pending", {
          transactionHash: transferTx.hash,
          submittedAt: Date.now(),
          gasPrice: gasEstimate.gasPrice.toString(),
        });

        // Refetch transactions to update UI
        await refetchTransactions();

        // Notify caller
        if (onTxSubmitted) {
          onTxSubmitted(transferTx.hash);
        }

        // Wait for confirmation (non-blocking for UI)
        monitorTransaction(
          txId,
          transferTx,
          refetchTransactions,
          onTxConfirmed,
        );

        return {
          txId,
          txHash: transferTx.hash,
          gasEstimate,
        };
      } catch (error) {
        // If anything fails, mark the transaction as failed
        await updateTransactionStatus(txId, "failed", {
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        });
        await refetchTransactions();
        throw error;
      }
    },
  });
}

/**
 * Background monitoring function - runs after returning to the caller
 */
async function monitorTransaction(
  txId: string,
  tx: ethers.ContractTransactionResponse,
  refetchTransactions: () => Promise<unknown>,
  onTxConfirmed?: () => void,
) {
  try {
    const receipt = await tx.wait();

    if (receipt) {
      await updateTransactionStatus(txId, "confirmed", {
        confirmedAt: Date.now(),
        gasUsed: receipt.gasUsed.toString(),
      });

      console.log("Public transfer confirmed:", receipt.hash);

      await refetchTransactions();

      if (onTxConfirmed) {
        onTxConfirmed();
      }
    }
  } catch (error) {
    console.error("Public transfer failed:", error);
    await updateTransactionStatus(txId, "failed", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    await refetchTransactions();
  }
}
