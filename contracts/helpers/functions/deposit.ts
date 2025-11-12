import { poseidon2Hash } from "@zkpassport/poseidon2";
import { DepositNote } from "@/types/notes";
import { Deposit } from "shared/classes/Deposit";

export const getDepositDetails = async (depositNote: DepositNote) => {
  const { assetId, assetAmount, secret, owner } = depositNote;

  const deposit = new Deposit();

  await deposit.depositNoir.init();

  const noteHash = poseidon2Hash([
    BigInt(assetId),
    BigInt(assetAmount),
    BigInt(owner),
    BigInt(secret),
  ]);

  const noteHashN = BigInt(noteHash.toString());

  const { witness } = await deposit.depositNoir.execute({
    hash: noteHashN.toString(),
    asset_id: BigInt(assetId).toString(),
    asset_amount: assetAmount.toString(),
    owner: owner.toString(),
    secret: secret.toString(),
  });

  const proof = await deposit.depositBackend.generateProof(witness, {
    keccakZK: true,
  });

  return {
    proof,
  };
};
