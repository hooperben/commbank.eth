// A single worker. Each iteration the worker picks ONE of three actions:
//
//   deposit   — direct submission, worker pays gas (requires DEPOSIT_ROLE)
//   transfer  — generate proof for self-transfer, post to relayer pool
//   withdraw  — generate proof for withdraw, post to relayer pool
//
// The mix is dynamic: if the worker has no spendable notes, it can only
// deposit. Once it has notes, it rotates probabilistically.
//
// Invariants checked per insert:
//   * LeafInserted leafValue == the noteHash we proved against
//   * currentRoot() after the tx is in knownRoots
//   * per-worker (epoch, leafIndex) is strictly increasing for THIS worker's
//     own deposits — note that for transfer outputs the relayer submits, so
//     the leafIndex assignment is not under this worker's control.

import {
  Contract,
  JsonRpcProvider,
  NonceManager,
  Wallet,
  keccak256,
} from "ethers";

import { NoteStore } from "./note-store.js";
import type { ProofPool } from "./proof-pool.js";
import {
  computeNoteHash,
  generateTransferProof,
  generateWithdrawProof,
} from "./proof-spend.js";
import type { RelayerPool } from "./relayer-pool.js";
import type { TreeState } from "./tree-state.js";
import { error, info, warn } from "./log.js";

export type WorkerOpts = {
  id: number;
  rpcUrl: string;
  privateKey: string;
  cbAddress: string;
  cbAbi: any[];
  depositPool: ProofPool;
  relayers: RelayerPool;
  tree: TreeState;
  notes: NoteStore;
  invariants: Invariants;
  // Per-worker owner identity. owner = poseidon2(ownerSecret).
  owner: bigint;
  ownerSecret: bigint;
  // Probabilities. transfer + withdraw must be <= 1; remainder is deposit.
  pTransfer: number;
  pWithdraw: number;
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

// Random 256-bit field element < BN254 prime, for fresh transfer-output secrets.
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

// Random throwaway address for withdrawals.
const randomAddress = (): string => {
  const bytes = new Uint8Array(20);
  for (let i = 0; i < 20; i++) bytes[i] = Math.floor(Math.random() * 256);
  let s = "0x";
  for (const b of bytes) s += b.toString(16).padStart(2, "0");
  return s;
};

export const runWorker = async (opts: WorkerOpts) => {
  const provider = new JsonRpcProvider(opts.rpcUrl);
  const wallet = new NonceManager(new Wallet(opts.privateKey, provider));
  const cb = new Contract(opts.cbAddress, opts.cbAbi, wallet as any);
  const source = `worker-${opts.id}`;
  const addr = await wallet.getAddress();
  info(source, "started", { address: addr });

  while (true) {
    const action = pickAction(
      opts.notes.size(),
      opts.pTransfer,
      opts.pWithdraw,
    );

    try {
      if (action === "deposit") {
        await doDeposit(opts, cb, source);
      } else if (action === "transfer") {
        await doTransfer(opts, source);
      } else {
        await doWithdraw(opts, source);
      }
    } catch (e: any) {
      error(source, `${action} loop iteration failed`, {
        err: e?.message ?? String(e),
      });
    }
  }
};

const doDeposit = async (opts: WorkerOpts, cb: Contract, source: string) => {
  const prepared = await opts.depositPool.take(opts.owner, opts.ownerSecret);
  const startedAt = Date.now();
  const tx = await cb.depositNative(
    prepared.proof.proof,
    prepared.proof.publicInputs,
    [],
    { value: prepared.amount, gasLimit: 10_000_000n },
  );
  const receipt = await tx.wait();
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

  // Persist note for later spending
  opts.notes.add({
    epoch: ev.epoch,
    leafIndex: ev.leafIndex,
    noteHash: prepared.noteHash,
    secret: prepared.secret,
    owner: opts.owner,
    ownerSecret: opts.ownerSecret,
    assetId: prepared.assetId,
    amount: prepared.amount,
  });

  // Log rollover if observed.
  emitRolloverIfPresent(cb, receipt, source, tx.hash);

  info(source, "deposit ok", {
    epoch: ev.epoch.toString(),
    leafIndex: ev.leafIndex.toString(),
    latency_ms: elapsed,
    tx: tx.hash,
    notes_held: opts.notes.size(),
  });
};

const doTransfer = async (opts: WorkerOpts, source: string) => {
  const note = opts.notes.popOldest();
  if (!note) return;

  // Wait for our note's leaf to appear in the local tree before requesting a path.
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

  const jobId = `t-${opts.id}-${Date.now()}`;
  try {
    const receipt = await opts.relayers.enqueue(
      "transfer",
      jobId,
      result.proof,
      [],
    );
    const totalMs = Date.now() - startedAt;
    // Pull leaf event so we know where the new output note landed.
    const cb = new Contract(opts.cbAddress, opts.cbAbi);
    const ev = parseLeafInserted(cb, receipt);
    if (ev) {
      if (ev.leafValue !== result.outputNote.noteHash) {
        error(source, "invariant: transfer output leafValue != computed hash", {
          jobId,
          expected: result.outputNote.noteHash.toString(),
          got: ev.leafValue.toString(),
        });
      }
      // Re-add the new note (now with a real epoch + leafIndex) so it can be re-spent.
      opts.notes.add({
        ...result.outputNote,
        epoch: ev.epoch,
        leafIndex: ev.leafIndex,
      });
      emitRolloverIfPresent(cb, receipt, source, "transfer-output");
      info(source, "transfer ok", {
        jobId,
        proof_ms: proofMs,
        total_ms: totalMs,
        new_epoch: ev.epoch.toString(),
        new_leafIndex: ev.leafIndex.toString(),
        notes_held: opts.notes.size(),
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

const doWithdraw = async (opts: WorkerOpts, source: string) => {
  const note = opts.notes.popOldest();
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

  const jobId = `w-${opts.id}-${Date.now()}`;
  try {
    await opts.relayers.enqueue("withdraw", jobId, result.proof);
    const totalMs = Date.now() - startedAt;
    info(source, "withdraw ok", {
      jobId,
      proof_ms: proofMs,
      total_ms: totalMs,
      exit: exitAddrStr,
      amount: note.amount.toString(),
      notes_held: opts.notes.size(),
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

type ParsedLeaf = { epoch: bigint; leafIndex: bigint; leafValue: bigint };
const parseLeafInserted = (cb: Contract, receipt: any): ParsedLeaf | null => {
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

// Unused — kept here because the worker file historically exported it.
export const _suppressUnused = { keccak256, computeNoteHash };
