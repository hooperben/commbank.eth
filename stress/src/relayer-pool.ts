// Relayer pool. Workers post jobs (a generated proof + which contract
// method to call) onto a shared queue; a fixed number of relayer accounts
// pull jobs and submit them to the chain. This mimics the production
// pattern where the user generating the proof is NOT the EVM account that
// pays gas.
//
// Each relayer is a single Promise loop pulling from the queue. Jobs
// outlive their submitter — a worker can deposit and immediately enqueue
// a transfer without waiting on the relayer that ends up handling it.

import { Contract, JsonRpcProvider, NonceManager, Wallet } from "ethers";

import { relayerWallet } from "./accounts.js";
import { error, info } from "./log.js";

export type RelayJob = {
  id: string;                       // Worker-assigned id for log correlation.
  kind: "transfer" | "withdraw";
  proof: { proof: Uint8Array; publicInputs: string[] };
  payload: string[];                // encrypted-note payload[], usually []
  // Resolved when the tx is mined (or rejected on failure). The receipt's
  // logs let the worker harvest leafIndex for any new output note (transfer).
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
      // Each relayer gets its own NonceManager so consecutive submissions
      // from the same relayer don't race on nonce assignment.
      const managed = new NonceManager(new Wallet(w.privateKey, this.provider));
      const cb = new Contract(this.cbAddress, this.cbAbi, managed as any);
      void this.runRelayer(i, cb);
    }
    info("relayer-pool", "started", {
      count: this.relayerCount,
      addresses: this.relayers.map((r) => r.address),
    });
  }

  stop() {
    this.stopped = true;
    // Reject any waiting jobs so promises don't dangle.
    for (const j of this.queue) j.reject(new Error("relayer pool stopped"));
    this.queue = [];
  }

  enqueue(
    kind: "transfer" | "withdraw",
    id: string,
    proof: { proof: Uint8Array; publicInputs: string[] },
    payload: string[] = [],
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const job: RelayJob = {
        id,
        kind,
        proof,
        payload,
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
        info(source, `${job.kind} submitted`, {
          jobId: job.id,
          tx: tx.hash,
          wait_ms: waitMs,
          submit_ms: submitMs,
        });
        job.resolve(receipt);
      } catch (e: any) {
        const msg = e?.shortMessage || e?.message || String(e);
        error(source, `${job.kind} failed`, {
          jobId: job.id,
          err: msg,
          reason: e?.reason,
          code: e?.code,
          wait_ms: waitMs,
          submit_ms: Date.now() - started,
        });
        job.reject(e);
      }
    }
  }

  addresses() {
    return this.relayers.map((r) => r.address);
  }
}
