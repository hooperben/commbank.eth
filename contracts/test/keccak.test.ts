import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { getTestingAPI } from "../helpers/testing-api";
import { InputMap, Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";

describe("Lock", function () {
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

  before(async () => {
    ({ circuit, noir, backend } = await getTestingAPI());
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
  });
});
