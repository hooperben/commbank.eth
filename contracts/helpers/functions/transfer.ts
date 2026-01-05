import { PoseidonMerkleTree } from "@/helpers/poseidon-merkle-tree";
import { getNoirClasses } from "@/helpers/objects/get-noir-classes";
import { CommBankDotEth } from "@/typechain-types";
import { ProofData } from "@aztec/bb.js";
import { ethers } from "ethers";
import { InputNote, OutputNote } from "@/types/notes";
import { EncryptedNote, NoteEncryption } from "../note-sharing";

export const getTransferDetails = async (
  tree: PoseidonMerkleTree,
  inputNotes: InputNote[],
  nullifiers: bigint[],
  outputNotes: OutputNote[],
  outputHashes: bigint[],
) => {
  const { transferNoir, transferBackend } = getNoirClasses();

  const root = await tree.getRoot();

  const { witness: transferWitness } = await transferNoir.execute({
    root: root.toString(),
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
  runner: ethers.Signer,
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
  recipientSigner: ethers.Signer,
): Promise<string[]> => {
  const encryptedNote = await NoteEncryption.createEncryptedNote(
    outputNote,
    recipientSigner,
  );

  return await encodeEncryptedPayload([encryptedNote, "0x", "0x"]);
};

export const getTransferExternalDetails = async (
  tree: PoseidonMerkleTree,
  inputNotes: InputNote[],
  nullifiers: (bigint | string)[],
  outputNotes: OutputNote[],
  outputHashes: (bigint | string)[],
  exitAssets: (bigint | string)[],
  exitAmounts: (bigint | string)[],
  exitAddresses: (bigint | string)[],
  exitAddressHashes: (bigint | string)[],
) => {
  const { transferExternalNoir, transferExternalBackend } = getNoirClasses();

  const root = await tree.getRoot();

  const { witness: transferExternalWitness } =
    await transferExternalNoir.execute({
      root: root.toString(),
      input_notes: inputNotes as any,
      output_notes: outputNotes as any,
      nullifiers: nullifiers.map((item) => item.toString()),
      output_hashes: outputHashes.map((item) => item.toString()),
      exit_assets: exitAssets.map((item) => item.toString()),
      exit_amounts: exitAmounts.map((item) => item.toString()),
      exit_addresses: exitAddresses.map((item) => item.toString()),
      exit_address_hashes: exitAddressHashes.map((item) => item.toString()),
    });

  const transferExternalProof = await transferExternalBackend.generateProof(
    transferExternalWitness,
    {
      keccakZK: true,
    },
  );

  return {
    proof: transferExternalProof,
  };
};

export const transferExternal = async (
  commbankDotEth: CommBankDotEth,
  proof: ProofData,
  runner: ethers.Signer,
  encryptedNotes?: (EncryptedNote | "0x")[],
) => {
  const payload: string[] = [];

  if (encryptedNotes) {
    for (const note of encryptedNotes) {
      if (note === "0x" || !note) {
        payload.push("0x");
      } else {
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
    .transferExternal(proof.proof, proof.publicInputs, payload);

  return tx;
};
