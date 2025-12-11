import CommbankDotEthModule from "@/ignition/modules/CommbankDotEth";
import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const { commbankDotEth } =
    await connection.ignition.deploy(CommbankDotEthModule);

  const depositVerifier = await commbankDotEth.depositVerifier();
  console.log("depositVerifier: ", depositVerifier);
  const transferVerifier = await commbankDotEth.transferVerifier();
  console.log("transferVerifier: ", transferVerifier);
  const withdrawVerifier = await commbankDotEth.withdrawVerifier();
  console.log("withdrawVerifier: ", withdrawVerifier);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
