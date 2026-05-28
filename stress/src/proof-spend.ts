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

// In-circuit balance violation. Mutates the witness inputs to deliberately
// break `assert_balanced` so the new mask-multiply check in
// circuits/transfer/src/main.nr has something concrete to reject.
//   - "mint_same":  output asset_amount > input asset_amount for the same
//                   asset_id. Triggers Pass A (anchored on input asset_id,
//                   in_sum < out_sum).
//   - "mint_fresh": second output slot carries a fresh asset_id never on
//                   the input side, with positive amount. Triggers Pass B
//                   (anchored on output asset_id, in_sum == 0 < out_sum).
// The expected outcome is `noir.execute()` throws "Cannot satisfy constraint"
// before any proof is generated. Worker logs balance_violation rejected by
// circuit (expected). If a proof ever generates, the harness escalates to
// CRITICAL_BALANCE_ACCEPTED — that would mean assert_balanced is missing
// or incomplete.
export type BalanceTamper = "mint_same" | "mint_fresh";

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
    await transactSingleton.init();
  }
  return transactSingleton;
};

const getWithdraw = async () => {
  if (!withdrawSingleton) {
    withdrawSingleton = new Withdraw();
    await withdrawSingleton.withdrawNoir.init();
    await withdrawSingleton.init();
  }
  return withdrawSingleton;
};

// 1-in / 1-out self-transfer: spend `note`, create a new note for the
// same worker with a fresh secret and the same amount.
//
// `tamper`, when set, deliberately breaks the in-circuit balance invariant.
// See BalanceTamper above for the two variants. Used by the balance probe.
export const generateTransferProof = async (
  note: StoredNote,
  newSecret: bigint,
  treePath: { root: bigint; siblings: bigint[]; indices: number[] },
  tamper?: BalanceTamper,
): Promise<TransferProofResult> => {
  const transact = await getTransact();

  const nullifier = computeNullifier(note);

  // For mint_same we inflate the output by 1 unit; for mint_fresh we leave
  // slot 0 honest (so the input/output balance for the real asset_id is
  // still equal) and add slot 1 as a never-deposited asset_id with amount.
  const tamperedOutputAmount =
    tamper === "mint_same" ? note.amount + 1n : note.amount;

  const outputNoteHash = computeNoteHash(
    note.assetId,
    tamperedOutputAmount,
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
    asset_amount: tamperedOutputAmount.toString(),
    external_address: "0",
  };

  // Second output slot is the mint_fresh probe: a brand-new asset_id with
  // a positive amount, owned by us. Pass B of assert_balanced anchors on
  // this asset_id, computes in_sum = 0 (no input matches), out_sum > 0,
  // and reverts. Pass A (anchored on the honest input asset_id) is
  // already balanced, so it does NOT catch this case — Pass B is the
  // only safety net, which is precisely what we want to exercise.
  const FRESH_ASSET_ID =
    0xdeadbeefcafebabe1234567890abcdef00112233n.toString();
  const freshAmount = 1n;
  const freshOutputNoteHash =
    tamper === "mint_fresh"
      ? computeNoteHash(
          BigInt(FRESH_ASSET_ID),
          freshAmount,
          note.owner,
          newSecret + 1n,
        )
      : 0n;
  const secondOutput: OutputNoteFields =
    tamper === "mint_fresh"
      ? {
          owner: note.owner.toString(),
          secret: (newSecret + 1n).toString(),
          asset_id: FRESH_ASSET_ID,
          asset_amount: freshAmount.toString(),
          external_address: "0",
        }
      : emptyOutput();

  const { witness } = await transact.transactNoir.execute({
    root: treePath.root.toString(),
    input_notes: [inputNote, emptyInput(), emptyInput()] as any,
    output_notes: [outputNote, secondOutput, emptyOutput()] as any,
    nullifiers: [nullifier.toString(), "0", "0"],
    output_hashes: [
      outputNoteHash.toString(),
      freshOutputNoteHash.toString(),
      "0",
    ],
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
