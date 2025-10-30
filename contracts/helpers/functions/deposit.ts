import { loadPoseidon } from "@/helpers/load-poseidon";
import { getNoirClasses } from "@/helpers/test-suite/get-noir-classes";
import { DepositNote } from "..";

export const getDepositDetails = async (depositNote: DepositNote) => {
  const { assetId, assetAmount, secret, owner } = depositNote;
  const { depositNoir, depositBackend } = getNoirClasses();

  const poseidonHash = await loadPoseidon();

  const noteHash = await poseidonHash([
    BigInt(assetId),
    BigInt(assetAmount),
    BigInt(owner),
    BigInt(secret),
  ]);

  const noteHashN = BigInt(noteHash.toString());

  const { witness } = await depositNoir.execute({
    hash: noteHashN.toString(),
    asset_id: assetId.toString(),
    asset_amount: assetAmount.toString(),
    owner: owner.toString(),
    secret: secret.toString(),
  });

  const proof = await depositBackend.generateProof(witness, { keccak: true });

  return {
    proof,
  };
};
