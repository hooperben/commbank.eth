// Per-worker store of notes that have already been spent successfully.
// Used to feed deliberate double-spend attempts back into the workload.
// Each entry remembers ENOUGH state to re-build a fresh proof for the
// same note (which the contract should reject on nullifier check).

import type { StoredNote } from "./note-store.js";

export class SpentNoteStore {
  private notes: StoredNote[] = [];

  push(n: StoredNote) {
    this.notes.push(n);
  }

  pickRandom(): StoredNote | undefined {
    if (this.notes.length === 0) return undefined;
    return this.notes[Math.floor(Math.random() * this.notes.length)];
  }

  size(): number {
    return this.notes.length;
  }
}
