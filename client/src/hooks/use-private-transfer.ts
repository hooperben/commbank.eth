import type { Contact, Note } from "@/_types";
import { useAuth } from "@/lib/auth-context";
import { getAllTreeLeaves } from "@/lib/db";
import { useMutation } from "@tanstack/react-query";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { ethers } from "ethers";
import { NoteEncryption } from "shared/classes/Note";
import type { PoseidonMerkleTree } from "shared/classes/PoseidonMerkleTree";
import { Transact } from "shared/classes/Transact";
import type { SupportedAsset } from "shared/constants/token";
import { getRandomInPoseidonField } from "shared/constants/zk";

interface PrivateTransferParams {
  amount: string;
  asset: SupportedAsset;
  recipient: Contact;
  sendingNotes: Note[];
  tree: PoseidonMerkleTree;
}

export function usePrivateTransfer() {
  const { getMnemonic } = useAuth();

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
          !note.isUsed &&
          note.assetId.toLowerCase() === asset.address.toLowerCase(),
      );
      console.log("Unused notes:", unusedNotes);

      // Convert amount to proper units
      const sendAmount = ethers.parseUnits(amount, asset.decimals);
      console.log("Send amount:", sendAmount.toString());

      // Select input notes (UTXO selection - greedy algorithm)
      const selectedInputs: typeof unusedNotes = [];
      let totalInputAmount = 0n;

      for (const note of unusedNotes) {
        if (selectedInputs.length >= 3) break; // Max 3 inputs
        selectedInputs.push(note);
        totalInputAmount += BigInt(note.assetAmount);
        if (totalInputAmount >= sendAmount) break;
      }

      if (totalInputAmount < sendAmount) {
        throw new Error("Insufficient funds in selected notes");
      }

      console.log("Selected input notes:", selectedInputs);
      console.log("Total input amount:", totalInputAmount.toString());

      // Calculate change
      const changeAmount = totalInputAmount - sendAmount;
      console.log("Change amount:", changeAmount.toString());

      // Create input notes for the circuit
      const HEIGHT = 12;
      const emptyInputNote = {
        asset_id: "0",
        asset_amount: "0",
        owner: "0",
        owner_secret: "0",
        secret: "0",
        leaf_index: "0",
        path: Array(HEIGHT - 1).fill("0"),
        path_indices: Array(HEIGHT - 1).fill("0"),
      };

      const inputNotes = await Promise.all(
        selectedInputs.map(async (note) => {
          const noteHash = poseidon2Hash([
            BigInt(note.assetId),
            BigInt(note.assetAmount),
            BigInt(owner),
            BigInt(note.secret),
          ]);

          const leafs = await getAllTreeLeaves();

          const [leaf] = leafs.filter(
            (item) => BigInt(item.leafValue) === noteHash,
          );

          if (!leaf) {
            throw new Error(`Note not found in merkle tree: ${note.entity_id}`);
          }

          const merkleProof = await tree.getProof(Number(leaf.leafIndex));

          return {
            asset_id: note.assetId,
            asset_amount: note.assetAmount,
            owner: owner.toString(),
            owner_secret: ownerSecret.toString(),
            secret: note.secret,
            leaf_index: leaf.leafIndex.toString(),
            path: merkleProof.siblings.map((s) => s.toString()),
            path_indices: merkleProof.indices.map((i) => i.toString()),
          };
        }),
      );

      // Pad with empty notes
      while (inputNotes.length < 3) {
        inputNotes.push(emptyInputNote);
      }

      // Create output notes
      const emptyOutputNote = {
        owner: "0",
        secret: "0",
        asset_id: "0",
        asset_amount: "0",
      };

      const outputNotes = [];

      // Output note for recipient
      const recipientSecret = getRandomInPoseidonField();

      outputNotes.push({
        owner: recipient.privateAddress || "0",
        secret: recipientSecret.toString(),
        asset_id: asset.address,
        asset_amount: sendAmount.toString(),
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
        outputNotes.push(emptyOutputNote);
      }

      const nullifiers = inputNotes.map((item) => {
        const nullifier = poseidon2Hash([
          BigInt(item.leaf_index),
          BigInt(item.owner),
          BigInt(item.secret),
          BigInt(item.asset_id),
          BigInt(item.asset_amount),
        ]);
        return nullifier.toString();
      });

      while (nullifiers.length < 3) {
        nullifiers.push("0");
      }

      const outputHashes = outputNotes.map((note) => {
        if (note.owner === "0") return "0";
        return poseidon2Hash([
          BigInt(note.asset_id),
          BigInt(note.asset_amount),
          BigInt(note.owner),
          BigInt(note.secret),
        ]).toString();
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
        input_notes: inputNotes,
        output_notes: outputNotes,
        nullifiers,
        output_hashes: outputHashes,
      });

      const proof = await transact.transactBackend.generateProof(witness, {
        keccak: true,
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
          let recipientPublicKey: string;

          if (i === 0 && recipient.envelopeAddress) {
            // First output note is for the recipient
            recipientPublicKey = recipient.envelopeAddress;
          } else {
            // Change note for sender - use sender's wallet
            recipientPublicKey =
              await NoteEncryption.getPublicKeyFromAddress(wallet);
          }

          // Encrypt the entire note (secret, owner, asset_id, asset_amount)
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

      return {
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
