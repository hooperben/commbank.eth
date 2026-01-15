// sepolia 0x185D905Cd0262aDB6a5146C38AD6a718988272dc
// arb sepolia 0x7A8ee7caab52782547341c3A6a0aA29aC4f60Aa3
import CommbankDotEthModule from "@/ignition/modules/CommbankDotEth";
import hre, { network } from "hardhat";

const getPosedion = (chainId: number) => {
  if (chainId === 11155111) {
    return "0x185D905Cd0262aDB6a5146C38AD6a718988272dc";
  }
  if (chainId === 421614) {
    return "0x7A8ee7caab52782547341c3A6a0aA29aC4f60Aa3";
  }
};

async function main() {
  const connection = await network.connect();
  const [deployer] = await connection.ethers.getSigners();

  console.log(deployer.address);

  const { commbankDotEth } =
    await connection.ignition.deploy(CommbankDotEthModule);

  console.log(connection.networkConfig.chainId);

  if (!connection.networkConfig.chainId)
    throw new Error("ERRR missing chainId");

  const posedion = getPosedion(connection.networkConfig.chainId);

  const tx = await commbankDotEth.setPoseidon(posedion);

  console.log(tx);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
