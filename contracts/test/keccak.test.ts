import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { getTestingAPI } from "../helpers/testing-api";
import { InputMap, Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Wallet, keccak256 } from "ethers";
import crypto from "crypto";
import { Keccak256Proof } from "../typechain-types";

describe("Testing keccak hash utility in noir => sol", function () {
  let keccak256Proof: Keccak256Proof;
  let backend: UltraHonkBackend;
  let noir: Noir;
  let circuit: Noir;
  let alice: Wallet;
  let bob: Wallet;

  before(async () => {
    ({ keccak256Proof, circuit, noir, backend, alice, bob } =
      await getTestingAPI());
  });

  describe("Deployment", function () {
    it("should run", async function () {
      const test = await keccak256Proof.keccakTest();

      const hexWithoutPrefix = test.slice(2); // Remove '0x' prefix
      const uint8Array = [];

      for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
        const byte = parseInt(hexWithoutPrefix.substr(i, 2), 16);
        uint8Array.push(byte);
      }

      // const input = {
      //   pre_image: [
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //     "0x0",
      //   ],
      //   output: [
      //     "0x29",
      //     "0xd",
      //     "0xec",
      //     "0xd9",
      //     "0x54",
      //     "0x8b",
      //     "0x62",
      //     "0xa8",
      //     "0xd6",
      //     "0x3",
      //     "0x45",
      //     "0xa9",
      //     "0x88",
      //     "0x38",
      //     "0x6f",
      //     "0xc8",
      //     "0x4b",
      //     "0xa6",
      //     "0xbc",
      //     "0x95",
      //     "0x48",
      //     "0x40",
      //     "0x8",
      //     "0xf6",
      //     "0x36",
      //     "0x2f",
      //     "0x93",
      //     "0x16",
      //     "0xe",
      //     "0xf3",
      //     "0xe5",
      //     "0x63",
      //   ],
      // };

      // const { witness } = await noir.execute(input);

      // const { proof, publicInputs } = await backend.generateProof(witness, {
      //   keccak: true,
      // });

      // const isValid = await backend.verifyProof({ proof, publicInputs });
      // await keccak256Proof.testProof(proof.slice(4), publicInputs);
    });

    const convertFromHexToArray = (rawInput: string): Uint8Array => {
      const formattedInput = rawInput.startsWith("0x")
        ? rawInput.slice(2)
        : rawInput;

      const evenFormattedInput =
        formattedInput.length % 2 === 0 ? formattedInput : "0" + formattedInput;

      return Uint8Array.from(Buffer.from(evenFormattedInput, "hex"));
    };

    it("should construct a leaf hash", async () => {
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

      await keccak256Proof.testProof(proof.slice(4), publicInputs);
    });
  });
});
