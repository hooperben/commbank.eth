import { Fr } from "@aztec/foundation/fields";

export const createInputNote = (
  assetId: bigint | string,
  amount: bigint | string,
  owner: bigint | string,
  ownerSecret: bigint | string,
  secret: bigint | string,
  leafIndex: bigint | string,
  path: bigint[] | string[] | Fr[],
  pathIndices: bigint[] | number[],
) => {
  return {
    asset_id: assetId.toString(),
    asset_amount: amount.toString(),
    owner: owner.toString(),
    owner_secret: ownerSecret.toString(),
    secret: secret.toString(),
    leaf_index: leafIndex.toString(),
    path: path.map((item) => BigInt(item.toString()).toString()),
    path_indices: pathIndices.map((item) => item.toString()),
  };
};

export const emptyInputNote = createInputNote(
  0n,
  0n,
  0n,
  0n,
  0n,
  0n,
  [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n],
  [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n],
);

export const createOutputNote = (
  owner: bigint | string,
  secret: bigint | string,
  assetId: bigint | string,
  assetAmount: bigint | string,
) => {
  return {
    owner: owner.toString(),
    secret: secret.toString(),
    asset_id: assetId.toString(),
    asset_amount: assetAmount.toString(),
  };
};

export const emptyOutputNote = createOutputNote(0n, 0n, 0n, 0n);
