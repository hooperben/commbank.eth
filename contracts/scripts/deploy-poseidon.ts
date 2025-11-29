import { ethers } from "ethers";
import { network } from "hardhat";
import Poseidon2HuffJson from "../contracts/utils/Poseidon2Huff.json";

async function main() {
  console.log("hey");

  const connection = await network.connect();
  const [deployer] = await connection.ethers.getSigners();

  console.log(deployer.address);

  // As the poseidon2 huff bytecode was prebuilt, we have to assemble the factory like this
  const poseidon2HuffFactory = new ethers.ContractFactory(
    [],
    Poseidon2HuffJson.bytecode,
    deployer,
  );
  const poseidon2Huff = await poseidon2HuffFactory.deploy();
  await poseidon2Huff.waitForDeployment();
  const poseidon2Address = await poseidon2Huff.getAddress();

  console.log(poseidon2Address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
