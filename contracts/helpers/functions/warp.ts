import { getNoirClasses } from "@/helpers/test-suite/get-noir-classes";
import { InputNote, OutputNote } from "..";

export const getWarpDetails = async (
  root: bigint | string,
  inputNotes: InputNote[],
  outputNotes: OutputNote[],
  nullifiers: bigint[] | string[],
  outputHashes: bigint[] | string[],
  stargateAddresses: bigint[] | string[],
  stargateAmounts: bigint[] | string[],
) => {
  const { warpNoir, warpBackend } = getNoirClasses();

  const formattedInputNotes = inputNotes.map((note) => ({
    asset_id: "0x" + BigInt(note.asset_id).toString(16),
    asset_amount: "0x" + BigInt(note.asset_amount).toString(16),
    owner: "0x" + BigInt(note.owner).toString(16),
    owner_secret: "0x" + BigInt(note.owner_secret).toString(16),
    secret: "0x" + BigInt(note.secret).toString(16),
    leaf_index: "0x" + BigInt(note.leaf_index).toString(16),
    path: note.path.map((item) => "0x" + BigInt(item).toString(16)),
    path_indices: note.path_indices.map(
      (item) => "0x" + BigInt(item).toString(16),
    ),
  }));

  const { witness: warpWitness } = await warpNoir.execute({
    root: "0x" + root.toString(16),
    input_notes: formattedInputNotes,
    output_notes: outputNotes as any,
    nullifiers: nullifiers as any,
    output_hashes: outputHashes as any,
    stargate_assets: stargateAddresses as any,
    stargate_amounts: stargateAmounts as any,
  });

  const warpProof = await warpBackend.generateProof(warpWitness, {
    keccak: true,
  });

  return {
    proof: warpProof,
  };
};
