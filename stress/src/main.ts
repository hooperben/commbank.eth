// v3 stress harness entry point.
//
// Topology:
//   * one shared JsonRpcProvider (Node's HTTP agent now does keep-alive
//     for us across all callers — fixes the v2 ECONNRESET storm)
//   * TreeState polls events, maintains per-epoch trees
//   * RelayerPool: N relayers handle transfer/withdraw submissions
//   * N workers, each with its own assigned Owner identity, share a
//     global Counter; stop when counter reaches STOP_AT
//
// Workload mix:
//   P_TRANSFER, P_WITHDRAW set via env (default 0.50 / 0.25 → deposit = 25%)
//   P_INVALID_PROOF: rate of corrupted-proof injection (default 0.02 = 1-in-50)
//   P_DOUBLE_SPEND:  rate of replay-of-already-spent-note (default 0.02)

import { Contract, JsonRpcProvider } from "ethers";
import { readFile } from "node:fs/promises";

import { relayerCount, workerCount, workerWallet } from "./accounts.js";
import { artifacts } from "./artifacts.js";
import { Counter } from "./counter.js";
import { info, error } from "./log.js";
import { NoteStore } from "./note-store.js";
import { ownerCount, ownerPool } from "./owners.js";
import { RelayerPool } from "./relayer-pool.js";
import { SpentNoteStore } from "./spent-store.js";
import { TreeState } from "./tree-state.js";
import { makeInvariants, runWorker } from "./worker.js";

const DEPLOYMENT_PATH = process.env.DEPLOYMENT_PATH || "/shared/deployment.json";
const P_TRANSFER = Number(process.env.P_TRANSFER ?? 0.5);
const P_WITHDRAW = Number(process.env.P_WITHDRAW ?? 0.25);
const P_INVALID_PROOF = Number(process.env.P_INVALID_PROOF ?? 0.02);
const P_DOUBLE_SPEND = Number(process.env.P_DOUBLE_SPEND ?? 0.02);
const STOP_AT = Number(process.env.STOP_AT ?? 10_000);

type Manifest = {
  rpcUrl: string;
  chainId: number;
  commbankDotEth: string;
  workers: { index: number; address: string }[];
};

process.on("uncaughtException", (e: any) => {
  error("main", "uncaughtException", {
    err: e?.message ?? String(e),
    code: e?.code,
  });
});
process.on("unhandledRejection", (reason: any) => {
  error("main", "unhandledRejection", {
    err: reason?.message ?? String(reason),
    code: reason?.code,
  });
});

const main = async () => {
  const manifestRaw = await readFile(DEPLOYMENT_PATH, "utf8");
  const manifest = JSON.parse(manifestRaw) as Manifest;
  info("main", "loaded manifest", {
    path: DEPLOYMENT_PATH,
    cb: manifest.commbankDotEth,
    workers: manifest.workers.length,
  });

  const rpcUrl = process.env.RPC_URL || manifest.rpcUrl;
  // Single shared provider. Crucially, this means a single HTTP agent in
  // Node will pool TCP connections to the hardhat node across all callers,
  // instead of each actor opening its own short-lived sockets.
  const provider = new JsonRpcProvider(rpcUrl);
  const { abi: cbAbi } = await artifacts.commbankDotEth();
  const cb = new Contract(manifest.commbankDotEth, cbAbi, provider);

  const N = Math.min(workerCount(), manifest.workers.length);
  const R = relayerCount();
  const owners = ownerPool(Math.max(ownerCount(), N));
  info("main", "topology", {
    workers: N,
    relayers: R,
    owners: owners.length,
    stopAt: STOP_AT,
    pTransfer: P_TRANSFER,
    pWithdraw: P_WITHDRAW,
    pInvalidProof: P_INVALID_PROOF,
    pDoubleSpend: P_DOUBLE_SPEND,
  });

  const tree = new TreeState(provider, cb);
  await tree.start();

  const relayers = new RelayerPool(
    provider,
    manifest.commbankDotEth,
    cbAbi,
    R,
    N,
  );
  await relayers.start();

  const counter = new Counter();

  const stops: Promise<void>[] = [];
  for (let i = 0; i < N; i++) {
    const w = workerWallet(i);
    const owner = owners[i % owners.length];
    stops.push(
      runWorker({
        id: i,
        provider,
        privateKey: w.privateKey,
        cbAddress: manifest.commbankDotEth,
        cbAbi,
        relayers,
        tree,
        notes: new NoteStore(),
        spentNotes: new SpentNoteStore(),
        invariants: makeInvariants(),
        owner,
        pTransfer: P_TRANSFER,
        pWithdraw: P_WITHDRAW,
        pInvalidProof: P_INVALID_PROOF,
        pDoubleSpend: P_DOUBLE_SPEND,
        counter,
        stopAt: STOP_AT,
        depositSeq: { next: 0 },
      }),
    );
  }

  const shutdown = (signal: string) => {
    info("main", "shutdown signal", { signal, progress: counter.value() });
    tree.stop();
    relayers.stop();
    setTimeout(() => process.exit(0), 2000);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  await Promise.all(stops);

  // Natural completion: counter reached STOP_AT
  info("main", "all workers stopped", { progress: counter.value() });
  tree.stop();
  relayers.stop();
  setTimeout(() => process.exit(0), 1000);
};

main().catch((e) => {
  error("main", "fatal", { err: e?.message ?? String(e), stack: e?.stack });
  process.exit(1);
});
