// A single worker. Each iteration:
//
//   1. picks an action  (deposit / transfer / withdraw) by P_TRANSFER/P_WITHDRAW
//   2. picks a test mode (normal / invalid_proof / double_spend)
//   3. generates the proof, optionally corrupts a byte, submits
//   4. asserts the chain accepted (normal) or rejected (injected)
//
// Stops when the global op counter hits its target.
//
// v3 notes:
//   * worker uses its assigned Owner identity (10 distinct owners across
//     the run)
//   * NonceManager dropped — worker is strictly serial, no nonce races
//   * provider is shared across workers/relayers/listener

import { Contract, JsonRpcProvider, NonceManager, Wallet } from "ethers";

import type { Counter } from "./counter.js";
import { NoteStore, type StoredNote } from "./note-store.js";
import type { Owner } from "./owners.js";
import {
  generateDepositProof,
  type PreparedDeposit,
} from "./proof-pool.js";
import {
  computeNullifier,
  generateTransferProof,
  generateWithdrawProof,
} from "./proof-spend.js";
import type { ExpectedRejectReason, RelayerPool } from "./relayer-pool.js";
import { SpentNoteStore } from "./spent-store.js";
import type { TreeState } from "./tree-state.js";
import { error, info, warn } from "./log.js";

export type WorkerOpts = {
  id: number;
  provider: JsonRpcProvider;
  privateKey: string;
  cbAddress: string;
  cbAbi: any[];
  relayers: RelayerPool;
  tree: TreeState;
  notes: NoteStore;
  spentNotes: SpentNoteStore;
  invariants: Invariants;
  owner: Owner;
  // Action mix
  pTransfer: number;
  pWithdraw: number;
  // Injection rates
  pInvalidProof: number;
  pDoubleSpend: number;
  // Global stop signal
  counter: Counter;
  stopAt: number;
  // For deterministic deposit-secret seeding
  depositSeq: { next: number };
};

export type Invariants = {
  prevLeafIndexByEpoch: Map<number, bigint>;
  lastRoot: bigint | null;
};

export const makeInvariants = (): Invariants => ({
  prevLeafIndexByEpoch: new Map(),
  lastRoot: null,
});

type Action = "deposit" | "transfer" | "withdraw";
type TestMode = "normal" | "invalid_proof" | "double_spend";

const pickAction = (
  notesAvailable: number,
  pTransfer: number,
  pWithdraw: number,
): Action => {
  if (notesAvailable === 0) return "deposit";
  const r = Math.random();
  if (r < pTransfer) return "transfer";
  if (r < pTransfer + pWithdraw) return "withdraw";
  return "deposit";
};

const pickTestMode = (
  action: Action,
  spentNotesAvailable: number,
  pInvalidProof: number,
  pDoubleSpend: number,
): TestMode => {
  // Roll for double-spend first (only applicable to transfer/withdraw, and
  // only if we have a previously-spent note to replay).
  if (
    (action === "transfer" || action === "withdraw") &&
    spentNotesAvailable > 0 &&
    Math.random() < pDoubleSpend
  ) {
    return "double_spend";
  }
  if (Math.random() < pInvalidProof) return "invalid_proof";
  return "normal";
};

const FIELD_PRIME =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;
const randomFieldSecret = (): bigint => {
  let v = 0n;
  for (let i = 0; i < 4; i++) {
    v =
      (v << 64n) |
      (BigInt(Math.floor(Math.random() * 2 ** 32)) * BigInt(2 ** 32) +
        BigInt(Math.floor(Math.random() * 2 ** 32)));
  }
  return v % FIELD_PRIME;
};

const randomAddress = (): string => {
  const bytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) bytes[i] = Math.floor(Math.random() * 256);
  let s = "0x";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
};

// Flip one byte in the proof bytes to invalidate it. The verifier should
// reject; we don't want a different revert reason like "amount mismatch".
const corruptProof = (proof: {
  proof: Uint8Array;
  publicInputs: string[];
}): { proof: Uint8Array; publicInputs: string[] } => {
  const copy = new Uint8Array(proof.proof);
  // Pick a middle-of-proof byte to flip. First few + last few bytes can
  // be format headers/footers that might surface a different error.
  const idx = 64 + Math.floor(Math.random() * (copy.length - 128));
  copy[idx] ^= 0xff;
  return { proof: copy, publicInputs: proof.publicInputs };
};

