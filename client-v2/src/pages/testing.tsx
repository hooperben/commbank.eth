import { Button } from "@/components/ui/button";
import { poseidon2Hash } from "@zkpassport/poseidon2";

import { Deposit } from "shared/classes/Deposit";

const TestingPage = () => {
  const handleProof = async () => {
    try {
      // const hash =
      // 15877031116292595040191017675338240539290338653409019794000313907399651592164n;
      const asset_id = 1096978651789611665652906124278561787240579697095n;
      const amount = 5n;
      const owner =
        10812186542955647827474372651967207045861174805371180171801345448553285386806n;
      const secret =
        2389312107716289199307843900794656424062350252250388738019021107824217896920n;

      const deposit = new Deposit();

      const noteHash = poseidon2Hash([
        BigInt(asset_id),
        BigInt(amount),
        BigInt(owner),
        BigInt(secret),
      ]);

      const noteHashN = BigInt(noteHash.toString());

      await deposit.depositNoir.init();

      const { witness } = await deposit.depositNoir.execute({
        hash: noteHashN.toString(),
        asset_id: asset_id.toString(),
        asset_amount: amount.toString(),
        owner: owner.toString(),
        secret: secret.toString(),
      });

      const proof = await deposit.depositBackend.generateProof(witness, {
        keccak: true,
      });

      console.log(proof);
    } catch (err) {
      console.error("error: ", err);
    }
  };

  return (
    <div className="flex flex-col">
      <Button onClick={handleProof}>Generate Proof</Button>
    </div>
  );
};

export default TestingPage;
