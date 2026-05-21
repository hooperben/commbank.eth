// Stress harness entry point.
//
// Topology:
//   * One JsonRpcProvider talks to hardhat-node
//   * TreeState owns the per-epoch merkle trees, polls events
//   * RelayerPool exposes a job queue for transfer/withdraw txs
//   * N workers (default 10) loop forever, mixing deposit/transfer/withdraw
//   * Each worker has its own NoteStore + Invariants
//
// SIGINT/SIGTERM stops the listeners and exits.

import { Contract, JsonRpcProvider } from "ethers";
import { readFile } from "node:fs/promises";

import { relayerCount, workerCount, workerWallet } from "./accounts.js";
import { artifacts } from "./artifacts.js";
import { info, error } from "./log.js";
import { NoteStore } from "./note-store.js";
import {
  ProofPool,
  SHARED_OWNER,
  SHARED_OWNER_SECRET,
} from "./proof-pool.js";
import { RelayerPool } from "./relayer-pool.js";
import { TreeState } from "./tree-state.js";
import { makeInvariants, runWorker } from "./worker.js";

const DEPLOYMENT_PATH = process.env.DEPLOYMENT_PATH || "/shared/deployment.json";
const POOL_SIZE = Number(process.env.POOL_SIZE ?? 64);
const P_TRANSFER = Number(process.env.P_TRANSFER ?? 0.3);
const P_WITHDRAW = Number(process.env.P_WITHDRAW ?? 0.1);

// Hardhat node occasionally drops a socket mid-RPC under sustained load
// (ECONNRESET surfaced from TCP.onStreamRead with no userland frames).
// Without this guard, a single dropped socket kills the whole harness.
// We just log and keep running — the worker that lost the call will surface
// the failure via its own try/catch on the next iteration.
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

type Manifest = {
  rpcUrl: string;
  chainId: number;
  commbankDotEth: string;
  workers: { index: number; address: string }[];
};

const main = async () => {
  const manifestRaw = await readFile(DEPLOYMENT_PATH, "utf8");
  const manifest = JSON.parse(manifestRaw) as Manifest;
  info("main", "loaded manifest", {
    path: DEPLOYMENT_PATH,
    cb: manifest.commbankDotEth,
    workers: manifest.workers.length,
  });

  const rpcUrl = process.env.RPC_URL || manifest.rpcUrl;
  const provider = new JsonRpcProvider(rpcUrl);
  const { abi: cbAbi } = await artifacts.commbankDotEth();
  const cb = new Contract(manifest.commbankDotEth, cbAbi, provider);

  // Tree listener — must be started before workers begin spending, so the
  // first transfer/withdraw has trees populated.
  const tree = new TreeState(provider, cb);
  await tree.start();

  // Relayer pool.
  const N = Math.min(workerCount(), manifest.workers.length);
  const R = relayerCount();
  const relayers = new RelayerPool(
    provider,
    manifest.commbankDotEth,
    cbAbi,
    R,
    N,
  );
  await relayers.start();

  // Deposit proof pool.
  const pool = new ProofPool(POOL_SIZE);
  await pool.init();

  info("main", "spawning workers", {
    workers: N,
    relayers: R,
    pTransfer: P_TRANSFER,
    pWithdraw: P_WITHDRAW,
  });

  const stops: Promise<void>[] = [];
  for (let i = 0; i < N; i++) {
    const w = workerWallet(i);
    stops.push(
      runWorker({
        id: i,
        rpcUrl,
        privateKey: w.privateKey,
        cbAddress: manifest.commbankDotEth,
        cbAbi,
        depositPool: pool,
        relayers,
        tree,
        notes: new NoteStore(),
        invariants: makeInvariants(),
        owner: SHARED_OWNER,
        ownerSecret: SHARED_OWNER_SECRET,
        pTransfer: P_TRANSFER,
        pWithdraw: P_WITHDRAW,
      }),
    );
  }

  const shutdown = (signal: string) => {
    info("main", "shutdown signal", { signal });
    pool.stop();
    tree.stop();
    relayers.stop();
    setTimeout(() => process.exit(0), 2000);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  await Promise.all(stops);
};

main().catch((e) => {
  error("main", "fatal", { err: e?.message ?? String(e), stack: e?.stack });
  process.exit(1);
});
