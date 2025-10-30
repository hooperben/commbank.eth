import { PrivateStargateFinance__factory } from "@/typechain-types";
import { Contract } from "ethers";
import { ethers } from "hardhat";

export const deployPSF = async (
  lzEndpoint: string,
  owner: string,
  depositVerifier: string,
  transferVerifier: string,
  withdrawVerifer: string,
  warpVerifier: string,
) => {
  const [Deployer] = await ethers.getSigners();

  const PrivateStargateFinanceFactory = await ethers.getContractFactory(
    "PrivateStargateFinance",
    Deployer,
  );

  const privateStargateFinance = await PrivateStargateFinanceFactory.deploy(
    lzEndpoint,
    owner,
    depositVerifier,
    transferVerifier,
    withdrawVerifer,
    warpVerifier,
  );

  const privateStargateFinanceDeployment =
    await privateStargateFinance.waitForDeployment();

  const privateStargateContract = new Contract(
    await privateStargateFinanceDeployment.getAddress(),
    PrivateStargateFinance__factory.abi,
    Deployer,
  );

  return privateStargateContract;
};
