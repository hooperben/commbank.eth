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
