import RSA, { getPayload, SignatureGenModule } from "../helpers/rsa";
import { EncryptedMessage, KeyPair } from "../web/signature_gen";

import { UltraHonkBackend } from "@aztec/bb.js";
import { InputMap, Noir } from "@noir-lang/noir_js";
import { keccak256, parseUnits, Wallet } from "ethers";
import MerkleTree from "merkletreejs";
import { getLeafAddedDetails, getPayloadDetails } from "../helpers/logs";
import { generateZerosFunction } from "../helpers/merkle-tree";
import { generateRandomSecret } from "../helpers/random";
import {
  formatUint8Array,
  getTestingAPI,
  numberToUint8Array,
} from "../helpers/testing-api";
import { CommBankDotEth, USDC } from "../typechain-types";
import { convertFromHexToArray } from "../helpers/formatter";

describe("Note creation and flow testing", () => {
  let rsa: typeof SignatureGenModule;

  let backend: UltraHonkBackend;
  let noir: Noir;
  let transactBackend: UltraHonkBackend;
  let transactNoir: Noir;
  let withdrawBackend: UltraHonkBackend;
  let withdrawNoir: Noir;

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
      withdrawNoir,
      withdrawBackend,
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

  it("should let me deposit to the contract", async () => {
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
    const [leafDetails] = getLeafAddedDetails(commbank, receipt!.logs);

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
      keccak256(keccak256(bobRSA.private_key)),
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

    const { witness: transactWitness } = await transactNoir.execute(
      transactInput as unknown as InputMap,
    );

    const { proof: transactProof, publicInputs: transactPublicInputs } =
      await transactBackend.generateProof(transactWitness, {
        keccak: true,
      });

    const transactPayloads = [
      rsa.encrypt(
        getPayload(
          new Uint8Array(aliceOutputNote.note_secret),
          assetId,
          amount,
        ),
        aliceRSA.public_key,
      ).data,
      rsa.encrypt(
        getPayload(new Uint8Array(bobOutputNote.note_secret), assetId, amount),
        bobRSA.public_key,
      ).data,
    ];

    // submit the encrypted transfer
    const transactTx = await commbank.transfer(
      transactProof.slice(4),
      transactPublicInputs,
      transactPayloads,
    );

    const transactReceipt = await transactTx.wait();

    const [aliceLeafInsert, bobLeafInsert] = getLeafAddedDetails(
      commbank,
      transactReceipt!.logs,
    );

    console.log("aliceLeafInsert: ", aliceLeafInsert);
    console.log("bobLeafInsert: ", bobLeafInsert);

    // update our typescript tree to match our contract tree
    tree.updateLeaf(1, aliceLeafInsert.noteHash);
    tree.updateLeaf(2, bobLeafInsert.noteHash);

    // now that bob has a balance, he is going to withdraw it back to usdc
    const bobMerklePath = tree.getProof(bobLeafInsert.noteHash).map((step) => {
      return {
        path: step.position === "right" ? 1 : 0,
        value: convertFromHexToArray(step.data.toString("hex")),
      };
    });

    console.log("bobMerklePath: ", bobMerklePath);

    const bobPaths = bobMerklePath.map((x) => x.path);
    const bobValues = bobMerklePath.map((x) => x.value);

    const bobInputNote = {
      owner: formatUint8Array(bobPubKey),
      owner_secret: formatUint8Array(
        convertFromHexToArray(keccak256(bobRSA.private_key)),
      ),
      note_secret: bobOutputNote.note_secret,
      asset_id: formatUint8Array(assetId),
      amount_array: formatUint8Array(numberToUint8Array(420n)),
      amount: 420,
      leaf_index: formatUint8Array(numberToUint8Array(2n)),
      path: bobPaths,
      path_data: bobValues.map((item) => formatUint8Array(item)),
    };

    const bobInputNoteNullifier = keccak256(
      Uint8Array.from([
        ...bobInputNote.leaf_index,
        ...bobInputNote.note_secret,
        ...bobInputNote.amount_array,
        ...bobInputNote.asset_id,
      ]),
    );

    const withdrawInput = {
      root: formatUint8Array(
        convertFromHexToArray("0x" + tree.getRoot().toString("hex")),
      ),
      input_notes: [bobInputNote, emptyNote],
      nullifiers: [
        formatUint8Array(convertFromHexToArray(bobInputNoteNullifier)),
        emptyNullifier,
      ],
      exit_assets: [bobInputNote.asset_id, emptyNote.asset_id],
      exit_amounts: [420, 0],
    };

    const { witness: withdrawWitness } = await withdrawNoir.execute(
      withdrawInput as unknown as InputMap,
    );

    const { proof: withdrawProof, publicInputs: withdrawPublicInputs } =
      await withdrawBackend.generateProof(withdrawWitness, {
        keccak: true,
      });

    const bobERC20BalanceBefore = await usdc.balanceOf(bob.address);
    console.log("bob before withdraw: ", bobERC20BalanceBefore);
    console.log("0x" + tree.getRoot().toString("hex"));

    await commbank.withdraw(
      withdrawProof.slice(4),
      withdrawPublicInputs,
      bob.address,
    );

    console.log("worked");

    const bobERC20BalanceAfter = await usdc.balanceOf(bob.address);
    console.log("bob after withdraw: ", bobERC20BalanceAfter);
  });

  it.skip("should output sol code for zeros() in merkle tree", async () => {
    generateZerosFunction();
  });
});
