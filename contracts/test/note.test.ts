import RSA, { getPayload, SignatureGenModule } from "../helpers/rsa";
import { EncryptedMessage, KeyPair } from "../web/signature_gen";

import { UltraHonkBackend } from "@aztec/bb.js";
import { InputMap, Noir } from "@noir-lang/noir_js";
import { keccak256, parseUnits, Wallet } from "ethers";
import MerkleTree from "merkletreejs";
import { getLeafAddedDetails, getPayloadDetails } from "../helpers/logs";
import { generateZerosFunction } from "../helpers/merkle-tree";
import { generateRandomSecret } from "../helpers/random";
import { getTestingAPI, numberToUint8Array } from "../helpers/testing-api";
import { CommBankDotEth, USDC } from "../typechain-types";

const convertFromHexToArray = (rawInput: string): Uint8Array => {
  const formattedInput = rawInput.startsWith("0x")
    ? rawInput.slice(2)
    : rawInput;

  const evenFormattedInput =
    formattedInput.length % 2 === 0 ? formattedInput : "0" + formattedInput;

  return Uint8Array.from(Buffer.from(evenFormattedInput, "hex"));
};

describe("Note creation and flow testing", () => {
  let rsa: typeof SignatureGenModule;

  let backend: UltraHonkBackend;
  let noir: Noir;
  let transactBackend: UltraHonkBackend;
  let transactNoir: Noir;

  let alice: Wallet;
  let bob: Wallet;
  let aliceRSA: KeyPair;
  let bobRSA: KeyPair;
  let usdc: USDC;
  let commbank: CommBankDotEth;
  let tree: MerkleTree;

  before(async () => {
    rsa = RSA();
    ({
      noir,
      backend,
      transactNoir,
      transactBackend,
      alice,
      bob,
      aliceRSA,
      bobRSA,
      usdc,
      commbank,
      tree,
    } = await getTestingAPI());

    await usdc.connect(alice).mint(alice.address, parseUnits("1000000", 6));
  });

  it("should let me create a key pair", async () => {
    const note = {
      secret:
        "0xc0160463fbe2d99a4f7f9ffd93a0789132980899da181cc42021488404fa7c31",
      asset: "0xF0bAfD58E23726785A1681e1DEa0da15cB038C61",
      amount: "18446744073709551615", // Maximum value for u64 in Rust (2^64 - 1)
    };

    const encryptedMessage = rsa.encrypt(
      `${note.secret}${note.asset}${note.amount}`,
      aliceRSA.public_key,
    );

    const decryptedMessage = rsa.decrypt(
      encryptedMessage,
      aliceRSA.private_key,
    );

    console.log(decryptedMessage);
  });

  it.only("should let me deposit to the contract", async () => {
    // approve commbank.eth to move USDC for the user
    await usdc
      .connect(alice)
      .approve(await commbank.getAddress(), parseUnits("1000000", 6));

    const depositAmount = 69_420n;
    const amount = numberToUint8Array(depositAmount);
    const assetId = convertFromHexToArray(await usdc.getAddress());

    const noteSecret = generateRandomSecret();

    const alicePubKey = convertFromHexToArray(
      keccak256(keccak256(aliceRSA.private_key)),
    );

    const noteHash = keccak256(
      Uint8Array.from([...alicePubKey, ...amount, ...assetId, ...noteSecret]),
    );

    const input = {
      note_secret: Array.from(noteSecret).map((item) => item.toString()),
      hash: Array.from(convertFromHexToArray(noteHash)).map((item) =>
        item.toString(),
      ),
      amount: depositAmount.toString(),
      amount_array: Array.from(amount).map((item) => item.toString()),
      pub_key: Array.from(alicePubKey).map((item) => item.toString()),
      asset_id: Array.from(assetId).map((item) => item.toString()),
    };

    const { witness } = await noir.execute(input as unknown as InputMap);
    const { proof, publicInputs } = await backend.generateProof(witness, {
      keccak: true,
    });

    const payload = getPayload(noteSecret, assetId, amount);
    const encryptedMessage = rsa.encrypt(payload, aliceRSA.public_key);

    const tx = await commbank
      .connect(alice)
      .deposit(
        await usdc.getAddress(),
        69420n,
        proof.slice(4),
        publicInputs,
        encryptedMessage.data,
      );

    // Wait for transaction to be mined and get receipt
    const receipt = await tx.wait();

    const leafDetails = getLeafAddedDetails(commbank, receipt!.logs);
    const encryptedBytes = getPayloadDetails(commbank, receipt!.logs);

    // update our tree with the inserted note
    tree.updateLeaf(leafDetails.leafIndex, leafDetails.noteHash);

    const merklePath = tree.getProof(noteHash).map((step) => {
      return {
        path: step.position === "right" ? 1 : 0,
        value: convertFromHexToArray(step.data.toString("hex")),
      };
    });

    const paths = merklePath.map((x) => x.path);
    const values = merklePath.map((x) => x.value);

    const formatUint8Array = (inputArray: Uint8Array) =>
      Array.from(inputArray.map((item) => Number(item)));

    const inputNote = {
      owner: formatUint8Array(alicePubKey),
      owner_secret: formatUint8Array(
        convertFromHexToArray(keccak256(aliceRSA.private_key)),
      ),
      note_secret: formatUint8Array(noteSecret),
      asset_id: formatUint8Array(assetId),
      amount_array: formatUint8Array(amount),
      amount: depositAmount.toString(),
      leaf_index: formatUint8Array(numberToUint8Array(leafDetails.leafIndex)),
      path: paths,
      path_data: values.map((item) => formatUint8Array(item)),
    };

    const inputNoteNullifier = keccak256(
      Uint8Array.from([
        ...inputNote.leaf_index,
        ...inputNote.note_secret,
        ...inputNote.amount_array,
        ...inputNote.asset_id,
      ]),
    );

    // we are sending bob 420 tokens. Alice should have 69000 left over
    const aliceOutputNote = {
      owner: formatUint8Array(alicePubKey),
      note_secret: formatUint8Array(generateRandomSecret()),
      asset_id: formatUint8Array(assetId),
      amount_array: formatUint8Array(numberToUint8Array(69000n)),
      amount: 69000,
    };

    const aliceOutputNoteHash = formatUint8Array(
      convertFromHexToArray(
        keccak256(
          Uint8Array.from([
            ...alicePubKey,
            ...aliceOutputNote.amount_array,
            ...assetId,
            ...aliceOutputNote.note_secret,
          ]),
        ),
      ),
    );

    const bobPubKey = convertFromHexToArray(
      keccak256(keccak256(aliceRSA.private_key)),
    );

    const bobOutputNote = {
      owner: formatUint8Array(bobPubKey),
      note_secret: formatUint8Array(generateRandomSecret()),
      asset_id: formatUint8Array(assetId),
      amount_array: formatUint8Array(numberToUint8Array(420n)),
      amount: 420,
    };

    const bobOutputNoteHash = formatUint8Array(
      convertFromHexToArray(
        keccak256(
          Uint8Array.from([
            ...bobPubKey,
            ...bobOutputNote.amount_array,
            ...assetId,
            ...bobOutputNote.note_secret,
          ]),
        ),
      ),
    );

    const emptyNullifier = formatUint8Array(numberToUint8Array(0n));
    const emptyNote = {
      owner: formatUint8Array(new Uint8Array(32)),
      owner_secret: formatUint8Array(new Uint8Array(32)),
      note_secret: formatUint8Array(new Uint8Array(32)),
      asset_id: formatUint8Array(new Uint8Array(20)),
      amount_array: formatUint8Array(new Uint8Array(32)),
      amount: 0,
      leaf_index: formatUint8Array(numberToUint8Array(0n)),
      path: paths,
      path_data: values.map((value) => formatUint8Array(value)),
    };

    const transactInput = {
      root: formatUint8Array(
        convertFromHexToArray("0x" + tree.getRoot().toString("hex")),
      ),
      input_notes: [inputNote, emptyNote],
      output_notes: [aliceOutputNote, bobOutputNote],
      nullifiers: [
        formatUint8Array(convertFromHexToArray(inputNoteNullifier)),
        emptyNullifier,
      ],
      output_hashes: [aliceOutputNoteHash, bobOutputNoteHash],
    };

    console.log(transactInput.input_notes[0].path_data);
    console.log(transactInput.input_notes[1].path_data);

    console.log("root:", transactInput.root);
    console.log("input_notes:", transactInput.input_notes);
    console.log("output_notes:", transactInput.output_notes);

    let transactProof, transactPublicInputs;

    const { witness: transactWitness } = await transactNoir.execute(
      transactInput as unknown as InputMap,
    );

    ({ proof: transactProof, publicInputs: transactPublicInputs } =
      await transactBackend.generateProof(transactWitness, {
        keccak: true,
      }));

    console.log(transactPublicInputs);
  });

  it.skip("should output sol code for zeros() in merkle tree", async () => {
    generateZerosFunction();
  });
});
