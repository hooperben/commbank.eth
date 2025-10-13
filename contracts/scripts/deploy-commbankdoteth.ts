import { ethers } from "hardhat";
import { ERC20__factory } from "../typechain-types";

async function main() {
  const [Alice, Bob] = await ethers.getSigners();

  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const usdcContract = new ethers.Contract(USDC, ERC20__factory.abi, Alice);

  const usdcBalance = await usdcContract.balanceOf(Alice.address);

  console.log("usdc balance: ", ethers.formatUnits(usdcBalance, 6));

  const native = await Alice.provider.getBalance(Alice.address);

  console.log("native balance: ", ethers.formatEther(native));

  console.log(Alice.address);
  console.log(Bob.address);

  const CommBank = await ethers.getContractFactory("CommBankDotEth");
  const commbank = await CommBank.deploy(
    "0xA810A718114f568a5E90d6e877bE307a011Bb1de", // note verifier
    "0x569C08e5Ba7621E6EEE84A46ab25743C896920fB", // transact verifier
    "0x00D3502b58C93677259e9846110e1B316aFA07B4", // withdraw verifier
  );

  const commbankDeploy = await commbank.waitForDeployment();

  console.log("COMMBANK.ETH", commbankDeploy);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
