import { loadPoseidon } from "@/helpers/load-poseidon";
import { OutputNote } from "..";

// Function overloads
export async function getNoteHash(note: OutputNote): Promise<bigint>;

export async function getNoteHash(
  owner: bigint | string,
  secret: bigint | string,
  assetId: bigint | string,
  amount: bigint | string,
): Promise<bigint>;

// Implementation
export async function getNoteHash(
  ownerOrNote: bigint | string | OutputNote,
  secret?: bigint | string,
  assetId?: bigint | string,
  amount?: bigint | string,
): Promise<bigint> {
  const poseidonHash = await loadPoseidon();

  let owner: bigint | string;
  let noteSecret: bigint | string;
  let noteAssetId: bigint | string;
  let noteAmount: bigint | string;

  // Check if first argument is an OutputNote object
  if (
    typeof ownerOrNote === "object" &&
    ownerOrNote !== null &&
    "owner" in ownerOrNote
  ) {
    const note = ownerOrNote as OutputNote;
    owner = note.owner;
    noteSecret = note.secret;
    noteAssetId = note.asset_id;
    noteAmount = note.asset_amount;
  } else {
    // Use individual parameters
    if (secret === undefined || assetId === undefined || amount === undefined) {
      throw new Error(
        "Missing required parameters when not passing an OutputNote object",
      );
    }
    owner = ownerOrNote as bigint | string;
    noteSecret = secret;
    noteAssetId = assetId;
    noteAmount = amount;
  }

  const noteHash = await poseidonHash([
    BigInt(noteAssetId),
    BigInt(noteAmount),
    BigInt(owner),
    BigInt(noteSecret),
  ]);

  return BigInt(noteHash.toString());
}
