import RSA, { getPayload, SignatureGenModule } from "../helpers/rsa";
import { KeyPair } from "../web/signature_gen";

import { getTestingAPI } from "../helpers/testing-api";
import { InputMap, Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Wallet, parseUnits, keccak256 } from "ethers";
import { generateZerosFunction } from "../helpers/merkle-tree";
import { CommBankDotEth, USDC } from "../typechain-types";
import { getLeafAddedDetails, getPayloadDetails } from "../helpers/logs";
import { generateRandomSecret } from "../helpers/random";

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
  let circuit: Noir;
  let alice: Wallet;
  let bob: Wallet;
  let aliceRSA: KeyPair;
  let bobRSA: KeyPair;
  let usdc: USDC;
  let commbank: CommBankDotEth;

  before(async () => {
    rsa = RSA();
    ({ circuit, noir, backend, alice, bob, aliceRSA, bobRSA, usdc, commbank } =
      await getTestingAPI());

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
    console.log(await usdc.balanceOf(alice.address));
    // approve commbank.eth to move USDC for the user
    await usdc
      .connect(alice)
      .approve(await commbank.getAddress(), parseUnits("1000000", 6));

    const depositAmount = 69_420n;

    // Create a proper big-endian byte array from the number
    const amount = new Uint8Array(32);
    // Convert to big-endian representation (most significant byte first)
    let tempAmount = depositAmount;
    for (let i = 31; i >= 0; i--) {
      amount[i] = Number(tempAmount & 0xffn);
      tempAmount = tempAmount >> 8n;
    }

    const assetId = convertFromHexToArray(await usdc.getAddress());

    const aliceRSASecret = `0x${Array.from(aliceRSA.public_key).join("")}`;

    const aliceOwnerPubKey = rsa.generate_signature_from_key(
      aliceRSASecret,
      aliceRSA.private_key,
    );

    const aliceSignatureCommitment = JSON.parse(
      `[${aliceOwnerPubKey.hash}]`,
    ) as number[];

    const noteSecret = generateRandomSecret();

    console.log(noteSecret);

    const noteHash = keccak256(
      Uint8Array.from([
        ...aliceSignatureCommitment,
        ...amount,
        ...assetId,
        ...noteSecret,
      ]),
    );

    const input = {
      note_secret: Array.from(noteSecret).map((item) => item.toString()),
      hash: Array.from(convertFromHexToArray(noteHash)).map((item) =>
        item.toString(),
      ),
      amount: depositAmount.toString(), // Convert bigint to number for Noir
      amount_array: Array.from(amount).map((item) => item.toString()),
      // pub key is RSA.sign(public_key)
      pub_key: Array.from(aliceSignatureCommitment).map((item) =>
        item.toString(),
      ),
      asset_id: Array.from(assetId).map((item) => item.toString()),
    };

    // console.log(`let note_hash = [${convertFromHexToArray(noteHash)}];`);
    // console.log(`let note_secret = [${input.note_secret}];`);

    const { witness } = await noir.execute(input as unknown as InputMap);

    const { proof, publicInputs } = await backend.generateProof(witness, {
      keccak: true,
    });

    const payload = getPayload(noteSecret, assetId, amount);

    console.log(payload);

    const encryptedMessage = rsa.encrypt(payload, aliceRSA.public_key);

    console.log("looking for:", encryptedMessage.data);

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

    console.log(leafDetails);

    const encryptedBytes = getPayloadDetails(commbank, receipt!.logs);

    console.log(encryptedBytes);

    // Extract the LeafAdded event
  });

  it.skip("should output sol code for zeros() in merkle tree", async () => {
    generateZerosFunction();
  });
});
