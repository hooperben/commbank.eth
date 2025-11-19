import { approve } from "@/helpers/functions/approve";
import { getDepositDetails } from "@/helpers/functions/deposit";
import { getNoteHash } from "@/helpers/functions/get-note-hash";
import { getNullifier } from "@/helpers/functions/get-nullifier";
import {
  createDepositPayload,
  getTransferDetails,
  transfer,
} from "@/helpers/functions/transfer";
import { getWithdrawDetails } from "@/helpers/functions/withdraw";
import { getTestingAPI } from "@/helpers/get-testing-api";
import {
  createInputNote,
  createOutputNote,
  emptyInputNote,
  emptyOutputNote,
} from "@/helpers/note-formatting";
import { NoteEncryption } from "@/helpers/note-sharing";
import { PoseidonMerkleTree } from "@/helpers/poseidon-merkle-tree";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { expect } from "chai";
import { ethers, parseEther, parseUnits } from "ethers";

describe("Testing Withdraw functionality", () => {
  let Signers: ethers.Signer[];

  let commbankDotEth: ethers.Contract;
  let tree: PoseidonMerkleTree;

  let usdcDeployment: ethers.Contract;

  let deployer1Secret: string;
  let deployer2Secret: string;

  const secret =
    2389312107716289199307843900794656424062350252250388738019021107824217896920n;
  const ownerSecret =
    10036677144260647934022413515521823129584317400947571241312859176539726523915n;
  const owner = BigInt(poseidon2Hash([ownerSecret]).toString());

  beforeEach(async () => {
    ({
      Signers,
      usdcDeployment,
      commbankDotEth,
      tree,
      deployer1Secret,
      deployer2Secret,
    } = await getTestingAPI());
  });

  it("Withdraw ERC20 test case", async () => {
    const assetId = await usdcDeployment.getAddress();
    const assetAmount = BigInt("5");
    // in order to transfer we need to first deposit
    const { proof: depositProof } = await getDepositDetails({
      assetId,
      assetAmount,
      secret,
      owner,
    });

    await approve(
      Signers[0],
      await usdcDeployment.getAddress(),
      await commbankDotEth.getAddress(),
      parseUnits("5", 6),
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

    await commbankDotEth.deposit(
      assetId,
      assetAmount,
      depositProof.proof,
      depositProof.publicInputs,
      depositPayload,
    );
    await tree.insert(depositProof.publicInputs[0], 0);

    // now we have deposited we can spend
    // get the merkle proof to spend our input note
    const merkleProof = await tree.getProof(0);
    const leafIndex = 0n;

    // create the input note to spend
    const aliceInputNote = createInputNote(
      assetId,
      assetAmount,
      owner,
      ownerSecret,
      secret,
      leafIndex,
      merkleProof.siblings,
      merkleProof.indices,
    );

    const aliceInputNullifier = await getNullifier(aliceInputNote);

    // ALICE CHANGE NOTE DETAILS
    const alice_owner = owner;
    const alice_amount = 3n;
    const alice_note_secret =
      19536471094918068928039225564664574556680178861106125446000998678966251111926n;

    const aliceOutputNote = createOutputNote(
      alice_owner,
      alice_note_secret,
      assetId,
      alice_amount,
    );
    const aliceOutputHash = await getNoteHash(aliceOutputNote);

    // BOB SEND NOTE DETAILS
    const bobOwnerSecret =
      6955001134965379637962992480442037189090898019061077075663294923529403402038n;
    const bobOwner = poseidon2Hash([bobOwnerSecret]).toString();
    const bobNoteSecret =
      3957740128091467064337395812164919758932045173069261808814882570720300029469n;
    const bobAmount = 2n;
    const bobOutputNote = createOutputNote(
      bobOwner,
      bobNoteSecret,
      assetId,
      bobAmount,
    );

    const bobOutputHash = await getNoteHash(bobOutputNote);

    const inputNotes = [aliceInputNote, emptyInputNote, emptyInputNote];
    const outputNotes = [aliceOutputNote, bobOutputNote, emptyOutputNote];
    const nullifiers = [aliceInputNullifier, 0n, 0n];
    const outputHashes = [aliceOutputHash, bobOutputHash, 0n];

    const { proof: transferProof } = await getTransferDetails(
      tree,
      inputNotes,
      nullifiers,
      outputNotes,
      outputHashes,
    );

    const aliceEncrypteddNote = await NoteEncryption.createEncryptedNote(
      aliceOutputNote,
      new ethers.Wallet(deployer1Secret),
    );

    const bobEncryptedNote = await NoteEncryption.createEncryptedNote(
      bobOutputNote,
      new ethers.Wallet(deployer2Secret),
    );

    await transfer(commbankDotEth, transferProof, Signers[10], [
      aliceEncrypteddNote,
      bobEncryptedNote,
      "0x",
    ]);

    await tree.insert(transferProof.publicInputs[4], 1);
    await tree.insert(transferProof.publicInputs[5], 2);

    const bobProof = await tree.getProof(2);

    const bobInputNote = createInputNote(
      BigInt(assetId),
      bobAmount,
      bobOwner,
      bobOwnerSecret,
      bobNoteSecret,
      2n, // leaf index in tree (not amount)
      bobProof.siblings,
      bobProof.indices,
    );

    const bobInputNullifier = await getNullifier(bobInputNote);
    const withdrawInputNotes = [bobInputNote, emptyInputNote, emptyInputNote];
    const withdrawNullifiers = [
      "0x" + bobInputNullifier.toString(16),
      "0",
      "0",
    ];
    const exitAssets = [assetId, "0", "0"];
    const exitAmounts = [
      "0x" + BigInt(bobInputNote.asset_amount).toString(16),
      "0",
      "0",
    ];
    const exitAddresses = [Signers[9].address, "0", "0"];
    const exitAddressHahes = [
      poseidon2Hash([BigInt(Signers[9].address)]).toString(),
      "0",
      "0",
    ];

    const usdcBalanceBefore = await usdcDeployment.balanceOf(
      Signers[9].address,
    );

    const { proof: withdrawProof } = await getWithdrawDetails(
      tree,
      withdrawInputNotes,
      withdrawNullifiers,
      exitAssets,
      exitAmounts,
      exitAddresses,
      exitAddressHahes,
    );

    await commbankDotEth.withdraw(
      withdrawProof.proof,
      withdrawProof.publicInputs,
    );

    const usdcBalanceAfter = await usdcDeployment.balanceOf(Signers[9].address);

    expect(usdcBalanceAfter).eq(
      usdcBalanceBefore + bobInputNote.asset_amount.toString(),
    );
  });

  it("Testing Native withdrawal", async () => {
    const assetAmount = parseEther("1");
    const ethAddress = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

    const { proof: depositProof } = await getDepositDetails({
      assetId: ethAddress,
      assetAmount,
      secret,
      owner,
    });

    // create encrypted payload for the deposited note
    const depositPayload = await createDepositPayload(
      {
        secret,
        owner: owner.toString(),
        asset_id: ethAddress,
        asset_amount: assetAmount.toString(),
      },
      Signers[0],
    );

    await commbankDotEth.depositNative(
      depositProof.proof,
      depositProof.publicInputs,
      depositPayload,
      {
        value: assetAmount,
      },
    );

    await tree.insert(depositProof.publicInputs[0], 0);

    const merkleProof = await tree.getProof(0);
    const leafIndex = 0n;

    const inputNote = createInputNote(
      ethAddress,
      assetAmount,
      owner,
      ownerSecret,
      secret,
      leafIndex,
      merkleProof.siblings,
      merkleProof.indices,
    );
    const aliceInputNullifier = await getNullifier(inputNote);

    const inputNotes = [inputNote, emptyInputNote, emptyInputNote];
    const nullifiers = ["0x" + aliceInputNullifier.toString(16), "0", "0"];
    const exitAddresses = [Signers[9].address, "0", "0"];
    const exitAddressHahes = [
      poseidon2Hash([BigInt(Signers[9].address)]).toString(),
      "0",
      "0",
    ];

    const exitAssets = [ethAddress, "0", "0"];
    const exitAmounts = ["0x" + BigInt(assetAmount).toString(16), "0", "0"];

    const { proof: withdrawProof } = await getWithdrawDetails(
      tree,
      inputNotes,
      nullifiers,
      exitAssets,
      exitAmounts,
      exitAddresses,
      exitAddressHahes,
    );

    await commbankDotEth.withdraw(
      withdrawProof.proof,
      withdrawProof.publicInputs,
    );
  });
});
