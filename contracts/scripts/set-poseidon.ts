// sepolia 0x185D905Cd0262aDB6a5146C38AD6a718988272dc
import CommbankDotEthModule from "@/ignition/modules/CommbankDotEth";
import { network } from "hardhat";

async function main() {
  const connection = await network.connect();
  const [deployer] = await connection.ethers.getSigners();

  console.log(deployer.address);

  const { commbankDotEth } =
    await connection.ignition.deploy(CommbankDotEthModule);

  const posedion = "0x185D905Cd0262aDB6a5146C38AD6a718988272dc";

  const tx = await commbankDotEth.setPoseidon(posedion);

  console.log(tx);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
