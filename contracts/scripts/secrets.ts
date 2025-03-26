export const aliceSecret = new Uint8Array(
  JSON.parse(process.env.ALICE_DEPOSIT_SECRET!),
);

// TRANSACT_CONSTANTS
export const aliceOutput1NoteSecret = new Uint8Array(
  JSON.parse(process.env.ALICE_OUTPUT_NOTE_SECRET_1!),
);

export const aliceOutput2NoteSecret = new Uint8Array(
  JSON.parse(process.env.ALICE_OUTPUT_NOTE_SECRET_2!),
);