export const runWorker = async (opts: WorkerOpts) => {
  // NonceManager because the shared JsonRpcProvider's transaction-count
  // cache can return stale values when many wallets bounce off the same
  // provider in quick succession. The worker itself is strictly serial,
  // so NonceManager just keeps a local counter that's always correct.
  const wallet = new NonceManager(new Wallet(opts.privateKey, opts.provider));
  const cb = new Contract(opts.cbAddress, opts.cbAbi, wallet as any);
  const source = `worker-${opts.id}`;
  const addr = await wallet.getAddress();
  info(source, "started", {
    address: addr,
    owner: opts.owner.owner.toString(),
  });

  while (opts.counter.value() < opts.stopAt) {
    const action = pickAction(
      opts.notes.size(),
      opts.pTransfer,
      opts.pWithdraw,
    );
    const testMode = pickTestMode(
      action,
      opts.spentNotes.size(),
      opts.pInvalidProof,
      opts.pDoubleSpend,
    );

    try {
      if (action === "deposit") {
        await doDeposit(opts, cb, source, testMode);
      } else if (action === "transfer") {
        await doTransfer(opts, source, testMode);
      } else {
        await doWithdraw(opts, source, testMode);
      }
    } catch (e: any) {
      error(source, `${action}/${testMode} iteration failed`, {
        err: e?.message ?? String(e),
      });
    }
  }
  info(source, "stopped (counter reached target)");
};

// ──────────────────────────────────────────────────────────────────────────
// Deposit
// ──────────────────────────────────────────────────────────────────────────

const doDeposit = async (
  opts: WorkerOpts,
  cb: Contract,
  source: string,
  testMode: TestMode,
) => {
  if (testMode === "double_spend") {
    // Doesn't apply to deposits — fall back to normal.
    testMode = "normal";
  }

  const seq = opts.depositSeq.next++;
  const prepared = await generateDepositProof(
    opts.id,
    seq,
    opts.owner.owner,
    opts.owner.ownerSecret,
  );

  const submitProof =
    testMode === "invalid_proof" ? corruptProof(prepared.proof) : prepared.proof;

  const startedAt = Date.now();
  try {
    const tx = await cb.depositNative(
      submitProof.proof,
      submitProof.publicInputs,
      [],
      { value: prepared.amount, gasLimit: 10_000_000n },
    );
    const receipt = await tx.wait();

    if (testMode === "invalid_proof") {
      error(source, "deposit/invalid_proof ACCEPTED by chain", {
        tx: tx.hash,
        note_hash: prepared.noteHash.toString(),
      });
      return;
    }

    const elapsed = Date.now() - startedAt;
    const ev = parseLeafInserted(cb, receipt);
    if (!ev) {
      error(source, "deposit: no LeafInserted in receipt", { tx: tx.hash });
      return;
    }
    if (ev.leafValue !== prepared.noteHash) {
      error(source, "invariant: leafValue != noteHash (deposit)", {
        tx: tx.hash,
        expected: prepared.noteHash.toString(),
        got: ev.leafValue.toString(),
      });
    }
    checkPerWorkerMonotonicity(opts, source, ev.epoch, ev.leafIndex, tx.hash);
    await assertRootKnown(opts, cb, source, tx.hash);

    opts.notes.add({
      epoch: ev.epoch,
      leafIndex: ev.leafIndex,
      noteHash: prepared.noteHash,
      secret: prepared.secret,
      owner: opts.owner.owner,
      ownerSecret: opts.owner.ownerSecret,
      assetId: prepared.assetId,
      amount: prepared.amount,
    });

    emitRolloverIfPresent(cb, receipt, source, tx.hash);
    opts.counter.inc();
    info(source, "deposit ok", {
      epoch: ev.epoch.toString(),
      leafIndex: ev.leafIndex.toString(),
      latency_ms: elapsed,
      tx: tx.hash,
      notes_held: opts.notes.size(),
      progress: opts.counter.value(),
    });
  } catch (e: any) {
    if (testMode === "invalid_proof") {
      // Expected — chain rejected the corrupted proof.
      info(source, "deposit/invalid_proof rejected (expected)", {
        revertReason: e?.reason ?? e?.shortMessage ?? "(no decoded reason)",
        latency_ms: Date.now() - startedAt,
      });
      return;
    }
    throw e;
  }
};

