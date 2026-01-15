import { SUPPORTED_NETWORKS } from "@/_constants/networks";
import {
  createSpendableNote,
  EMPTY_INPUT_NOTE,
  getNoteHash,
  getNullifier,
  type InputNote,
  type OutputNote,
} from "@/_constants/notes";
import { POSEIDON_MAX } from "@/_constants/numbers";
import { useAuth } from "@/_providers/auth-provider";
import type { Note, Transaction } from "@/_types";
import {
  addNote,
  addTransaction,
  getAllTreeLeaves,
  getLockedNoteCommitments,
  updateTransaction,
  updateTransactionStatus,
} from "@/lib/db";
import { getAdjustedGasPrice } from "@/lib/gas";
import { useMutation } from "@tanstack/react-query";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { ethers, formatUnits } from "ethers";
import { NoteEncryption } from "shared/classes/Note";
import type { PoseidonMerkleTree } from "shared/classes/PoseidonMerkleTree";
import { TransferExternal } from "shared/classes/TransferExternal";
import { commbankDotEthAbi } from "shared/constants/abi/commbankdoteth";
import { defaultNetwork, type SupportedAsset } from "shared/constants/token";
import { getRandomInPoseidonField } from "shared/constants/zk";
import { useTransactionsByChainId } from "./use-transactions";

// Extended OutputNote for transfer_external circuit which includes external_address
interface ExternalOutputNote extends OutputNote {
  external_address: string;
}

const EMPTY_EXTERNAL_OUTPUT_NOTE: ExternalOutputNote = {
  owner: "0",
  secret: "0",
  asset_id: "0",
  asset_amount: "0",
  external_address: "0",
};

interface DecryptParams {
  amount: string;
  asset: SupportedAsset;
  withdrawingNotes: Note[];
  tree: PoseidonMerkleTree;
}

