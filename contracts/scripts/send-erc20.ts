import TokensModule from "@/ignition/modules/Tokens";
import { network } from "hardhat";

async function main() {
  const connection = await network.connect();
  const [deployer] = await connection.ethers.getSigners();

  console.log(deployer.address);

  const { auddDeployment } = await connection.ignition.deploy(TokensModule);

  console.log(auddDeployment);

  const recipient = "0x6e400024D346e8874080438756027001896937E3";

  const tx = await auddDeployment.transfer(recipient, 420_000_000n);

  console.log(tx);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
