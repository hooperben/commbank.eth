import { deployMockTokens } from "@/helpers/test-suite/deploy-mock-tokens";
import { deployVerifiers } from "@/helpers/test-suite/deploy-verifiers";
import { getNoirClasses } from "@/helpers/test-suite/get-noir-classes";
import { getMerkleTree } from "@/helpers/test-suite/merkle";
import { CommBankDotEth } from "@/typechain-types";
import { ethers } from "hardhat";
import { loadPoseidon } from "./load-poseidon";
import { deployCommbankDotEth } from "./test-suite/deploy-commbank-dot-eth";

export const getTestingAPI = async () => {
  const Signers = await ethers.getSigners();
  const verifiers = await deployVerifiers();

  const deployer1Secret =
    "0x1234567890123456789012345678901234567890123456789012345678901234";
  const deployer2Secret =
    "0x9876543210987654321098765432109876543210987654321098765432109876";

  const poseidonHash = await loadPoseidon();

  const {
    usdcDeployment,
    lzOFTDeploymentBase,
    lzOFTDeploymentRemote,
    fourDecDeployment,
  } = await deployMockTokens();

  const commbankDotEth = (await deployCommbankDotEth(
    verifiers.deposit,
    verifiers.transfer,
    verifiers.withdraw,
  )) as unknown as CommBankDotEth;

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
    lzOFTDeploymentBase,
    lzOFTDeploymentRemote,
    depositNoir,
    depositBackend,
    transferNoir,
    transferBackend,
    withdrawNoir,
    withdrawBackend,
    warpNoir,
    warpBackend,
    Signers,
    poseidonHash,
    tree,
    deployer1Secret,
    deployer2Secret,
  };
};
