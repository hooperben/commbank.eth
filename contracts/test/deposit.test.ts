import { approve } from "@/helpers/functions/approve";
import { getDepositDetails } from "@/helpers/functions/deposit";
import { createDepositPayload } from "@/helpers/functions/transfer";
import { getTestingAPI } from "@/helpers/get-testing-api";
import { PoseidonMerkleTree } from "@/helpers/poseidon-merkle-tree";
import {
  CommBankDotEth,
  PrivateStargateFinance,
  USDC,
} from "@/typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { parseUnits } from "ethers";

describe("Testing deposit functionality", () => {
  let Signers: HardhatEthersSigner[];
  let poseidonHash: (inputs: bigint[]) => Promise<{ toString(): string }>;

  let commbankDotEth: CommBankDotEth;
  let usdcDeployment: USDC;

  let tree: PoseidonMerkleTree;

  beforeEach(async () => {
    ({ commbankDotEth, Signers, usdcDeployment, poseidonHash, tree } =
      await getTestingAPI());
  });

  it("testing note proving in typescript", async () => {
    const assetId = await usdcDeployment.getAddress();
    const assetAmount = 5_000_000n;

    const secret =
      2389312107716289199307843900794656424062350252250388738019021107824217896920n;
    const ownerSecret =
      10036677144260647934022413515521823129584317400947571241312859176539726523915n;
    const owner = BigInt((await poseidonHash([ownerSecret])).toString());

    // create the ZK proof
    const { proof } = await getDepositDetails({
      assetId,
      assetAmount,
      secret,
      owner,
    });

    // approve PSF to move the deposit token
    await approve(
      Signers[0],
      await usdcDeployment.getAddress(),
      await commbankDotEth.getAddress(),
      assetAmount,
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
        asset_amount: assetAmount.toString(),
      },
      Signers[0],
    );

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
  });

  it("should log the correct hash values for noir test file", async () => {
    const assetId = await usdcDeployment.getAddress();
    const amount = 10_000_000n; // 10 with 6 decimals
    const secret =
      2389312107716289199307843900794656424062350252250388738019021107824217896920n;
    const ownerSecret =
      10036677144260647934022413515521823129584317400947571241312859176539726523915n;
    const owner = BigInt((await poseidonHash([ownerSecret])).toString());

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
