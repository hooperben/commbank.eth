import { getTransferDetails } from "@/helpers/functions/transfer";
import { getNoteHash } from "@/helpers/functions/get-note-hash";
import { getNullifier } from "@/helpers/functions/get-nullifier";
import { getTestingAPI } from "@/helpers/get-testing-api";
import {
  createInputNote,
  createOutputNote,
  emptyInputNote,
  emptyOutputNote,
} from "@/helpers/note-formatting";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { ethers } from "ethers";

async function main() {
  console.log("🔧 Setting up test environment...");
  const { usdcDeployment, tree } = await getTestingAPI();

  const assetId = await usdcDeployment.getAddress();
  const assetAmount = 5_000_000n;

  // Alice's credentials
  const secret =
    2389312107716289199307843900794656424062350252250388738019021107824217896920n;
  const ownerSecret =
    10036677144260647934022413515521823129584317400947571241312859176539726523915n;
  const owner = BigInt(poseidon2Hash([ownerSecret]).toString());

  // First, we need to create a deposit to have something to spend
  console.log("📝 Creating input note...");
  const depositHash = await getNoteHash({
    owner: owner.toString(),
    secret: secret.toString(),
    asset_id: assetId,
    asset_amount: assetAmount.toString(),
  });

  // Insert the deposit into the tree
  await tree.insert(depositHash.toString(), 0);

  // Get merkle proof for the deposit
  const merkleProof = await tree.getProof(0);
  const leafIndex = 0n;

  // Create the input note to spend
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

  // Alice's change note
  const alice_amount = 3_000_000n;
  const alice_note_secret =
    19536471094918068928039225564664574556680178861106125446000998678966251111926n;

  const aliceOutputNote = createOutputNote(
    owner,
    alice_note_secret,
    assetId,
    alice_amount,
  );
  const aliceOutputHash = await getNoteHash(aliceOutputNote);

  // Bob's note
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

  // Prepare inputs for transfer proof
  const inputNotes = [aliceInputNote, emptyInputNote, emptyInputNote];
  const outputNotes = [aliceOutputNote, bobOutputNote, emptyOutputNote];
  const nullifiers = [aliceInputNullifier, 0n, 0n];
  const outputHashes = [aliceOutputHash, bobOutputHash, 0n];

  console.log("🔐 Generating transfer proof...");
  const { proof: transferProof } = await getTransferDetails(
    tree,
    inputNotes,
    nullifiers,
    outputNotes,
    outputHashes,
  );

  console.log("✅ Proof generated successfully!");
  console.log("📊 Proof size:", transferProof.proof.length / 2 - 1, "bytes");
  console.log("📊 Public inputs:", transferProof.publicInputs.length);

  // Prepare the payload for the relayer
  const relayerPayload = {
    proof: {
      proof: ethers.hexlify(transferProof.proof),
      publicInputs: transferProof.publicInputs,
    },
    payload: ["0x", "0x", "0x"], // Empty encrypted notes for testing
  };

  console.log("\n🚀 Sending proof to relayer...");
  console.log(
    JSON.stringify(
      {
        proof: {
          proof: relayerPayload.proof.proof.substring(0, 100) + "...",
          publicInputs: relayerPayload.proof.publicInputs,
        },
        payload: relayerPayload.payload,
      },
      null,
      2,
    ),
  );

  try {
    const response = await fetch(
      "https://relayer-production-91b9.up.railway.app/tx",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(relayerPayload),
      },
    );

    const text = await response.text();
    console.log("\n📬 Response status:", response.status);
    console.log("📬 Response body:", text);

    if (response.ok) {
      console.log("\n✅ Relayer accepted and verified the proof!");
    } else {
      console.log("\n❌ Relayer rejected the proof:", text);
    }
  } catch (error) {
    console.error("\n❌ Error connecting to relayer:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
