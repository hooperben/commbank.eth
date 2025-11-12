import { ethers } from "hardhat";

export const deployVerifiers = async () => {
  const [Deployer] = await ethers.getSigners();

  // Deploy ZKTranscriptLib library first (using fully qualified name from one verifier)
  const ZKTranscriptLibFactory = await ethers.getContractFactory(
    "contracts/verifiers/DepositVerifier.sol:ZKTranscriptLib",
    Deployer,
  );
  const zkTranscriptLib = await ZKTranscriptLibFactory.deploy();
  const zkTranscriptLibAddress = await zkTranscriptLib.getAddress();

  // Link each verifier with its specific library reference
  const DepositVerifierFactory = await ethers.getContractFactory(
    "DepositVerifier",
    {
      signer: Deployer,
      libraries: {
        "contracts/verifiers/DepositVerifier.sol:ZKTranscriptLib":
          zkTranscriptLibAddress,
      },
    },
  );
  const depositDeployment = await DepositVerifierFactory.deploy();

  const TransferVerifierFactory = await ethers.getContractFactory(
    "TransferVerifier",
    {
      signer: Deployer,
      libraries: {
        "contracts/verifiers/TransferVerifier.sol:ZKTranscriptLib":
          zkTranscriptLibAddress,
      },
    },
  );
  const transferDeployment = await TransferVerifierFactory.deploy();

  const WithdrawVerifierFactory = await ethers.getContractFactory(
    "WithdrawVerifier",
    {
      signer: Deployer,
      libraries: {
        "contracts/verifiers/WithdrawVerifier.sol:ZKTranscriptLib":
          zkTranscriptLibAddress,
      },
    },
  );
  const withdrawDeployment = await WithdrawVerifierFactory.deploy();

  const WarpVerifierFactory = await ethers.getContractFactory("WarpVerifier", {
    signer: Deployer,
    libraries: {
      "contracts/verifiers/WarpVerifier.sol:ZKTranscriptLib":
        zkTranscriptLibAddress,
    },
  });
  const warpVerifierDeployment = await WarpVerifierFactory.deploy();

  return {
    deposit: await depositDeployment.getAddress(),
    transfer: await transferDeployment.getAddress(),
    withdraw: await withdrawDeployment.getAddress(),
    warp: await warpVerifierDeployment.getAddress(),
  };
};
