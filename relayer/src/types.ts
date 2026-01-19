// Types for the proof structure
export interface ProofData {
  proof: string;
  publicInputs: string[];
}

export interface TransactionRequest {
  proof: ProofData;
  payload: string[];
}

// Sponsor transaction request type
export interface SponsorRequest {
  type: "transfer" | "transferExternal";
  chainId: number;
  proof: string;
  publicInputs: string[];
  payload: string[];
}

// Transaction status types
export type TxStatus =
  | "queued"
  | "processing"
  | "submitted"
  | "confirmed"
  | "failed";

export interface QueuedTransaction {
  txId: string;
  status: TxStatus;
  request: SponsorRequest;
  createdAt: number;
  updatedAt: number;
  transactionHash?: string;
  errorMessage?: string;
  queuePosition?: number;
}
