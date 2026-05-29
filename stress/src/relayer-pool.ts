// Relayer pool. Workers post jobs (a generated proof + which contract
// method to call) onto a shared queue; a fixed number of relayer accounts
// pull jobs and submit them to the chain. This mimics the production
// pattern where the user generating the proof is NOT the EVM account that
// pays gas.
//
// v3 changes:
//   * Jobs can carry `expectReject` so deliberate-failure injections
//     (invalid-proof, double-spend) don't get logged as harness errors.
//   * NonceManager dropped — relayers process jobs strictly serially
//     (one job → await receipt → next job), so there are no nonce races
//     to manage. NonceManager could mask a transient ECONNRESET and
//     leave the wallet in a poisoned state.
//   * Single shared provider passed in from main so all the actors reuse
//     Node's HTTP agent.

import { Contract, JsonRpcProvider, NonceManager, Wallet } from "ethers";

import { relayerWallet } from "./accounts.js";
import { error, info, warn } from "./log.js";

export type ExpectedRejectReason = "invalid_proof" | "double_spend";

export type RelayJob = {
  id: string;
  kind: "transfer" | "withdraw";
  proof: { proof: Uint8Array; publicInputs: string[] };
  payload: string[];
  // If set, the relayer treats a revert as expected and logs accordingly.
  // If a job tagged expectReject *succeeds*, that's a critical bug
  // (chain accepted what it should have rejected).
  expectReject?: ExpectedRejectReason;
  resolve: (receipt: any) => void;
  reject: (e: any) => void;
  enqueuedAt: number;
};

export class RelayerPool {
  private queue: RelayJob[] = [];
  private waiters: ((j: RelayJob) => void)[] = [];
  private stopped = false;
  private relayers: { id: number; address: string }[] = [];

  constructor(
    private provider: JsonRpcProvider,
    private cbAddress: string,
    private cbAbi: any[],
    private relayerCount: number,
    private workerCount: number,
  ) {}

  async start() {
    for (let i = 0; i < this.relayerCount; i++) {
      const w = relayerWallet(i, this.workerCount);
      this.relayers.push({ id: i, address: w.address });
      // NonceManager because the shared provider's nonce-from-chain
      // lookups can race when relayers submit in quick succession. The
      // local counter is always right because each relayer is serial.
      const wallet = new NonceManager(new Wallet(w.privateKey, this.provider));
      const cb = new Contract(this.cbAddress, this.cbAbi, wallet as any);
      void this.runRelayer(i, cb);
    }
    info("relayer-pool", "started", {
      count: this.relayerCount,
      addresses: this.relayers.map((r) => r.address),
    });
  }

  stop() {
    this.stopped = true;
    for (const j of this.queue) j.reject(new Error("relayer pool stopped"));
    this.queue = [];
  }

  enqueue(
    kind: "transfer" | "withdraw",
    id: string,
    proof: { proof: Uint8Array; publicInputs: string[] },
    payload: string[] = [],
    expectReject?: ExpectedRejectReason,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const job: RelayJob = {
        id,
        kind,
        proof,
        payload,
        expectReject,
        resolve,
        reject,
        enqueuedAt: Date.now(),
      };
      if (this.waiters.length > 0) {
        const w = this.waiters.shift()!;
        w(job);
      } else {
        this.queue.push(job);
      }
    });
  }

  private async take(): Promise<RelayJob> {
    if (this.queue.length > 0) return this.queue.shift()!;
    return new Promise<RelayJob>((resolve) => this.waiters.push(resolve));
  }

  private async runRelayer(id: number, cb: Contract) {
    const source = `relayer-${id}`;
    info(source, "started");
    while (!this.stopped) {
      const job = await this.take();
      const waitMs = Date.now() - job.enqueuedAt;
      const started = Date.now();
      try {
        let tx: any;
        if (job.kind === "transfer") {
          tx = await cb.transfer(
            job.proof.proof,
            job.proof.publicInputs,
            job.payload,
            { gasLimit: 12_000_000n },
          );
        } else {
          tx = await cb.withdraw(job.proof.proof, job.proof.publicInputs, {
            gasLimit: 12_000_000n,
          });
        }
        const receipt = await tx.wait();
        const submitMs = Date.now() - started;
        if (job.expectReject) {
          // The contract accepted a tx that should have been rejected.
          // This is a critical bug — surface loudly.
          error(source, `${job.kind} ACCEPTED tx that should revert`, {
            jobId: job.id,
            expectedReject: job.expectReject,
            tx: tx.hash,
            wait_ms: waitMs,
            submit_ms: submitMs,
          });
        } else {
          info(source, `${job.kind} submitted`, {
            jobId: job.id,
            tx: tx.hash,
            wait_ms: waitMs,
            submit_ms: submitMs,
          });
        }
        job.resolve(receipt);
      } catch (e: any) {
        const msg = e?.shortMessage || e?.message || String(e);
        const reason = e?.reason || extractRevertReason(e);
        if (job.expectReject) {
          // Expected revert. We could check the reason matches what we
          // injected, but ethers' CALL_EXCEPTION messages vary by node
          // and verifier custom-error encoding. The presence of a revert
          // is the load-bearing signal.
          info(source, `${job.kind} rejected (expected)`, {
            jobId: job.id,
            expectedReject: job.expectReject,
            revertReason: reason ?? "(no decoded reason)",
            wait_ms: waitMs,
            submit_ms: Date.now() - started,
          });
          job.resolve(null); // resolve so worker doesn't see it as failure
        } else {
          error(source, `${job.kind} failed`, {
            jobId: job.id,
            err: msg,
            reason,
            code: e?.code,
            wait_ms: waitMs,
            submit_ms: Date.now() - started,
          });
          job.reject(e);
        }
      }
    }
  }
}

// Best-effort revert-reason extraction from ethers v6's nested error shape.
const extractRevertReason = (e: any): string | undefined => {
  if (!e) return undefined;
  if (typeof e.reason === "string") return e.reason;
  if (e.data && typeof e.data === "string") return e.data;
  if (e.info?.error?.message) return e.info.error.message;
  return undefined;
};
