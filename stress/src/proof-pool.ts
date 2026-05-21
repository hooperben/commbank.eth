// Pre-generates a pool of valid depositNative proofs and hands them out one
// at a time. Each proof has a unique secret (sequence number), so commitments
// never collide. depositNative is used (not deposit-with-ERC20) so we don't
// have to mint/approve USDC across all workers.
//
// Proof generation is the expensive bit (~0.5-2s per proof). We do it ahead
// of time so workers can submit txs at network-limited throughput rather
// than proof-limited throughput.

import { poseidon2Hash } from "@zkpassport/poseidon2";
import { Deposit } from "shared/classes/Deposit";

import { info } from "./log.js";

const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// Same owner across all stress proofs. Anonymity doesn't matter for a stress
// harness; cheap to compute.
const OWNER_SECRET =
  10036677144260647934022413515521823129584317400947571241312859176539726523915n;
const OWNER = BigInt(poseidon2Hash([OWNER_SECRET]).toString());

// 1 wei per deposit so a worker with 10000 ETH can run millions of cycles.
export const STRESS_DEPOSIT_AMOUNT = 1n;

export type PreparedDeposit = {
  noteHash: bigint;
  proof: { proof: Uint8Array; publicInputs: string[] };
  amount: bigint;
  assetId: bigint;
  secret: bigint;
  owner: bigint;
  ownerSecret: bigint;
};

// All deposits use the same owner identity. Workers thus share a notional
// "shared user" — fine for stress testing because each note's secret is
// still unique and the contract treats them independently.
export const SHARED_OWNER_SECRET = OWNER_SECRET;
export const SHARED_OWNER = OWNER;
export const STRESS_ASSET_ID = BigInt(ETH_ADDRESS);

const baseSecret = (index: number): bigint =>
  // Arbitrary base + sequence number, ensuring secret is small enough to live
  // in BN254. The first byte is set so we don't accidentally match an
  // existing deposit secret if one ever exists on chain.
  0xc0dec0dec0dec0den * 1_000_000n + BigInt(index);

export const generateOneProof = async (
  deposit: Deposit,
  index: number,
): Promise<PreparedDeposit> => {
  const secret = baseSecret(index);
  const assetIdBig = BigInt(ETH_ADDRESS);
  const amount = STRESS_DEPOSIT_AMOUNT;

  const noteHash = BigInt(
    poseidon2Hash([assetIdBig, amount, OWNER, secret]).toString(),
  );

  const { witness } = await deposit.depositNoir.execute({
    hash: noteHash.toString(),
    asset_id: assetIdBig.toString(),
    asset_amount: amount.toString(),
    owner: OWNER.toString(),
    secret: secret.toString(),
  });

  const proof = await deposit.depositBackend.generateProof(witness, {
    keccakZK: true,
  });

  return {
    noteHash,
    proof,
    amount,
    assetId: assetIdBig,
    secret,
    owner: OWNER,
    ownerSecret: OWNER_SECRET,
  };
};

// Sequentially fills a queue. Returns an AsyncIterator-style `take` that
// workers can call. We keep the queue size bounded so RAM doesn't blow up.
export class ProofPool {
  private queue: PreparedDeposit[] = [];
  private nextIndex = 0;
  private targetSize: number;
  private deposit = new Deposit();
  private filling = false;
  private done = false;
  private waiters: ((p: PreparedDeposit) => void)[] = [];

  constructor(targetSize = 64) {
    this.targetSize = targetSize;
  }

  async init() {
    await this.deposit.depositNoir.init();
    info("proof-pool", "noir initialised");
    // Kick off background filling
    this.fill();
  }

  private async fill() {
    if (this.filling) return;
    this.filling = true;
    try {
      while (!this.done) {
        if (this.queue.length >= this.targetSize) {
          await new Promise((r) => setTimeout(r, 50));
          continue;
        }
        const idx = this.nextIndex++;
        const p = await generateOneProof(this.deposit, idx);
        if (this.waiters.length > 0) {
          const w = this.waiters.shift()!;
          w(p);
        } else {
          this.queue.push(p);
        }
        if (idx % 100 === 0) {
          info("proof-pool", "milestone", { generated: idx + 1 });
        }
      }
    } finally {
      this.filling = false;
    }
  }

  // The owner identity is fixed across the pool (see SHARED_OWNER above),
  // so the take signature is the same regardless of caller.
  async take(_owner?: bigint, _ownerSecret?: bigint): Promise<PreparedDeposit> {
    if (this.queue.length > 0) {
      return this.queue.shift()!;
    }
    return new Promise<PreparedDeposit>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  stop() {
    this.done = true;
  }
}
