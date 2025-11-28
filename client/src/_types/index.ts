export interface Note {
  id: string;
  assetId: string;
  assetAmount: string;
  nullifier: string;
  secret: string;
  entity_id: string;
  isUsed: boolean;
}

export interface TreeLeaf {
  id: string;
  leafValue: string;
  leafIndex: string;
}

export interface Payload {
  id: string;
  encryptedNote: string;
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
