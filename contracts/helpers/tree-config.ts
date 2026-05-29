// Single source of truth for the merkle tree height in the TypeScript SDK.
// Must match TREE_HEIGHT in contracts/contracts/PoseidonMerkleTree.sol and
// HEIGHT in circuits/pum_lib/src/lib.nr.
export const TREE_HEIGHT = 12;

export const MAX_LEAF_INDEX = 2 ** (TREE_HEIGHT - 1);
