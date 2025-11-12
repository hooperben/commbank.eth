import { network } from "hardhat";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { expect } from "chai";
import { ethers } from "ethers";
import Poseidon2Module from "@/ignition/modules/Poseidon2";

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

    const expected = poseidon2Hash([0n, 0n]);

    expect(hash).eq(expected);
  });
});
