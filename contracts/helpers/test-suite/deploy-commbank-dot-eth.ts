import { CommBankDotEth__factory } from "@/typechain-types";
import { ethers } from "hardhat";

export const deployCommbankDotEth = async (
  depositVerifier: string,
  transferVerifier: string,
  withdrawVerifer: string,
) => {
  const [Deployer] = await ethers.getSigners();

  const commbankDotEthFactory = await ethers.getContractFactory(
    "CommBankDotEth",
    Deployer,
  );

  const commbankDotEth = await commbankDotEthFactory.deploy(
    depositVerifier,
    transferVerifier,
    withdrawVerifer,
  );

  const commbankDotEthDeployment = await commbankDotEth.waitForDeployment();

  const commbankDotEthContract = new ethers.Contract(
    await commbankDotEthDeployment.getAddress(),
    CommBankDotEth__factory.abi,
    Deployer,
  );

  return commbankDotEthContract;
};
