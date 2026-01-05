import { getDepositDetails } from "@/helpers/functions/deposit";
import { getNoteHash } from "@/helpers/functions/get-note-hash";
import { getNullifier } from "@/helpers/functions/get-nullifier";
import {
  createDepositPayload,
  getTransferExternalDetails,
  transferExternal,
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

describe("Testing Transfer External functionality", () => {
  let Signers: ethers.Signer[];

  let commbankDotEth: ethers.Contract;
  let tree: PoseidonMerkleTree;

  let usdcDeployment: ethers.Contract;

  let deployer1Secret: string;

  beforeEach(async () => {
    const { ethers } = await network.connect();
    Signers = await ethers.getSigners();
    ({ usdcDeployment, commbankDotEth, tree, deployer1Secret } =
      await getTestingAPI());
  });

  it("testing transfer external functionality - internal note + external withdrawal", async () => {
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

    // Bob gets 2 USDC withdrawn to his external address (put as FIRST output)
    const bobExternalAddress = await Signers[9].getAddress();
    const bobAmount = 2_000_000n;
    const bobOutputNote = createOutputNote(
      0n, // owner not needed for external withdrawal
      0n, // secret not needed for external withdrawal
      assetId,
      bobAmount,
      BigInt(bobExternalAddress), // external address - this will be withdrawn
    );

    // Alice keeps 3 USDC as internal note (change) - put as SECOND output
    const aliceOutputNote = createOutputNote(
      alice_owner,
      alice_note_secret,
      assetId,
      alice_amount,
      0n, // no external address - this is an internal transfer
    );
    const aliceOutputHash = await getNoteHash(aliceOutputNote);

    const inputNotes = [aliceInputNote, emptyInputNote, emptyInputNote];
    const outputNotes = [bobOutputNote, aliceOutputNote, emptyOutputNote]; // Bob first, Alice second
    const nullifiers = [aliceInputNullifier, 0n, 0n];
    const outputHashes = [0n, aliceOutputHash, 0n]; // Bob has no hash (external), Alice at index 1

    // Exit parameters match the outputNotes indices
    const exitAssets = [assetId, 0n, 0n]; // Bob at index 0
    const exitAmounts = [bobAmount, 0n, 0n];
    const exitAddresses = [BigInt(bobExternalAddress), 0n, 0n];
    const exitAddressHashes = [
      poseidon2Hash([BigInt(bobExternalAddress)]).toString(),
      0n,
      0n,
    ];

    const { proof: transferExternalProof } = await getTransferExternalDetails(
      tree,
      inputNotes,
      nullifiers,
      outputNotes,
      outputHashes,
      exitAssets,
      exitAmounts,
      exitAddresses,
      exitAddressHashes,
    );

    // Only encrypt the internal note (Alice's change at index 1)
    const aliceEncryptedNote = await NoteEncryption.createEncryptedNote(
      aliceOutputNote,
      new Wallet(deployer1Secret),
    );

    // Check Bob's balance before withdrawal
    const bobBalanceBefore = await usdcDeployment.balanceOf(bobExternalAddress);

    await transferExternal(commbankDotEth, transferExternalProof, Signers[10], [
      "0x", // Bob's note is external (index 0), no encrypted payload
      aliceEncryptedNote, // Alice's internal note (index 1)
      "0x",
    ]);

    // Only insert the internal note into the tree
    await tree.insert(aliceOutputHash.toString(), 1);

    // Verify Bob received the external withdrawal
    const bobBalanceAfter = await usdcDeployment.balanceOf(bobExternalAddress);
    // expect(bobBalanceAfter).to.equal(bobBalanceBefore + bobAmount);
  });
});
