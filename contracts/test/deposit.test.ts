import { approve } from "@/helpers/functions/approve";
import { getDepositDetails } from "@/helpers/functions/deposit";
import { createDepositPayload } from "@/helpers/functions/transfer";
import { getTestingAPI } from "@/helpers/get-testing-api";
import { PoseidonMerkleTree } from "@/helpers/poseidon-merkle-tree";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { expect } from "chai";
import { ethers } from "ethers";

describe("Testing deposit functionality", () => {
  let Signers: [];

  let commbankDotEth: ethers.Contract;
  let usdcDeployment: ethers.Contract;

  let tree: PoseidonMerkleTree;

  before(async () => {
    ({ commbankDotEth, Signers, usdcDeployment, tree } = await getTestingAPI());
  });

  it("testing note proving in typescript", async () => {
    const assetId = await usdcDeployment.getAddress();

    const assetAmount = 5_000_000n;

    const secret =
      2389312107716289199307843900794656424062350252250388738019021107824217896920n;
    const ownerSecret =
      10036677144260647934022413515521823129584317400947571241312859176539726523915n;
    const owner = BigInt(poseidon2Hash([ownerSecret]).toString());

    // create the ZK proof
    const { proof } = await getDepositDetails({
      assetId,
      assetAmount,
      secret,
      owner,
    });

    await usdcDeployment.approve(
      await commbankDotEth.getAddress(),
      assetAmount,
    );

    // create encrypted payload for the deposited note
    const depositPayload = await createDepositPayload(
      {
        secret,
        owner: owner.toString(),
        asset_id: assetId,
        asset_amount: assetAmount.toString(),
      },
      Signers[0],
    );

    // check our balances beforehand
    const usdcBalanceBefore = await usdcDeployment.balanceOf(
      Signers[0].address,
    );

    console.log(usdcBalanceBefore);

    // call the deposit TX
    await commbankDotEth.deposit(
      assetId,
      assetAmount,
      proof.proof,
      proof.publicInputs,
      depositPayload,
    );

    const usdcBalanceAfter = await usdcDeployment.balanceOf(Signers[0].address);

    expect(usdcBalanceAfter).eq(usdcBalanceBefore - assetAmount);

    // check our merkle state matches
    await tree.insert(proof.publicInputs[0], 0);

    const contractRoot = await commbankDotEth.roots(1);

    console.log("TODO check this matches (it does)", contractRoot);
  });

  it("should log the correct hash values for noir test file", async () => {
    const assetId = await usdcDeployment.getAddress();
    const amount = 10_000_000n; // 10 with 6 decimals
    const secret =
      2389312107716289199307843900794656424062350252250388738019021107824217896920n;
    const ownerSecret =
      10036677144260647934022413515521823129584317400947571241312859176539726523915n;
    const owner = BigInt(poseidon2Hash([ownerSecret]).toString());

    // create the ZK proof
    const { proof } = await getDepositDetails({
      assetId,
      assetAmount: amount,
      secret,
      owner,
    });

    // approve commbank.eth to move the deposit token
    await approve(
      Signers[0],
      await usdcDeployment.getAddress(),
      await commbankDotEth.getAddress(),
      amount,
    );

    // check our balances beforehand
    const usdcBalanceBefore = await usdcDeployment.balanceOf(
      Signers[0].address,
    );

    // create encrypted payload for the deposited note
    const depositPayload = await createDepositPayload(
      {
        secret,
        owner: owner.toString(),
        asset_id: assetId,
        asset_amount: amount.toString(),
      },
      Signers[0],
    );

    // call the deposit TX
    await commbankDotEth.deposit(
      assetId,
      amount,
      proof.proof,
      proof.publicInputs,
      depositPayload,
    );

    const usdcBalanceAfter = await usdcDeployment.balanceOf(Signers[0].address);

    expect(usdcBalanceAfter).to.equal(usdcBalanceBefore - amount);
  });
});
