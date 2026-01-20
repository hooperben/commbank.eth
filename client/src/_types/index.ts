export interface Note {
  id: string;
  assetId: string;
  assetAmount: string;
  nullifier: string;
  secret: string;
  entity_id: string;
  isUsed: boolean;
  note_payload_id?: string;
}

export interface TreeLeaf {
  id: string;
  leafValue: string;
  leafIndex: string;
}

export interface Payload {
  id: string;
  encryptedNote: string;
  decryptAttempted: boolean;
}

export interface Meta {
  id: string;
  encryptedMnemonic?: string;
  last_id: number;
}

// Indexer types
export interface IndexerNotePayload {
  id: string;
  encryptedNote: string;
}

export interface IndexerLeafInserted {
  id: string;
  leafIndex: string;
  leafValue: string;
}

// Share profile types
export interface ShareProfileParams {
  address?: string;
  privateAddress?: string;
  envelope?: string;
  nickname?: string;
}

export interface ContactInfo {
  address?: string;
  privateAddress?: string;
  envelope?: string;
  nickname: string;
}

// Contact management types
export interface Contact {
  id: string; // Auto-generated UUID
  nickname?: string;
  evmAddress?: string; // EVM address
  privateAddress?: string;
  envelopeAddress?: string;
  createdAt: number;
}

// Restore account types
export interface BackupFileEncrypted {
  encryptedMnemonic: string;
}

export interface BackupFilePlain {
  mnemonic: string;
}

export type BackupFile = BackupFileEncrypted | BackupFilePlain;

export interface DerivedAddresses {
  address: string;
  privateAddress: string;
  envelope: string;
}

// System status types
export type StatusType = "success" | "warning" | "error" | "loading";

export interface SystemStatus {
  type: StatusType;
  message: string;
  info?: string;
  link?: string;
}

// Transaction types
export type TransactionType =
  | "Approval"
  | "Deposit"
  | "Deposit-Pending"
  | "Transfer"
  | "PrivateTransfer"
  | "Withdraw";

export type TransactionStatus =
  | "pending" // Submitted to network, awaiting confirmation
  | "confirmed" // Confirmed on-chain
  | "failed" // Failed or timed out
  | "replaced"; // Replaced by another transaction (speed-up/cancel)

export interface TransactionAssetDetails {
  address: string; // Asset contract address
  symbol: string; // e.g., "USDC", "ETH"
  decimals: number; // e.g., 6 for USDC
  amount: string; // Raw amount as string (BigInt)
  formattedAmount: string; // Human-readable amount (e.g., "100.00")
}

export interface TransactionParticipant {
  evmAddress?: string; // EVM address if known
  privateAddress?: string; // Poseidon address if private
  nickname?: string; // Contact nickname if known
  isSelf: boolean; // Is this the current user
}

export interface TransactionNoteInfo {
  commitment: string; // Note commitment/hash
  isInput: boolean; // Input (spent) or output (created)
  isChange: boolean; // Is this a change note back to sender
}

export interface Transaction {
  // Identifiers
  id: string; // UUID (generated before submission)
  chainId: number;
  transactionHash?: string; // May be undefined while building proof

  // Type and Status
  type: TransactionType;
  status: TransactionStatus;

  // Timing
  createdAt: number; // When transaction was initiated
  submittedAt?: number; // When submitted to network
  confirmedAt?: number; // When confirmed

  // Basic transaction data
  to: string; // Contract address
  data?: string; // Calldata (optional, for debugging)
  gasPrice?: string; // Gas price used
  gasUsed?: string; // Gas used (after confirmation)

  // Enhanced details
  asset?: TransactionAssetDetails;
  sender?: TransactionParticipant;
  recipient?: TransactionParticipant;

  // Note tracking (for double-spend prevention)
  inputNotes: TransactionNoteInfo[]; // Notes being spent
  outputNotes: TransactionNoteInfo[]; // Notes being created

  // Error tracking
  errorMessage?: string; // If failed, why

  // Legacy (for backwards compatibility)
  value?: string;
  timestamp: number; // Alias for createdAt
}
