import { SUPPORTED_NETWORKS } from "@/_constants/networks";
import {
  createSpendableNote,
  EMPTY_INPUT_NOTE,
  EMPTY_OUTPUT_NOTE,
  getNoteHash,
  getNullifier,
  type InputNote,
  type OutputNote,
} from "@/_constants/notes";
import { useAuth } from "@/_providers/auth-provider";
import type { Contact, Note } from "@/_types";
import { addNote, addTransaction, getAllTreeLeaves } from "@/lib/db";
import { useMutation } from "@tanstack/react-query";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { ethers } from "ethers";
import { NoteEncryption } from "shared/classes/Note";
import type { PoseidonMerkleTree } from "shared/classes/PoseidonMerkleTree";
import { Transact } from "shared/classes/Transact";
import { commbankDotEthAbi } from "shared/constants/abi/commbankdoteth";
import { defaultNetwork, type SupportedAsset } from "shared/constants/token";
import { getRandomInPoseidonField } from "shared/constants/zk";
import { useTransactionsByChainId } from "./use-transactions";

interface PrivateTransferParams {
  amount: bigint;
  asset: SupportedAsset;
  recipient: Contact;
  sendingNotes: Note[];
  tree: PoseidonMerkleTree;
}

export function usePrivateTransfer({
  onProofSuccess,
  onTxSuccess,
  onReceiptSuccess,
}: {
  onProofSuccess?: () => void;
  onTxSuccess?: () => void;
  onReceiptSuccess?: () => void;
} = {}) {
  const { getMnemonic, privateAddress } = useAuth();
  const { refetch: refetchTransactions } =
    useTransactionsByChainId(defaultNetwork);

  return useMutation({
    mutationFn: async ({
      amount,
      asset,
      recipient,
      sendingNotes,
      tree,
    }: PrivateTransferParams) => {
      // Get mnemonic and derive owner secret
      const mnemonic = await getMnemonic();
      if (!mnemonic) {
        throw new Error("No mnemonic available");
      }

      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      const ownerSecret = BigInt(wallet.privateKey);
      const owner = poseidon2Hash([ownerSecret]);

      // Filter unused notes for the specific asset
      const unusedNotes = sendingNotes.filter(
        (note) =>
          !note.isUsed && BigInt(note.assetId) === BigInt(asset.address),
      );
      console.log("Unused notes:", unusedNotes);

      // Convert amount to proper units
      console.log("Send amount:", amount.toString());

      // Select input notes (UTXO selection - greedy algorithm)
      const selectedInputs: typeof unusedNotes = [];
      let totalInputAmount = 0n;

      for (const note of unusedNotes) {
        if (selectedInputs.length >= 3) break; // Max 3 inputs
        selectedInputs.push(note);
        totalInputAmount += BigInt(note.assetAmount);
        if (totalInputAmount >= amount) break;
      }

      if (totalInputAmount < amount) {
        throw new Error("Insufficient funds in selected notes");
      }

      console.log("Selected input notes:", selectedInputs);
      console.log("Total input amount:", totalInputAmount.toString());

      // Calculate change
      const changeAmount = totalInputAmount - amount;
      console.log("Change amount:", changeAmount.toString());

      // Create input notes for the circuit
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
            throw new Error(`Note not found in merkle tree: ${note.entity_id}`);
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

      // Create output notes
      const outputNotes: OutputNote[] = [];

      // Output note for recipient
      const recipientSecret = getRandomInPoseidonField();

      outputNotes.push({
        owner: recipient.privateAddress || "0",
        secret: recipientSecret.toString(),
        asset_id: asset.address,
        asset_amount: amount.toString(),
      });

      // Change note for sender (if any)
      if (changeAmount > 0n) {
        const changeSecret = getRandomInPoseidonField();

        outputNotes.push({
          owner: owner.toString(),
          secret: changeSecret.toString(),
          asset_id: asset.address,
          asset_amount: changeAmount.toString(),
        });
      }

      // Pad with empty notes
      while (outputNotes.length < 3) {
        outputNotes.push(EMPTY_OUTPUT_NOTE);
      }

      const nullifiers = inputNotes.map((item) => getNullifier(item));

      const outputHashes = outputNotes.map((note) => {
        if (note.owner === "0") return "0";
        return getNoteHash(note);
      });

      console.log("Nullifiers:", nullifiers);
      console.log("Output hashes:", outputHashes);

      // Generate ZK proof
      const root = await tree.getRoot();
      console.log("Merkle root:", root.toString());

      const transact = new Transact();
      await transact.transactNoir.init();

      const { witness } = await transact.transactNoir.execute({
        root: root.toString(),
        // @ts-expect-error -- Noir needs better generics I think?
        input_notes: inputNotes,
        // @ts-expect-error -- Noir needs better generics I think?
        output_notes: outputNotes,
        nullifiers,
        output_hashes: outputHashes,
      });

      const proof = await transact.transactBackend.generateProof(witness, {
        keccakZK: true,
      });

      console.log("Transfer proof generated:", proof);

      // Encrypt output notes for recipients
      const encryptedPayload: string[] = [];

      for (let i = 0; i < outputNotes.length; i++) {
        const note = outputNotes[i];
        if (note.owner === "0") {
          encryptedPayload.push("0x");
        } else {
          // Determine the recipient's public key
          const recipientPublicKey =
            i === 0 && recipient.envelopeAddress
              ? recipient.envelopeAddress
              : await NoteEncryption.getPublicKeyFromAddress(wallet);

          // Encrypt the note
          const encryptedNote = await NoteEncryption.encryptNoteData(
            {
              secret: note.secret,
              owner: note.owner,
              asset_id: note.asset_id,
              asset_amount: note.asset_amount,
            },
            recipientPublicKey,
          );

          encryptedPayload.push(encryptedNote);
        }
      }

      console.log("Encrypted payload:", encryptedPayload);

      if (onProofSuccess) {
        onProofSuccess();
      }

      // Get network configuration
      const chain = SUPPORTED_NETWORKS[defaultNetwork];
      if (!chain) throw new Error("Network not configured");

      // Connect to provider and signer
      const provider = new ethers.JsonRpcProvider(chain.rpc);
      const signer = wallet.connect(provider);

      // Get current gas price from RPC
      const feeData = await provider.getFeeData();

      const gasPrice =
        chain.id === 1 ? feeData.gasPrice : (feeData.gasPrice ?? 0n * 2n);

      // Initialize contract
      const commbankDotEthContract = new ethers.Contract(
        chain.CommBankDotEth,
        commbankDotEthAbi,
        signer,
      );

      // Call transfer on the contract
      const transferTx = await commbankDotEthContract.transfer(
        proof.proof,
        proof.publicInputs,
        encryptedPayload,
        { gasPrice },
      );

      console.log(transferTx);

      console.log("Transfer transaction submitted:", transferTx.hash);

      if (onTxSuccess) {
        onTxSuccess();
      }

      // Wait for transaction receipt
      const transferReceipt = await transferTx.wait();

      console.log("Transfer transaction confirmed:", transferReceipt.hash);

      // Log transaction to IndexedDB
      if (transferReceipt) {
        try {
          await addTransaction({
            id: transferReceipt.hash,
            chainId: defaultNetwork,
            transactionHash: transferReceipt.hash,
            type: "Transfer",
            to: chain.CommBankDotEth,
            data: transferTx.data,
            timestamp: Date.now(),
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

          // Refetch transactions to update UI
          await refetchTransactions();
        } catch (dbError) {
          console.error("Failed to log transaction to database:", dbError);
        }
      }

      if (onReceiptSuccess) {
        onReceiptSuccess();
      }

      return {
        txHash: transferTx.hash,
        proof,
        inputNotes,
        outputNotes,
        nullifiers,
        outputHashes,
        encryptedPayload,
      };
    },
  });
}
