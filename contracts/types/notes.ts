export interface InputNote {
  asset_id: string;
  asset_amount: string;
  owner: string;
  owner_secret: string;
  secret: string;
  leaf_index: string;
  path: string[];
  path_indices: string[];
}

export interface OutputNote {
  owner: string;
  secret: string;
  asset_id: string;
  asset_amount: string;
  external_address?: string;
}
