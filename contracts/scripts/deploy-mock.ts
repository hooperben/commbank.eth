import { ethers } from "hardhat";
import { ERC20__factory, USDC } from "../typechain-types";

async function main() {
  const [Deployer] = await ethers.getSigners();
  // const factory = await ethers.getContractFactory("USDC");

  // const deploy = await factory.deploy();

  // console.log(deploy);

  const usdc = new ethers.Contract(
    "0x9bb68C037BFCE2A8ecF55fE165b1F2A59593A220",
    ERC20__factory.abi,
    Deployer,
  ) as unknown as USDC;

  const tx = await usdc.transfer(
    "0x800A6FC6cfCd48A0330d352B7e3aA777750eaC3e",
    ethers.parseUnits("420", 6),
  );

  await tx.wait(2);

  const second = await Deployer.sendTransaction({
    to: "0x800A6FC6cfCd48A0330d352B7e3aA777750eaC3e",
    value: ethers.parseEther("0.01"),
  });

  await second.wait(2);

  console.log("done");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
