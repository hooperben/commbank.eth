import { PoseidonMerkleTree } from "@/helpers/poseidon-merkle-tree";
import { getNoirClasses } from "@/helpers/test-suite/get-noir-classes";
import { InputNote } from "..";

export const getWithdrawDetails = async (
  tree: PoseidonMerkleTree,
  inputNotes: InputNote[],
  nullifiers: string[],
  exitAssets: string[],
  exitAmounts: string[],
  exitAddresses: string[],
  exitAddressHashes: string[],
) => {
  const { withdrawNoir, withdrawBackend } = getNoirClasses();

  const root = await tree.getRoot();

  const { witness: withdrawWitness } = await withdrawNoir.execute({
    root: "0x" + BigInt(root.toString()).toString(16),
    input_notes: inputNotes as any,
    nullifiers: nullifiers as any,
    exit_assets: exitAssets as any,
    exit_amounts: exitAmounts as any,
    exit_addresses: exitAddresses as any,
    exit_address_hashes: exitAddressHashes as any,
  });

  const withdrawProof = await withdrawBackend.generateProof(withdrawWitness, {
    keccak: true,
  });

  return {
    proof: withdrawProof,
  };
};
