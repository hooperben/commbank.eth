import CommbankDotEthModule from "@/ignition/modules/CommbankDotEth";
import { network } from "hardhat";

async function main() {
  const connection = await network.connect();
  const [deployer] = await connection.ethers.getSigners();

  console.log(deployer.address);

  const { commbankDotEth } =
    await connection.ignition.deploy(CommbankDotEthModule);

  const recipient = "0x6e400024D346e8874080438756027001896937E3";

  const tx = await commbankDotEth.grantRole(
    await commbankDotEth.DEPOSIT_ROLE(),
    recipient,
  );

  console.log(tx);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