// ──────────────────────────────────────────────────────────────────────────
// Transfer
// ──────────────────────────────────────────────────────────────────────────

const doTransfer = async (
  opts: WorkerOpts,
  source: string,
  testMode: TestMode,
) => {
  const note = pickNoteForSpend(opts, testMode);
  if (!note) return; // nothing to spend right now

  const ok = await opts.tree.waitForLeaf(note.epoch, note.leafIndex, 30_000);
  if (!ok) {
    warn(source, "transfer: gave up waiting for leaf in tree", {
      epoch: note.epoch.toString(),
      leafIndex: note.leafIndex.toString(),
    });
    return;
  }
  const path = await opts.tree.getPath(note.epoch, note.leafIndex);

  const newSecret = randomFieldSecret();
  const startedAt = Date.now();
  const result = await generateTransferProof(note, newSecret, path);
  const proofMs = Date.now() - startedAt;

  const submitProof =
    testMode === "invalid_proof" ? corruptProof(result.proof) : result.proof;

  const jobId = `t-${opts.id}-${Date.now()}`;
  const expect: ExpectedRejectReason | undefined =
    testMode === "invalid_proof"
      ? "invalid_proof"
      : testMode === "double_spend"
        ? "double_spend"
        : undefined;

  try {
    const receipt = await opts.relayers.enqueue(
      "transfer",
      jobId,
      submitProof,
      [],
      expect,
    );

    if (testMode !== "normal") {
      // expected revert — relayer already logged it. Don't add output
      // note (it was never inserted). Don't increment counter.
      return;
    }

    const totalMs = Date.now() - startedAt;
    const cb = new Contract(opts.cbAddress, opts.cbAbi);
    const ev = parseLeafInserted(cb, receipt);
    if (ev) {
      if (ev.leafValue !== result.outputNote.noteHash) {
        error(
          source,
          "invariant: transfer output leafValue != computed hash",
          {
            jobId,
            expected: result.outputNote.noteHash.toString(),
            got: ev.leafValue.toString(),
          },
        );
      }
      opts.notes.add({
        ...result.outputNote,
        epoch: ev.epoch,
        leafIndex: ev.leafIndex,
      });
      // The just-spent input note is now a candidate for double-spend tests.
      opts.spentNotes.push(note);
      emitRolloverIfPresent(cb, receipt, source, "transfer-output");
      opts.counter.inc();
      info(source, "transfer ok", {
        jobId,
        proof_ms: proofMs,
        total_ms: totalMs,
        new_epoch: ev.epoch.toString(),
        new_leafIndex: ev.leafIndex.toString(),
        notes_held: opts.notes.size(),
        spent_held: opts.spentNotes.size(),
        progress: opts.counter.value(),
      });
    } else {
      warn(source, "transfer: no LeafInserted in relayer receipt", { jobId });
    }
  } catch (e: any) {
    error(source, "transfer relay failed", {
      jobId,
      err: e?.message ?? String(e),
    });
  }
};

// ──────────────────────────────────────────────────────────────────────────
// Withdraw
// ──────────────────────────────────────────────────────────────────────────

