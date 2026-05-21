// Shared per-epoch merkle tree. One process-wide instance owns the tree
// state and is updated by a polling listener that follows the chain's
// LeafInserted + EpochRolledOver events. Workers query it for paths when
// they need to generate transfer/withdraw proofs.
//
// In production this responsibility lives in the indexer (ADR 0001). The
// stress harness re-implements it in-process so tests don't depend on a
// running indexer.

import { Contract, JsonRpcProvider } from "ethers";

import { PoseidonMerkleTree } from "../../contracts/helpers/poseidon-merkle-tree.js";
import { TREE_HEIGHT } from "../../contracts/helpers/tree-config.js";
import { info, warn } from "./log.js";

export type LeafEvent = {
  epoch: bigint;
  leafIndex: bigint;
  leafValue: bigint;
  blockNumber: number;
};

export class TreeState {
  private trees = new Map<number, PoseidonMerkleTree>();
  // Highest block we have already scanned for events.
  private lastBlock = 0;
  // Set of (epoch, leafIndex) we have inserted, for fast hasLeaf() checks.
  private knownLeaves = new Set<string>();
  // Final roots captured at each EpochRolledOver — used by workers spending
  // notes from frozen epochs.
  private finalRoots = new Map<number, bigint>();
  // Current active epoch as last observed on chain.
  private activeEpoch = 0;
  private polling = false;
  private stopped = false;

  constructor(
    private provider: JsonRpcProvider,
    private cb: Contract,
    private pollMs = 500,
  ) {}

  private async ensureTree(epoch: number): Promise<PoseidonMerkleTree> {
    let t = this.trees.get(epoch);
    if (!t) {
      t = new PoseidonMerkleTree(TREE_HEIGHT);
      // initializeDefaultNodes() runs synchronously inside ctor but uses
      // poseidon2Hash which is async-ish; give it a tick.
      await new Promise((r) => setTimeout(r, 5));
      this.trees.set(epoch, t);
    }
    return t;
  }

  async start() {
    // Seed lastBlock from the chain so we don't replay history every restart.
    // For the stress run we always start fresh, so 0 is fine.
    this.lastBlock = 0;
    this.poll();
    info("tree", "started", { pollMs: this.pollMs });
  }

  stop() {
    this.stopped = true;
  }

  private async poll() {
    if (this.polling) return;
    this.polling = true;
    while (!this.stopped) {
      try {
        await this.scanOnce();
      } catch (e: any) {
        warn("tree", "scan error", { err: e?.message ?? String(e) });
      }
      await new Promise((r) => setTimeout(r, this.pollMs));
    }
    this.polling = false;
  }

  private async scanOnce() {
    const head = await this.provider.getBlockNumber();
    if (head <= this.lastBlock) return;
    const from = this.lastBlock + 1;
    const to = head;

    const leafFilter = this.cb.filters.LeafInserted();
    const rolloverFilter = this.cb.filters.EpochRolledOver();
    const [leafLogs, rolloverLogs] = await Promise.all([
      this.cb.queryFilter(leafFilter, from, to),
      this.cb.queryFilter(rolloverFilter, from, to),
    ]);

    // Process logs in (blockNumber, logIndex) order so multiple events in
    // one block apply in the right sequence — the indexer's invariant too.
    type Tagged = { ev: any; kind: "leaf" | "rollover" };
    const all: Tagged[] = [
      ...leafLogs.map((ev: any) => ({ ev, kind: "leaf" as const })),
      ...rolloverLogs.map((ev: any) => ({ ev, kind: "rollover" as const })),
    ];
    all.sort((a, b) => {
      if (a.ev.blockNumber !== b.ev.blockNumber)
        return a.ev.blockNumber - b.ev.blockNumber;
      return a.ev.index - b.ev.index;
    });

    for (const { ev, kind } of all) {
      if (kind === "leaf") {
        const epoch = ev.args[0] as bigint;
        const leafIndex = ev.args[1] as bigint;
        const leafValue = BigInt(ev.args[2] as string);
        const tree = await this.ensureTree(Number(epoch));
        await tree.insert(leafValue, Number(leafIndex));
        this.knownLeaves.add(`${epoch}-${leafIndex}`);
        if (Number(epoch) > this.activeEpoch) this.activeEpoch = Number(epoch);
      } else {
        const oldEpoch = Number(ev.args[0] as bigint);
        const finalRoot = BigInt(ev.args[1] as string);
        this.finalRoots.set(oldEpoch, finalRoot);
        info("tree", "rollover sealed", {
          epoch: oldEpoch,
          finalRoot: finalRoot.toString(),
        });
      }
    }

    this.lastBlock = head;
  }

  hasLeaf(epoch: bigint | number, leafIndex: bigint | number): boolean {
    return this.knownLeaves.has(`${epoch}-${leafIndex}`);
  }

  isEpochActive(epoch: bigint | number): boolean {
    return Number(epoch) >= this.activeEpoch;
  }

  finalRoot(epoch: bigint | number): bigint | undefined {
    return this.finalRoots.get(Number(epoch));
  }

  // Active-epoch notes prove against the latest currentRoot from chain;
  // frozen-epoch notes prove against the captured final root.
  //
  // IMPORTANT: path and root must come from the SAME tree snapshot.
  // PoseidonMerkleTree.getProof and getRoot are `async` (yield at the
  // microtask boundary), and the listener thread mutates the tree on each
  // poll tick. If we awaited both in sequence, an insert could land
  // between them and the returned root would no longer correspond to the
  // returned path, causing the Noir circuit's merkle-root assertion to
  // fail with "Cannot satisfy constraint".
  //
  // Mitigation: read both, then read the path *again* and assert it's
  // unchanged. Cheap because we're not awaiting anything that yields in
  // a tight loop, and the listener pollMs is 500. On mismatch, retry.
  async getPath(
    epoch: bigint | number,
    leafIndex: bigint | number,
  ): Promise<{ root: bigint; siblings: bigint[]; indices: number[] }> {
    const tree = this.trees.get(Number(epoch));
    if (!tree) throw new Error(`no tree for epoch ${epoch}`);

    for (let attempt = 0; attempt < 5; attempt++) {
      const proof1 = await tree.getProof(Number(leafIndex));
      const root = this.isEpochActive(epoch)
        ? await tree.getRoot()
        : this.finalRoot(epoch);
      if (root === undefined) {
        throw new Error(`epoch ${epoch} frozen but no final root yet`);
      }
      const proof2 = await tree.getProof(Number(leafIndex));
      const sameSiblings =
        proof1.siblings.length === proof2.siblings.length &&
        proof1.siblings.every((s, i) => s === proof2.siblings[i]);
      const sameIndices =
        proof1.indices.length === proof2.indices.length &&
        proof1.indices.every((s, i) => s === proof2.indices[i]);
      if (sameSiblings && sameIndices) {
        return { root, siblings: proof1.siblings, indices: proof1.indices };
      }
      // Tree was mutated mid-read; loop and try again.
    }
    throw new Error("getPath: tree mutated repeatedly; could not snapshot");
  }

  // Wait until the tree contains (epoch, leafIndex). Bounded by maxMs so
  // a worker doesn't hang if the listener has fallen behind.
  async waitForLeaf(
    epoch: bigint | number,
    leafIndex: bigint | number,
    maxMs = 30_000,
  ): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if (this.hasLeaf(epoch, leafIndex)) return true;
      await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  }
}
