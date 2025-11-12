import { ethers } from "hardhat";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import type { Poseidon2Yul } from "../typechain-types";
import { expect } from "chai";

describe.only("testing the yul poseidon implementation", () => {
  let poseidonYul: Poseidon2Yul;

  before(async () => {
    const factory = await ethers.getContractFactory("Poseidon2Yul");
    const deployed = await factory.deploy();
    poseidonYul = await deployed.waitForDeployment();
  });

  it("should hash [0, 0] inputs", async () => {
    const [signer] = await ethers.getSigners();

    // Encode the inputs as calldata (two uint256 values)
    const input1 = 0n;
    const input2 = 0n;

    // Create calldata with two uint256 values (64 bytes total)
    const calldata = ethers.AbiCoder.defaultAbiCoder().encode(
      ["uint256", "uint256"],
      [input1, input2],
    );

    // Call the fallback function with the encoded data (staticcall)
    const result = await signer.call({
      to: await poseidonYul.getAddress(),
      data: calldata,
    });

    // The result is returned as bytes32, decode it as uint256
    const hash = BigInt(result);

    const expected = poseidon2Hash([0n, 0n]);

    expect(hash).eq(expected);
  });
});
