import type { TreeLeaf } from "@/_types";
import { poseidon2Hash } from "@zkpassport/poseidon2";

export interface DepositNote {
  assetId: string | bigint;
  assetAmount: string | bigint;
  secret: string | bigint;
  owner: string | bigint;
}

export interface InputNote {
  asset_id: bigint | string;
  asset_amount: bigint | string;
  owner: bigint | string;
  owner_secret: bigint | string;
  secret: bigint | string;
  leaf_index: bigint | string;
  path: bigint[] | string[];
  path_indices: bigint[] | string[];
}

export interface OutputNote {
  owner: string;
  secret: string;
  asset_id: string;
  asset_amount: string;
}

export const TREE_HEIGHT = 12;

export const EMPTY_INPUT_NOTE: InputNote = {
  asset_id: "0",
  asset_amount: "0",
  owner: "0",
  owner_secret: "0",
  secret: "0",
  leaf_index: "0",
  path: Array(TREE_HEIGHT - 1).fill("0"),
  path_indices: Array(TREE_HEIGHT - 1).fill("0"),
};

export const EMPTY_OUTPUT_NOTE: OutputNote = {
  owner: "0",
  secret: "0",
  asset_id: "0",
  asset_amount: "0",
};

export const getNullifier = (note: InputNote) => {
  // For empty input notes, return "0" instead of computing hash
  if (note.owner === "0") return "0";

  const nullifier = poseidon2Hash([
    BigInt(note.leaf_index),
    BigInt(note.owner),
    BigInt(note.secret),
    BigInt(note.asset_id),
    BigInt(note.asset_amount),
  ]);
  return nullifier.toString();
};

export const getNoteHash = (note: DepositNote | OutputNote): string => {
  if ("assetId" in note) {
    return poseidon2Hash([
      BigInt(note.assetId),
      BigInt(note.assetAmount),
      BigInt(note.owner),
      BigInt(note.secret),
    ]).toString();
  }

  return poseidon2Hash([
    BigInt(note.asset_id),
    BigInt(note.asset_amount),
    BigInt(note.owner),
    BigInt(note.secret),
  ]).toString();
};

export const createSpendableNote = (
  ownerSecret: bigint,
  note: DepositNote,
  leaf: TreeLeaf,
  merkleProof: {
    siblings: bigint[];
    indices: number[];
  },
) => {
  return {
    asset_id: note.assetId,
    asset_amount: note.assetAmount,
    owner: note.owner.toString(),
    owner_secret: ownerSecret.toString(),
    secret: note.secret,
    leaf_index: leaf.leafIndex.toString(),
    path: merkleProof.siblings.map((s) => s.toString()),
    path_indices: merkleProof.indices.map((i) => i.toString()),
  };
};
