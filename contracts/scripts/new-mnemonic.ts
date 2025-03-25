import { ethers } from "hardhat";

async function main() {
  // Step 1: Create a random wallet
  const randomWallet = ethers.Wallet.createRandom();

  console.log("=== Original Wallet ===");
  console.log(`Mnemonic: ${randomWallet.mnemonic?.phrase}`);
  console.log(`Path: ${randomWallet.path}`);
  console.log(`Private Key: ${randomWallet.privateKey}`);
  console.log(`Address: ${randomWallet.address}`);
  console.log("\n");

  // Step 2: Create a new wallet using the same mnemonic phrase and path
  // This proves that the private key is derived from the mnemonic and path
  const derivedWallet = ethers.Wallet.fromPhrase(
    randomWallet.mnemonic!.phrase,
    // randomWallet.path,
  );

  console.log("=== Derived Wallet ===");
  console.log(`Derived Private Key: ${derivedWallet.privateKey}`);
  console.log(`Derived Address: ${derivedWallet.address}`);
  console.log("\n");

  // // Step 3: Verify they're the same
  // console.log("=== Verification ===");
  // console.log(
  //   `Keys match: ${randomWallet.privateKey === derivedWallet.privateKey}`,
  // );
  // console.log(
  //   `Addresses match: ${randomWallet.address === derivedWallet.address}`,
  // );

  // // Step 4: Show what happens if we use a different path
  // const alternatePathWallet = ethers.Wallet.fromMnemonic(
  //   randomWallet.mnemonic!.phrase,
  //   "m/44'/60'/0'/0/1", // Changed the last digit from 0 to 1
  // );

  // console.log("\n=== Different Path Wallet ===");
  // console.log(`Alternate Path: m/44'/60'/0'/0/1`);
  // console.log(`Alternate Private Key: ${alternatePathWallet.privateKey}`);
  // console.log(`Alternate Address: ${alternatePathWallet.address}`);
  // console.log(
  //   `Keys match original: ${
  //     randomWallet.privateKey === alternatePathWallet.privateKey
  //   }`,
  // );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
