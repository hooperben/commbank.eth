// Transfer + withdraw proof generation. Both circuits take NOTE_COUNT=3
// input slots and (for transfer) 3 output slots; we only fill slot 0 with
// a real note and zero-pad the rest. The Noir loops are `for i in 0..2`
// (exclusive) so they actually only process slots 0 and 1 anyway.

import { poseidon2Hash } from "@zkpassport/poseidon2";

import { TREE_HEIGHT } from "../../contracts/helpers/tree-config.js";
import { Transact } from "../../shared/classes/Transact.js";
import { Withdraw } from "../../shared/classes/Withdraw.js";

import type { StoredNote } from "./note-store.js";

// Match contracts/helpers/note-formatting.ts shape.
type InputNoteFields = {
  asset_id: string;
  asset_amount: string;
  owner: string;
  owner_secret: string;
  secret: string;
  leaf_index: string;
  path: string[];
  path_indices: string[];
};

type OutputNoteFields = {
  owner: string;
  secret: string;
  asset_id: string;
  asset_amount: string;
  external_address: string;
};

const PATH_LEN = TREE_HEIGHT - 1; // 11 at height 12

const emptyInput = (): InputNoteFields => ({
  asset_id: "0",
  asset_amount: "0",
  owner: "0",
  owner_secret: "0",
  secret: "0",
  leaf_index: "0",
  path: Array(PATH_LEN).fill("0"),
  path_indices: Array(PATH_LEN).fill("0"),
});

const emptyOutput = (): OutputNoteFields => ({
  owner: "0",
  secret: "0",
  asset_id: "0",
  asset_amount: "0",
  external_address: "0",
});

export const computeNullifier = (n: StoredNote): bigint =>
  BigInt(
    poseidon2Hash([
      n.leafIndex,
      n.owner,
      n.secret,
      n.assetId,
      n.amount,
    ]).toString(),
  );

export const computeNoteHash = (
  assetId: bigint,
  amount: bigint,
  owner: bigint,
  secret: bigint,
): bigint =>
  BigInt(poseidon2Hash([assetId, amount, owner, secret]).toString());

export type TransferProofResult = {
  proof: { proof: Uint8Array; publicInputs: string[] };
  nullifier: bigint;
  outputNote: StoredNote; // The new note created for the same worker.
};

export type WithdrawProofResult = {
  proof: { proof: Uint8Array; publicInputs: string[] };
  nullifier: bigint;
  exitAddress: bigint;
};

let transactSingleton: Transact | null = null;
let withdrawSingleton: Withdraw | null = null;

const getTransact = async () => {
  if (!transactSingleton) {
    transactSingleton = new Transact();
    await transactSingleton.transactNoir.init();
  }
  return transactSingleton;
};

const getWithdraw = async () => {
  if (!withdrawSingleton) {
    withdrawSingleton = new Withdraw();
    await withdrawSingleton.withdrawNoir.init();
  }
  return withdrawSingleton;
};

// 1-in / 1-out self-transfer: spend `note`, create a new note for the
// same worker with a fresh secret and the same amount.
export const generateTransferProof = async (
  note: StoredNote,
  newSecret: bigint,
  treePath: { root: bigint; siblings: bigint[]; indices: number[] },
): Promise<TransferProofResult> => {
  const transact = await getTransact();

  const nullifier = computeNullifier(note);

  const outputNoteHash = computeNoteHash(
    note.assetId,
    note.amount,
    note.owner,
    newSecret,
  );

  const inputNote: InputNoteFields = {
    asset_id: note.assetId.toString(),
    asset_amount: note.amount.toString(),
    owner: note.owner.toString(),
    owner_secret: note.ownerSecret.toString(),
    secret: note.secret.toString(),
    leaf_index: note.leafIndex.toString(),
    path: treePath.siblings.map((s) => s.toString()),
    path_indices: treePath.indices.map((i) => i.toString()),
  };

  const outputNote: OutputNoteFields = {
    owner: note.owner.toString(),
    secret: newSecret.toString(),
    asset_id: note.assetId.toString(),
    asset_amount: note.amount.toString(),
    external_address: "0",
  };

  const { witness } = await transact.transactNoir.execute({
    root: treePath.root.toString(),
    input_notes: [inputNote, emptyInput(), emptyInput()] as any,
    output_notes: [outputNote, emptyOutput(), emptyOutput()] as any,
    nullifiers: [nullifier.toString(), "0", "0"],
    output_hashes: [outputNoteHash.toString(), "0", "0"],
  });

  const proof = await transact.transactBackend.generateProof(witness, {
    keccakZK: true,
  });

  return {
    proof,
    nullifier,
    outputNote: {
      // leafIndex + epoch filled in after the relayer submits and we observe the LeafInserted
      epoch: 0n,
      leafIndex: 0n,
      noteHash: outputNoteHash,
      secret: newSecret,
      owner: note.owner,
      ownerSecret: note.ownerSecret,
      assetId: note.assetId,
      amount: note.amount,
    },
  };
};

// 1-in / 1-exit withdraw: spend `note`, send the ETH/token to exitAddress.
export const generateWithdrawProof = async (
  note: StoredNote,
  exitAddress: bigint,
  treePath: { root: bigint; siblings: bigint[]; indices: number[] },
): Promise<WithdrawProofResult> => {
  const withdraw = await getWithdraw();

  const nullifier = computeNullifier(note);
  const exitAddressHash = BigInt(poseidon2Hash([exitAddress]).toString());

  const inputNote: InputNoteFields = {
    asset_id: note.assetId.toString(),
    asset_amount: note.amount.toString(),
    owner: note.owner.toString(),
    owner_secret: note.ownerSecret.toString(),
    secret: note.secret.toString(),
    leaf_index: note.leafIndex.toString(),
    path: treePath.siblings.map((s) => s.toString()),
    path_indices: treePath.indices.map((i) => i.toString()),
  };

  const { witness } = await withdraw.withdrawNoir.execute({
    root: "0x" + treePath.root.toString(16),
    input_notes: [inputNote, emptyInput(), emptyInput()] as any,
    nullifiers: [nullifier.toString(), "0", "0"] as any,
    exit_assets: [note.assetId.toString(), "0", "0"] as any,
    exit_amounts: [note.amount.toString(), "0", "0"] as any,
    exit_addresses: [exitAddress.toString(), "0", "0"] as any,
    exit_address_hashes: [exitAddressHash.toString(), "0", "0"] as any,
  });

  const proof = await withdraw.withdrawBackend.generateProof(witness, {
    keccakZK: true,
  });

  return { proof, nullifier, exitAddress };
};
