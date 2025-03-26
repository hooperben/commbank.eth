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

  const NoteVerifier = await ethers.getContractFactory("NoteVerifier");
  const noteVerifier = await NoteVerifier.deploy();
  const noteVerifierDeploy = await noteVerifier.waitForDeployment();

  console.log("NOTE VERIFIER: ", noteVerifierDeploy);

  const TransactVerifier = await ethers.getContractFactory("TransactVerifier");
  const transactVerifier = await TransactVerifier.deploy();
  const transactVerifierDeploy = await transactVerifier.waitForDeployment();

  console.log("TRANSACT VERIFIER: ", transactVerifierDeploy);

  const WithdrawVerifier = await ethers.getContractFactory("WithdrawVerifier");
  const withdrawVerifier = await WithdrawVerifier.deploy();
  const withdrawVerifierDeploy = await withdrawVerifier.waitForDeployment();

  console.log("WITHDRAW VERIFIER: ", withdrawVerifierDeploy);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
