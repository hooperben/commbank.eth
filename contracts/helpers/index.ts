export const getRandomWithField = () =>
  BigInt(Math.ceil(Math.random() * 10 ** 96)) %
  BigInt("0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001");

export interface DepositNote {
  assetId: string | bigint;
  assetAmount: string | bigint;
  secret: string | bigint;
  owner: string | bigint;
}

export interface InputNote {
  asset_id: bigint | string;
  asset_amount: bigint | string;
  owner: bigint | string;
  owner_secret: bigint | string;
  secret: bigint | string;
  leaf_index: bigint | string;
  path: bigint[] | string[];
  path_indices: bigint[] | string[];
}

export interface OutputNote {
  owner: string;
  secret: string;
  asset_id: string;
  asset_amount: string;
}