const doWithdraw = async (
  opts: WorkerOpts,
  source: string,
  testMode: TestMode,
) => {
  const note = pickNoteForSpend(opts, testMode);
  if (!note) return;

  const ok = await opts.tree.waitForLeaf(note.epoch, note.leafIndex, 30_000);
  if (!ok) {
    warn(source, "withdraw: gave up waiting for leaf", {
      epoch: note.epoch.toString(),
      leafIndex: note.leafIndex.toString(),
    });
    return;
  }
  const path = await opts.tree.getPath(note.epoch, note.leafIndex);

  const exitAddrStr = randomAddress();
  const exitAddrBig = BigInt(exitAddrStr);
  const startedAt = Date.now();
  const result = await generateWithdrawProof(note, exitAddrBig, path);
  const proofMs = Date.now() - startedAt;

  const submitProof =
    testMode === "invalid_proof" ? corruptProof(result.proof) : result.proof;

  const jobId = `w-${opts.id}-${Date.now()}`;
  const expect: ExpectedRejectReason | undefined =
    testMode === "invalid_proof"
      ? "invalid_proof"
      : testMode === "double_spend"
        ? "double_spend"
        : undefined;

  try {
    await opts.relayers.enqueue("withdraw", jobId, submitProof, [], expect);

    if (testMode !== "normal") {
      return; // relayer logged the expected rejection
    }

    opts.spentNotes.push(note);
    opts.counter.inc();
    const totalMs = Date.now() - startedAt;
    info(source, "withdraw ok", {
      jobId,
      proof_ms: proofMs,
      total_ms: totalMs,
      exit: exitAddrStr,
      amount: note.amount.toString(),
      notes_held: opts.notes.size(),
      spent_held: opts.spentNotes.size(),
      progress: opts.counter.value(),
    });
  } catch (e: any) {
    error(source, "withdraw relay failed", {
      jobId,
      err: e?.message ?? String(e),
    });
  }
};

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

// For spends, choose either a fresh note (consumed) or a previously-spent
// note (cloned, for double-spend test). Fresh notes are POPPED; spent
// notes are PICKED RANDOMLY without removal (so the same one can be
// attempted multiple times across the run).
const pickNoteForSpend = (
  opts: WorkerOpts,
  testMode: TestMode,
): StoredNote | undefined => {
  if (testMode === "double_spend") {
    return opts.spentNotes.pickRandom();
  }
  return opts.notes.popOldest();
};

type ParsedLeaf = { epoch: bigint; leafIndex: bigint; leafValue: bigint };
const parseLeafInserted = (cb: Contract, receipt: any): ParsedLeaf | null => {
  if (!receipt) return null;
  const iface = cb.interface;
  for (const l of receipt?.logs ?? []) {
    try {
      const parsed = iface.parseLog(l);
      if (parsed && parsed.name === "LeafInserted") {
        return {
          epoch: parsed.args[0] as bigint,
          leafIndex: parsed.args[1] as bigint,
          leafValue: BigInt(parsed.args[2] as string),
        };
      }
    } catch {
      /* not a CommBankDotEth event */
    }
  }
  return null;
};

const emitRolloverIfPresent = (
  cb: Contract,
  receipt: any,
  source: string,
  hashOrTag: string,
) => {
  if (!receipt) return;
  const iface = cb.interface;
  for (const l of receipt?.logs ?? []) {
    try {
      const parsed = iface.parseLog(l);
      if (parsed && parsed.name === "EpochRolledOver") {
        info(source, "rollover observed", {
          oldEpoch: (parsed.args[0] as bigint).toString(),
          finalRoot: (parsed.args[1] as bigint).toString(),
          via: hashOrTag,
        });
      }
    } catch {
      /* not a CommBankDotEth event */
    }
  }
};

const checkPerWorkerMonotonicity = (
  opts: WorkerOpts,
  source: string,
  epoch: bigint,
  leafIndex: bigint,
  tx: string,
) => {
  const k = Number(epoch);
  const prev = opts.invariants.prevLeafIndexByEpoch.get(k);
  if (prev !== undefined && prev >= leafIndex) {
    error(source, "invariant: leafIndex regression", {
      tx,
      prev: prev.toString(),
      now: leafIndex.toString(),
      epoch: epoch.toString(),
    });
  }
  opts.invariants.prevLeafIndexByEpoch.set(k, leafIndex);
};

const assertRootKnown = async (
  opts: WorkerOpts,
  cb: Contract,
  source: string,
  tx: string,
) => {
  const root = (await cb.currentRoot()) as bigint;
  const known = (await cb.isKnownRoot(root)) as boolean;
  if (!known) {
    error(source, "invariant: currentRoot not in knownRoots", {
      tx,
      root: root.toString(),
    });
  }
  opts.invariants.lastRoot = root;
};

export const _unused = computeNullifier; // re-export to silence unused-import lints elsewhere
