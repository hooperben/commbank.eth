// Per-owner deposit proof generation. v3 dropped the pre-generated FIFO
// queue from v2 because:
//   * Workers now have distinct owners — a single shared pool can't serve
//     all of them.
//   * Deposits are 25% of the v3 mix, so the pre-gen optimisation matters
//     much less than when deposits were 100% of the workload.
//
// We keep a Deposit-class singleton so the Noir circuit and Aztec backend
// only get instantiated once per process.

import { poseidon2Hash } from "@zkpassport/poseidon2";
import { Deposit } from "shared/classes/Deposit";

import { info } from "./log.js";

const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// 1 wei per deposit so a worker with 10000 ETH funds millions of cycles.
export const STRESS_DEPOSIT_AMOUNT = 1n;
export const STRESS_ASSET_ID = BigInt(ETH_ADDRESS);

export type PreparedDeposit = {
  noteHash: bigint;
  proof: { proof: Uint8Array; publicInputs: string[] };
  amount: bigint;
  assetId: bigint;
  secret: bigint;
  owner: bigint;
  ownerSecret: bigint;
};

// Per-worker monotonic counter, mixed with the owner so two workers with
// the same index can never collide (defence in depth — we don't actually
// double-up workers).
const baseSecret = (workerId: number, seq: number): bigint =>
  0xc0dec0dec0dec0den * 1_000_000n +
  BigInt(workerId) * 1_000_000_000n +
  BigInt(seq);

let depositSingleton: Deposit | null = null;
let depositReady: Promise<Deposit> | null = null;

export const getDeposit = async (): Promise<Deposit> => {
  if (depositSingleton) return depositSingleton;
  if (!depositReady) {
    depositReady = (async () => {
      const d = new Deposit();
      await d.depositNoir.init();
      info("proof-pool", "deposit noir initialised");
      depositSingleton = d;
      return d;
    })();
  }
  return depositReady;
};

export const generateDepositProof = async (
  workerId: number,
  seq: number,
  owner: bigint,
  ownerSecret: bigint,
): Promise<PreparedDeposit> => {
  const deposit = await getDeposit();
  const secret = baseSecret(workerId, seq);
  const amount = STRESS_DEPOSIT_AMOUNT;
  const assetId = STRESS_ASSET_ID;

  const noteHash = BigInt(
    poseidon2Hash([assetId, amount, owner, secret]).toString(),
  );

  const { witness } = await deposit.depositNoir.execute({
    hash: noteHash.toString(),
    asset_id: assetId.toString(),
    asset_amount: amount.toString(),
    owner: owner.toString(),
    secret: secret.toString(),
  });

  const proof = await deposit.depositBackend.generateProof(witness, {
    keccakZK: true,
  });

  return {
    noteHash,
    proof,
    amount,
    assetId,
    secret,
    owner,
    ownerSecret,
  };
};
