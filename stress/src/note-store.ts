// Per-worker store of spendable notes. A note appears here when the worker
// successfully deposits or receives the output of a self-transfer; it gets
// removed when the worker spends it via transfer or withdraw.

export type StoredNote = {
  epoch: bigint;
  leafIndex: bigint;
  noteHash: bigint;
  secret: bigint;
  owner: bigint;
  ownerSecret: bigint;
  assetId: bigint;
  amount: bigint;
};

export class NoteStore {
  private notes: StoredNote[] = [];

  add(n: StoredNote) {
    this.notes.push(n);
  }

  // Take and remove the oldest spendable note (FIFO). Returns undefined if
  // none available.
  popOldest(): StoredNote | undefined {
    return this.notes.shift();
  }

  size(): number {
    return this.notes.length;
  }
}
