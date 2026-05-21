// Pool of distinct owner identities used by workers. Each owner has its
// own ownerSecret (a field element) and owner = poseidon2(ownerSecret).
// In the protocol, owner is the "private address" — what a note is owned
// by — and ownerSecret is the key required to spend it.
//
// Deterministic so a run is reproducible: ownerSecret_i is derived from a
// base seed + index. Not safe for any real chain. The same TEST-ONLY
// warning that applies to the SHARED_OWNER in proof-pool.ts applies here.

import { poseidon2Hash } from "@zkpassport/poseidon2";

// Base seed; mixing it with the index gives a fresh secret per owner.
const OWNER_BASE_SEED =
  0x06_77_06_b3_45_4f_5e_8d_77_d4_b8_a3_61_92_f3_77n;

export type Owner = {
  index: number;
  ownerSecret: bigint;
  owner: bigint;
};

const buildOwner = (i: number): Owner => {
  const ownerSecret = BigInt(
    poseidon2Hash([OWNER_BASE_SEED, BigInt(i)]).toString(),
  );
  const owner = BigInt(poseidon2Hash([ownerSecret]).toString());
  return { index: i, ownerSecret, owner };
};

// Lazy singleton so the poseidon2 cost is only paid once.
let cached: Owner[] | null = null;

export const ownerPool = (count: number): Owner[] => {
  if (!cached || cached.length !== count) {
    cached = Array.from({ length: count }, (_, i) => buildOwner(i));
  }
  return cached;
};

export const ownerCount = (): number => Number(process.env.OWNER_COUNT ?? 10);
