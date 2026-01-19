import CommbankDotEthModule from "@/ignition/modules/CommbankDotEth";
import { network } from "hardhat";

async function main() {
  const connection = await network.connect();
  const [deployer] = await connection.ethers.getSigners();

  console.log(deployer.address);

  const { commbankDotEth } =
    await connection.ignition.deploy(CommbankDotEthModule);

  const recipient = "0x6e400024D346e8874080438756027001896937E3";

  const depositRole = await commbankDotEth.DEPOSIT_ROLE();
  const gasEstimate = await commbankDotEth.grantRole.estimateGas(
    depositRole,
    recipient,
  );
  const doubledGas = gasEstimate * 2n;

  // Get fee data and set higher priority fees for Sepolia
  const provider = deployer.provider;
  if (!provider) throw new Error("No provider available");
  const feeData = await provider.getFeeData();

  // Use higher priority fees (3x) to ensure transaction goes through on Sepolia
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas
    ? feeData.maxPriorityFeePerGas * 5n
    : undefined;
  const maxFeePerGas = feeData.maxFeePerGas
    ? feeData.maxFeePerGas * 5n
    : undefined;

  console.log(`Gas estimate: ${gasEstimate.toString()}`);
  console.log(`Using doubled gas: ${doubledGas.toString()}`);
  if (maxPriorityFeePerGas) {
    console.log(
      `Max priority fee per gas: ${maxPriorityFeePerGas.toString()} wei`,
    );
  }
  if (maxFeePerGas) {
    console.log(`Max fee per gas: ${maxFeePerGas.toString()} wei`);
  }

  const tx = await commbankDotEth.grantRole(depositRole, recipient, {
    gasLimit: doubledGas,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  console.log(tx);

  await tx.wait();

  console.log("done");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
