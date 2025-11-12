import { getNoirClasses } from "@/helpers/objects/get-noir-classes";
import { getMerkleTree } from "@/helpers/objects/poseidon-merkle-tree";
import hre from "hardhat";
import CommbankDotEthModule from "@/ignition/modules/CommbankDotEth";
import TokensModule from "@/ignition/modules/Tokens";

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
