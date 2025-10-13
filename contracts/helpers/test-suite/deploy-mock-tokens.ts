import { zeroPadValue } from "ethers";
import { ethers, network } from "hardhat";

export const BASE_EID = 1;
export const REMOTE_EID = 2;

const setUpLZ = async () => {
  if (network.name !== "hardhat" && network.name !== "localhost")
    throw new Error("Called this one wrong");
  // DEPLOY LZ TEST SUITE
  const EndpointV2MockFactory = await ethers.getContractFactory(
    "EndpointV2Mock",
  );

  const baseEndpoint = await EndpointV2MockFactory.deploy(BASE_EID);
  const remoteEndpoint = await EndpointV2MockFactory.deploy(REMOTE_EID);

  return {
    baseEndpoint,
    remoteEndpoint,
  };
};

export const deployMockTokens = async () => {
  const [Deployer] = await ethers.getSigners();
  const USDCFactory = await ethers.getContractFactory("USDC");
  const usdcDeployment = await USDCFactory.deploy();

  const LZOFTFactory = await ethers.getContractFactory("LZOFT");

  const { baseEndpoint, remoteEndpoint } = await setUpLZ();

  const lzOFTDeploymentBase = await LZOFTFactory.deploy(
    "XXX",
    "XXX",
    await baseEndpoint.getAddress(),
    Deployer.address,
  );

  const lzOFTDeploymentRemote = await LZOFTFactory.deploy(
    "YYY",
    "YYY",
    await remoteEndpoint.getAddress(),
    Deployer.address,
  );

  // Setting destination endpoints in the LZEndpoint mock for each MyOApp instance
  // (this is not needed in prod)
  await baseEndpoint.setDestLzEndpoint(
    await lzOFTDeploymentRemote.getAddress(),
    await remoteEndpoint.getAddress(),
  );
  await remoteEndpoint.setDestLzEndpoint(
    await lzOFTDeploymentBase.getAddress(),
    await baseEndpoint.getAddress(),
  );

  // wire up

  // Setting each MyOApp instance as a peer of the other
  await lzOFTDeploymentBase.setPeer(
    REMOTE_EID,
    zeroPadValue(await lzOFTDeploymentRemote.getAddress(), 32),
  );
  await lzOFTDeploymentRemote.setPeer(
    BASE_EID,
    zeroPadValue(await lzOFTDeploymentBase.getAddress(), 32),
  );

  const FourDecFactory = await ethers.getContractFactory("FourDEC");
  const fourDecDeployment = await FourDecFactory.deploy();

  return {
    usdcDeployment,
    lzOFTDeploymentBase,
    lzOFTDeploymentRemote,
    baseEndpoint,
    remoteEndpoint,
    fourDecDeployment,
  };
};
