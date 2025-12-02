import TokensModule from "@/ignition/modules/Tokens";
import { parseEther } from "ethers";
import { network } from "hardhat";

const devChrome = "0x6b828B87414369520B215C107D2617e5749709d9";
const devPhone = "0xC02c29D1927978FCBA8a4D9D7771a5badF504cE6";

// iphone mainnet
// https://commbank.eth.limo/#/share?address=0xf7E3157831b2895384Ca5A99bb42B840D7012c4C&privateAddress=0x25f80d46818f40574018c91690139229cb9606533df0af90d5ed4c4fca479c31&envelope=0x042efac93ff3aca8bb34669c614ae8cafd631c158560225d38662a26c6584aaf85114c29fc98b3bc5a5cb7769db8ed112ceda011e9ae421d6c5d47418c4fd3883f&nickname=Iphone+mainnet.89

async function main() {
  const connection = await network.connect();
  const [deployer] = await connection.ethers.getSigners();

  console.log(deployer.address);

  const { auddDeployment } = await connection.ignition.deploy(TokensModule);

  console.log(auddDeployment);

  const recipient = "0x6e400024D346e8874080438756027001896937E3";

  const tx = await auddDeployment.transfer(devPhone, 420_000_000n);

  await tx.wait();

  console.log(tx);

  const tx2 = await auddDeployment.transfer(devChrome, 122_210_000n);

  await tx2.wait();

  console.log(tx2);

  const eth = parseEther("0.007");

  const tx3 = await deployer.sendTransaction({ to: devChrome, value: eth });
  await tx3.wait();

  const tx4 = await deployer.sendTransaction({ to: devPhone, value: eth });
  await tx4.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
