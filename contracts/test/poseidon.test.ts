import { network } from "hardhat";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { expect } from "chai";
import { ethers } from "ethers";
import Poseidon2Module from "@/ignition/modules/Poseidon2";
import Poseidon2HuffJson from "../contracts/utils/Poseidon2Huff.json";

describe("testing the yul poseidon implementation", () => {
  let poseidon2Yul: ethers.Contract;
  let signer: ethers.Signer;

  before(async () => {
    const connection = await network.connect();
    [signer] = await connection.ethers.getSigners();

    ({ poseidon2: poseidon2Yul } =
      await connection.ignition.deploy(Poseidon2Module));
  });

  it("should hash [0, 0] inputs", async () => {
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
      to: await poseidon2Yul.getAddress(),
      data: calldata,
    });

    // The result is returned as bytes32, decode it as uint256
    const hash = BigInt(result);
    const expected = poseidon2Hash([input1, input2]);

    expect(hash).eq(expected);
  });

  it("should take the compiled huff code and work", async () => {
    const factory = new ethers.ContractFactory(
      [],
      Poseidon2HuffJson.bytecode,
      signer,
    );

    const poseidon2Huff = await factory.deploy();
    await poseidon2Huff.waitForDeployment();

    const address = await poseidon2Huff.getAddress();

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
      to: address,
      data: calldata,
    });

    const expected = poseidon2Hash([input1, input2]);

    expect(BigInt(expected)).eq(BigInt(result));
  });
});
