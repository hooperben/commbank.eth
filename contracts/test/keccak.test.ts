import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { getTestingAPI } from "../helpers/testing-api";
import { InputMap, Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Wallet, keccak256 } from "ethers";
import crypto from "crypto";

// Generate RSA key pairs using the private keys as seeds for reproducibility
function generateRSAKeysFromSeed(privateKeyHex) {
  // Use private key as seed for the RSA generation
  const seed = Buffer.from(privateKeyHex.slice(2), "hex");

  // Generate RSA keys (in actual production code, you'd use proper key derivation)
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { publicKey, privateKey };
}

describe.skip("Lock", function () {
  async function deployKeccak256() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Keccak256Proof = await hre.ethers.getContractFactory(
      "Keccak256Proof",
    );
    const keccak256Proof = await Keccak256Proof.deploy();

    return { keccak256Proof, owner, otherAccount };
  }

  let backend: UltraHonkBackend;
  let noir: Noir;
  let circuit: Noir;
  let alice: Wallet;
  let bob: Wallet;

  before(async () => {
    ({ circuit, noir, backend, alice, bob } = await getTestingAPI());
    console.log("noir stuff loaded");
  });

  describe("Deployment", function () {
    it("should run", async function () {
      const { keccak256Proof } = await loadFixture(deployKeccak256);

      const test = await keccak256Proof.keccakTest();

      const hexWithoutPrefix = test.slice(2); // Remove '0x' prefix
      const uint8Array = [];

      for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
        const byte = parseInt(hexWithoutPrefix.substr(i, 2), 16);
        uint8Array.push(byte);
      }

      const input = {
        pre_image: [
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
          "0x0",
        ],
        output: [
          "0x29",
          "0xd",
          "0xec",
          "0xd9",
          "0x54",
          "0x8b",
          "0x62",
          "0xa8",
          "0xd6",
          "0x3",
          "0x45",
          "0xa9",
          "0x88",
          "0x38",
          "0x6f",
          "0xc8",
          "0x4b",
          "0xa6",
          "0xbc",
          "0x95",
          "0x48",
          "0x40",
          "0x8",
          "0xf6",
          "0x36",
          "0x2f",
          "0x93",
          "0x16",
          "0xe",
          "0xf3",
          "0xe5",
          "0x63",
        ],
      };

      const { witness } = await noir.execute(input);

      const { proof, publicInputs } = await backend.generateProof(witness, {
        keccak: true,
      });

      // console.log(proof);
      // console.log(publicInputs);

      const isValid = await backend.verifyProof({ proof, publicInputs });

      console.log("isValid", isValid);

      await keccak256Proof.testProof(proof.slice(4), publicInputs);
    });

    const convertFromHexToArray = (rawInput: string): Uint8Array => {
      const formattedInput = rawInput.startsWith("0x")
        ? rawInput.slice(2)
        : rawInput;

      const evenFormattedInput =
        formattedInput.length % 2 === 0 ? formattedInput : "0" + formattedInput;

      return Uint8Array.from(Buffer.from(evenFormattedInput, "hex"));
    };

    it("testing rsa encrypt and decrypt", async () => {
      // Generate key pairs for Alice and Bob
      const aliceKeys = generateRSAKeysFromSeed(alice.privateKey);
      const bobKeys = generateRSAKeysFromSeed(bob.privateKey);

      console.log(bobKeys);

      console.log(
        "Alice public key (RSA):",
        aliceKeys.publicKey.substring(0, 64) + "...",
      );
      console.log(
        "Bob public key (RSA):",
        bobKeys.publicKey.substring(0, 64) + "...",
      );

      // Message to encrypt
      const message = "testing";
      console.log("Original message:", message);

      // Alice encrypts a message for Bob using Bob's public key
      const encryptedMessage = crypto.publicEncrypt(
        {
          key: bobKeys.publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        Buffer.from(message),
      );

      console.log(
        "Encrypted message (base64):",
        encryptedMessage.toString("base64"),
      );

      // Bob decrypts the message using his private key
      const decryptedMessage = crypto.privateDecrypt(
        {
          key: bobKeys.privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        },
        encryptedMessage,
      );

      const decryptedText = decryptedMessage.toString();
      console.log("Decrypted message:", decryptedText);

      // Verify decryption worked correctly
      if (decryptedText === message) {
        console.log("RSA encryption/decryption test passed!");
      } else {
        throw new Error("RSA encryption/decryption test failed!");
      }
    });

    it("should construct a leaf hash", async () => {
      const { keccak256Proof } = await loadFixture(deployKeccak256);

      const alicePubKey = keccak256(alice.privateKey);
      const depositAmount = 69_420n;

      // Create a proper big-endian byte array from the number
      const amount = new Uint8Array(32);
      // Convert to big-endian representation (most significant byte first)
      let tempAmount = depositAmount;
      for (let i = 31; i >= 0; i--) {
        amount[i] = Number(tempAmount & 0xffn);
        tempAmount = tempAmount >> 8n;
      }

      const depositAddress = "0x0000000000000000000000000000000000000000";
      const assetId = convertFromHexToArray(depositAddress);

      const noteHash = keccak256(
        Uint8Array.from([
          ...convertFromHexToArray(alicePubKey),
          ...amount,
          ...assetId,
        ]),
      );

      console.log("note hash: ", noteHash);
      console.log("user pub key: ", alicePubKey);

      const input = {
        hash: Array.from(convertFromHexToArray(noteHash)).map((item) =>
          item.toString(),
        ),
        amount: depositAmount.toString(), // Convert bigint to number for Noir
        amount_array: Array.from(amount).map((item) => item.toString()),
        pub_key: Array.from(convertFromHexToArray(alicePubKey)).map((item) =>
          item.toString(),
        ),
        asset_id: Array.from(assetId).map((item) => item.toString()),
      };

      // console.log(input);

      const { witness } = await noir.execute(input as unknown as InputMap);

      const { proof, publicInputs } = await backend.generateProof(witness, {
        keccak: true,
      });

      console.log(publicInputs.length);

      await keccak256Proof.testProof(proof.slice(4), publicInputs);
    });
  });
});