export function useDecrypt({
  onProofSuccess,
  onTxSubmitted,
  onTxConfirmed,
}: {
  onProofSuccess?: () => void;
  onTxSubmitted?: (txHash: string) => void;
  onTxConfirmed?: () => void;
} = {}) {
  const { getMnemonic, privateAddress, address: evmAddress } = useAuth();
  const { refetch: refetchTransactions } =
    useTransactionsByChainId(defaultNetwork);

  return useMutation({
    mutationFn: async ({
      amount,
      asset,
      withdrawingNotes,
      tree,
    }: DecryptParams) => {
      // 1. Generate unique transaction ID upfront
      const txId = crypto.randomUUID();

      // Get network configuration
      const chain = SUPPORTED_NETWORKS[defaultNetwork];
      if (!chain) throw new Error("Network not configured");

      // Get mnemonic and derive owner secret
      const mnemonic = await getMnemonic();
      if (!mnemonic) {
        throw new Error("No mnemonic available");
      }
      if (!evmAddress) {
        throw new Error("No EVM address available");
      }

      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      const ownerSecret = BigInt(wallet.privateKey) % POSEIDON_MAX;
      const owner = poseidon2Hash([ownerSecret]);

      // 2. Check for locked notes and filter them out
      const lockedCommitments = await getLockedNoteCommitments(defaultNetwork);

      // Filter unused notes for the specific asset, excluding locked ones
      const availableNotes = withdrawingNotes.filter((note) => {
        if (note.isUsed) return false;
        if (BigInt(note.assetId) !== BigInt(asset.address)) return false;

        // Check if note is locked by computing its commitment
        const noteHash = getNoteHash({
          assetId: note.assetId,
          assetAmount: note.assetAmount,
          secret: note.secret,
          owner: note.entity_id,
        });
        return !lockedCommitments.has(noteHash);
      });

      console.log(
        "Available notes for withdrawal (excluding locked):",
        availableNotes,
      );

      // Convert amount to proper units
      const withdrawAmount = ethers.parseUnits(amount, asset.decimals);
      console.log("Withdraw amount:", withdrawAmount.toString());

      // 3. Select input notes (UTXO selection - greedy algorithm)
      const selectedInputs: typeof availableNotes = [];
      let totalInputAmount = 0n;

      for (const note of availableNotes) {
        if (selectedInputs.length >= 3) break; // Max 3 inputs
        selectedInputs.push(note);
        totalInputAmount += BigInt(note.assetAmount);
        if (totalInputAmount >= withdrawAmount) break;
      }

      if (totalInputAmount < withdrawAmount) {
        throw new Error("Insufficient funds in selected notes");
      }

      console.log("Selected input notes:", selectedInputs);
      console.log("Total input amount:", totalInputAmount.toString());

      // Calculate change
      const changeAmount = totalInputAmount - withdrawAmount;
      console.log("Change amount:", changeAmount.toString());

      // 4. Create pending transaction record BEFORE proof generation
      // This locks the notes immediately
      const inputNoteCommitments = selectedInputs.map((note) => ({
        commitment: getNoteHash({
          assetId: note.assetId,
          assetAmount: note.assetAmount,
          secret: note.secret,
          owner: note.entity_id,
        }),
        isInput: true,
        isChange: false,
      }));

      const pendingTx: Transaction = {
        id: txId,
        chainId: defaultNetwork,
        type: "Withdraw",
        status: "pending",
        createdAt: Date.now(),
        timestamp: Date.now(),
        to: chain.CommBankDotEth,
        asset: {
          address: asset.address,
          symbol: asset.symbol,
          decimals: asset.decimals,
          amount: withdrawAmount.toString(),
          formattedAmount: formatUnits(withdrawAmount, asset.decimals),
        },
        sender: {
          privateAddress: privateAddress || undefined,
          isSelf: true,
        },
        recipient: {
          evmAddress: evmAddress,
          isSelf: true, // Withdrawing to own EVM address
        },
        inputNotes: inputNoteCommitments,
        outputNotes: [], // Will be populated after proof generation
      };

      await addTransaction(pendingTx);
      console.log("Created pending withdraw transaction:", txId);

      try {
        // 5. Create input notes for the circuit
        const inputNotes: InputNote[] = await Promise.all(
          selectedInputs.map(async (note) => {
            const parsedNote = {
              assetId: note.assetId,
              assetAmount: note.assetAmount,
              secret: note.secret,
              owner: note.entity_id,
            };
            const noteHash = getNoteHash(parsedNote);
            const leafs = await getAllTreeLeaves();

            const [leaf] = leafs.filter(
              (item) => BigInt(item.leafValue) === BigInt(noteHash),
            );

            if (!leaf) {
              throw new Error(
                `Note not found in merkle tree: ${note.entity_id}`,
              );
            }

            const merkleProof = await tree.getProof(Number(leaf.leafIndex));

            return createSpendableNote(
              ownerSecret,
              parsedNote,
              leaf,
              merkleProof,
            );
          }),
        );

        // Pad with empty notes
        while (inputNotes.length < 3) {
          inputNotes.push(EMPTY_INPUT_NOTE);
        }

        // Create output notes for transfer_external
        // First output: external withdrawal (to user's EVM address)
        // Second output: change note (if any) back to user
        const outputNotes: ExternalOutputNote[] = [];

        // External withdrawal note (first position)
        outputNotes.push({
          owner: "0", // Not needed for external withdrawal
          secret: "0", // Not needed for external withdrawal
          asset_id: asset.address,
          asset_amount: withdrawAmount.toString(),
          external_address: BigInt(evmAddress).toString(), // User's EVM address
        });

        // Change note for sender (if any)
        if (changeAmount > 0n) {
          const changeSecret = getRandomInPoseidonField();
          outputNotes.push({
            owner: owner.toString(),
            secret: changeSecret.toString(),
            asset_id: asset.address,
            asset_amount: changeAmount.toString(),
            external_address: "0", // Internal note, no external address
          });
        }

        // Pad with empty notes
        while (outputNotes.length < 3) {
          outputNotes.push(EMPTY_EXTERNAL_OUTPUT_NOTE);
        }

        // Calculate nullifiers for input notes
        const nullifiers = inputNotes.map((item) => getNullifier(item));

        // Calculate output hashes - only for internal notes (change note)
        // External withdrawal notes have hash = 0
        const outputHashes = outputNotes.map((note) => {
          if (note.external_address !== "0" || note.owner === "0") return "0";
          return getNoteHash({
            owner: note.owner,
            secret: note.secret,
            asset_id: note.asset_id,
            asset_amount: note.asset_amount,
          });
        });

        // Exit parameters for external withdrawals
        // These are public inputs that tell the contract what to withdraw
        const exitAssets = outputNotes.map((note) =>
          note.external_address !== "0" ? note.asset_id : "0",
        );
        const exitAmounts = outputNotes.map((note) =>
          note.external_address !== "0" ? note.asset_amount : "0",
        );
        const exitAddresses = outputNotes.map((note) =>
          note.external_address !== "0" ? note.external_address : "0",
        );
        const exitAddressHashes = outputNotes.map((note) =>
          note.external_address !== "0"
            ? poseidon2Hash([BigInt(note.external_address)]).toString()
            : "0",
        );

        console.log("Nullifiers:", nullifiers);
        console.log("Output hashes:", outputHashes);
        console.log("Exit assets:", exitAssets);
        console.log("Exit amounts:", exitAmounts);
        console.log("Exit addresses:", exitAddresses);
        console.log("Exit address hashes:", exitAddressHashes);

        // Generate ZK proof
        const root = await tree.getRoot();
        console.log("Merkle root:", root.toString());

        const transferExternal = new TransferExternal();
        await transferExternal.transferExternalNoir.init();

        const { witness } = await transferExternal.transferExternalNoir.execute(
          {
            root: root.toString(),
            // @ts-expect-error -- Noir needs better generics
            input_notes: inputNotes,
            // @ts-expect-error -- Noir needs better generics
            output_notes: outputNotes,
            nullifiers,
            output_hashes: outputHashes,
            exit_assets: exitAssets,
            exit_amounts: exitAmounts,
            exit_addresses: exitAddresses,
            exit_address_hashes: exitAddressHashes,
          },
        );

        const proof =
          await transferExternal.transferExternalBackend.generateProof(
            witness,
            {
              keccakZK: true,
            },
          );

        console.log("TransferExternal proof generated:", proof);

        // Encrypt output notes - only the change note needs encryption
        const encryptedPayload: string[] = [];

        for (let i = 0; i < outputNotes.length; i++) {
          const note = outputNotes[i];
          // External withdrawal notes don't need encryption
          if (note.external_address !== "0" || note.owner === "0") {
            encryptedPayload.push("0x");
          } else {
            // This is an internal note (change) - encrypt it for ourselves
            const publicKey =
              await NoteEncryption.getPublicKeyFromAddress(wallet);

            const encryptedNote = await NoteEncryption.encryptNoteData(
              {
                secret: note.secret,
                owner: note.owner,
                asset_id: note.asset_id,
                asset_amount: note.asset_amount,
              },
              publicKey,
            );

            encryptedPayload.push(encryptedNote);
          }
        }

        console.log("Encrypted payload:", encryptedPayload);

        if (onProofSuccess) {
          onProofSuccess();
        }

        // Connect to provider and signer
        const provider = new ethers.JsonRpcProvider(chain.rpc);
        const signer = wallet.connect(provider);

        // Get adjusted gas price (doubled on Sepolia)
        const gasPrice = await getAdjustedGasPrice(provider);

        // Initialize contract
        const commbankDotEthContract = new ethers.Contract(
          chain.CommBankDotEth,
          commbankDotEthAbi,
          signer,
        );

        // 6. Call transferExternal on the contract
        const withdrawTx = await commbankDotEthContract.transferExternal(
          proof.proof,
          proof.publicInputs,
          encryptedPayload,
          { gasPrice },
        );

        console.log("Withdraw transaction submitted:", withdrawTx.hash);

        // 7. Update transaction with hash and submission time
        const outputNoteInfos = outputHashes.map((hash, i) => ({
          commitment: hash,
          isInput: false,
          isChange: i === 1 && changeAmount > 0n,
        }));

        await updateTransaction({
          ...pendingTx,
          transactionHash: withdrawTx.hash,
          submittedAt: Date.now(),
          data: withdrawTx.data,
          gasPrice: gasPrice?.toString(),
          outputNotes: outputNoteInfos,
        });

        // Refetch transactions to update UI
        await refetchTransactions();

        // 8. Notify caller - they can now safely navigate away
        if (onTxSubmitted) {
          onTxSubmitted(withdrawTx.hash);
        }

        // 9. Start background monitoring (non-blocking)
        monitorWithdrawTransaction(
          txId,
          withdrawTx,
          selectedInputs,
          outputNotes,
          outputHashes,
          changeAmount,
          privateAddress,
          refetchTransactions,
          onTxConfirmed,
        );

        return {
          txId,
          txHash: withdrawTx.hash,
          proof,
          inputNotes,
          outputNotes,
          nullifiers,
          outputHashes,
          encryptedPayload,
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
 * Background monitoring function for withdraw - runs after returning to the caller
 */
async function monitorWithdrawTransaction(
  txId: string,
  tx: ethers.ContractTransactionResponse,
  selectedInputs: Note[],
  outputNotes: ExternalOutputNote[],
  outputHashes: string[],
  changeAmount: bigint,
  privateAddress: string | null,
  refetchTransactions: () => Promise<unknown>,
  onTxConfirmed?: () => void,
) {
  try {
    const receipt = await tx.wait();

    if (receipt) {
      // Transaction confirmed
      await updateTransactionStatus(txId, "confirmed", {
        confirmedAt: Date.now(),
        gasUsed: receipt.gasUsed.toString(),
      });

      // Mark input notes as used
      for (const input of selectedInputs) {
        await addNote({
          ...input,
          isUsed: true,
        });
      }

      // Add change note to database if it exists
      if (changeAmount > 0n && privateAddress) {
        const changeNote = outputNotes[1]; // Change note is second output
        await addNote({
          id: outputHashes[1],
          assetId: changeNote.asset_id,
          assetAmount: changeNote.asset_amount,
          nullifier: outputHashes[1],
          secret: changeNote.secret,
          entity_id: privateAddress,
          isUsed: false,
        });
      }

      console.log("Withdraw transaction confirmed:", receipt.hash);

      // Refetch to update UI
      await refetchTransactions();

      if (onTxConfirmed) {
        onTxConfirmed();
      }
    }
  } catch (error) {
    // Transaction failed
    console.error("Withdraw transaction failed:", error);
    await updateTransactionStatus(txId, "failed", {
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
    await refetchTransactions();
  }
}
