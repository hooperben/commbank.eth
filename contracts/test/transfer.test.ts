import { getDepositDetails } from "@/helpers/functions/deposit";
import { getNoteHash } from "@/helpers/functions/get-note-hash";
import { getNullifier } from "@/helpers/functions/get-nullifier";
import {
  createDepositPayload,
  getTransferDetails,
  transfer,
} from "@/helpers/functions/transfer";
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
import { ethers, Wallet } from "ethers";
import { network } from "hardhat";

describe("Testing Transfer functionality", () => {
  let Signers: ethers.Signer[];

  let commbankDotEth: ethers.Contract;
  let tree: PoseidonMerkleTree;

  let usdcDeployment: ethers.Contract;

  let deployer1Secret: string;
  let deployer2Secret: string;

  beforeEach(async () => {
    const { ethers } = await network.connect();
    Signers = await ethers.getSigners();
    ({
      usdcDeployment,
      commbankDotEth,
      tree,
      deployer1Secret,
      deployer2Secret,
    } = await getTestingAPI());
  });

  it("testing transfer functionality", async () => {
    const assetId = await usdcDeployment.getAddress();
    const assetAmount = 5_000_000n;

    const secret =
      2389312107716289199307843900794656424062350252250388738019021107824217896920n;
    const ownerSecret =
      10036677144260647934022413515521823129584317400947571241312859176539726523915n;
    const owner = BigInt(poseidon2Hash([ownerSecret]).toString());

    // create the ZK proof
    const { proof: depositProof } = await getDepositDetails({
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

    const aliceInputNullifier = await getNullifier(
      leafIndex,
      owner,
      secret,
      assetId,
      assetAmount,
    );

    // ALICE CHANGE NOTE DETAILS
    const alice_owner = owner;
    const alice_amount = 3_000_000n;
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
    const bobAmount = 2_000_000n;
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
      new Wallet(deployer1Secret),
    );

    const bobEncryptedNote = await NoteEncryption.createEncryptedNote(
      bobOutputNote,
      new Wallet(deployer2Secret),
    );

    await transfer(commbankDotEth, transferProof, Signers[10], [
      aliceEncrypteddNote,
      bobEncryptedNote,
      "0x",
    ]);

    await tree.insert(aliceOutputHash.toString(), 1);
    await tree.insert(bobOutputHash.toString(), 2);

    // TODO add extra checks here
  });
});
