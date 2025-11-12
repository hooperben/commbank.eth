import { PoseidonMerkleTree } from "@/helpers/poseidon-merkle-tree";
import { getNoirClasses } from "@/helpers/test-suite/get-noir-classes";
import { CommBankDotEth } from "@/typechain-types";
import { ProofData } from "@aztec/bb.js";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "ethers";
import { InputNote, OutputNote } from "..";
import { EncryptedNote, NoteEncryption } from "../note-sharing";

export const getTransferDetails = async (
  tree: PoseidonMerkleTree,
  inputNotes: InputNote[],
  nullifiers: BigInt[],
  outputNotes: OutputNote[],
  outputHashes: BigInt[],
) => {
  const { transferNoir, transferBackend } = getNoirClasses();

  const root = await tree.getRoot();

  const { witness: transferWitness } = await transferNoir.execute({
    root: root.toBigInt().toString(),
    // not my ideal any'ing please don't judge me
    input_notes: inputNotes as any,
    output_notes: outputNotes as any,
    nullifiers: nullifiers.map((item) => item.toString()),
    output_hashes: outputHashes.map((item) => item.toString()),
  });

  const transferProof = await transferBackend.generateProof(transferWitness, {
    keccakZK: true,
  });

  return {
    proof: transferProof,
  };
};

export const transfer = async (
  commbankDotEth: CommBankDotEth,
  proof: ProofData,
  runner: HardhatEthersSigner,
  encryptedNotes?: (EncryptedNote | "0x")[],
) => {
  // Convert encrypted notes to bytes arrays for the contract
  const payload: string[] = [];

  if (encryptedNotes) {
    for (const note of encryptedNotes) {
      if (note === "0x" || !note) {
        payload.push("0x");
      } else {
        // Encode the encrypted note object as bytes
        const encodedNote = ethers.AbiCoder.defaultAbiCoder().encode(
          ["string", "string", "string", "string"],
          [note.encryptedSecret, note.owner, note.asset_id, note.asset_amount],
        );
        payload.push(encodedNote);
      }
    }
  }

  const tx = await commbankDotEth
    .connect(runner)
    .transfer(proof.proof, proof.publicInputs, payload);

  return tx;
};

export const encodeEncryptedPayload = async (
  encryptedNotes: (EncryptedNote | "0x")[],
): Promise<string[]> => {
  const payload: string[] = [];

  for (const note of encryptedNotes) {
    if (note === "0x" || !note) {
      payload.push("0x");
    } else {
      // Encode the encrypted note object as bytes
      const encodedNote = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "string", "string", "string"],
        [note.encryptedSecret, note.owner, note.asset_id, note.asset_amount],
      );
      payload.push(encodedNote);
    }
  }

  return payload;
};

export const createDepositPayload = async (
  outputNote: {
    secret: string | bigint;
    owner: string;
    asset_id: string;
    asset_amount: string;
  },
  recipientSigner: HardhatEthersSigner,
): Promise<string[]> => {
  const encryptedNote = await NoteEncryption.createEncryptedNote(
    outputNote,
    recipientSigner,
  );

  return await encodeEncryptedPayload([encryptedNote, "0x", "0x"]);
};
