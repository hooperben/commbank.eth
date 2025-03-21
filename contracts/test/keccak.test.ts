import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Lock", function () {
  async function deployKeccak256() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Keccak256Proof = await hre.ethers.getContractFactory(
      "Keccak256Proof",
    );
    const keccak256Proof = await Keccak256Proof.deploy();

    return { keccak256Proof, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { keccak256Proof, owner } = await loadFixture(deployKeccak256);

      const test = await keccak256Proof.keccakTest();

      console.log(test);

      const hexWithoutPrefix = test.slice(2); // Remove '0x' prefix
      const uint8Array = [];

      for (let i = 0; i < hexWithoutPrefix.length; i += 2) {
        const byte = parseInt(hexWithoutPrefix.substr(i, 2), 16);
        uint8Array.push(byte);
      }

      console.log("Uint8 Array:", uint8Array);
    });
  });
});
