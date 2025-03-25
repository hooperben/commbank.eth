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
    "0xC3c30d94db48b33842Ee612FcD53Af466b72f1c5",
    ethers.parseUnits("414", 6),
  );

  console.log(tx);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
