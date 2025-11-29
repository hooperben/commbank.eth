import { getNoirClasses } from "@/helpers/objects/get-noir-classes";
import { getMerkleTree } from "@/helpers/objects/poseidon-merkle-tree";
import CommbankDotEthModule from "@/ignition/modules/CommbankDotEth";
import TokensModule from "@/ignition/modules/Tokens";
import { ethers } from "ethers";
import hre from "hardhat";
import Poseidon2HuffJson from "../contracts/utils/Poseidon2Huff.json";

export const getTestingAPI = async () => {
  const connection = await hre.network.connect();
  const Signers = await connection.ethers.getSigners();

  const deployer1Secret =
    "0x1234567890123456789012345678901234567890123456789012345678901234";
  const deployer2Secret =
    "0x9876543210987654321098765432109876543210987654321098765432109876";

  const { usdcDeployment, fourDecDeployment } =
    await connection.ignition.deploy(TokensModule);

  const { commbankDotEth } =
    await connection.ignition.deploy(CommbankDotEthModule);

  // As the poseidon2 huff bytecode was prebuilt, we have to assemble the factory like this
  const poseidon2HuffFactory = new ethers.ContractFactory(
    [],
    Poseidon2HuffJson.bytecode,
    Signers[0],
  );
  const poseidon2Huff = await poseidon2HuffFactory.deploy();
  await poseidon2Huff.waitForDeployment();
  const poseidon2Address = await poseidon2Huff.getAddress();

  // set the poseidon 2 hash address
  await commbankDotEth.setPoseidon(poseidon2Address);

  const {
    depositNoir,
    depositBackend,
    transferNoir,
    transferBackend,
    withdrawNoir,
    withdrawBackend,
    warpNoir,
    warpBackend,
  } = getNoirClasses();

  const tree = await getMerkleTree();

  return {
    commbankDotEth,
    usdcDeployment,
    fourDecDeployment,
    depositNoir,
    depositBackend,
    transferNoir,
    transferBackend,
    withdrawNoir,
    withdrawBackend,
    warpNoir,
    warpBackend,
    Signers,
    tree,
    deployer1Secret,
    deployer2Secret,
  };
};
