import { UltraHonkBackend } from "@aztec/bb.js";
import fs from "fs";
import hre, { ethers } from "hardhat";
import { getNoir } from "./get-noir";
import { getEmptyTree } from "./merkle-tree";
import RSA from "./rsa";

const RSA_ACCOUNTS = ["alice", "bob"];
const RSA_ACCOUNT_PATH = "./const/";

export const formatUint8Array = (inputArray: Uint8Array) =>
  Array.from(inputArray.map((item) => Number(item)));

export const numberToUint8Array = (num: bigint) => {
  const amount = new Uint8Array(32);
  // Convert to big-endian representation (most significant byte first)
  let tempAmount = num;
  for (let i = 31; i >= 0; i--) {
    amount[i] = Number(tempAmount & 0xffn);
    tempAmount = tempAmount >> 8n;
  }

  return amount;
};

export const getTestingAPI = async <T = UltraHonkBackend>(
  backendClass?: new (bytecode: string) => T,
) => {
  const rsa = RSA();

  const [aliceRSA, bobRSA] = RSA_ACCOUNTS.map((item) => {
    const parsedJson = JSON.parse(
      fs.readFileSync(`${RSA_ACCOUNT_PATH}${item}.json`).toString(),
    );
    const RSAFormed = {
      private_key: new Uint8Array(parsedJson.private_key.map(Number)),
      public_key: new Uint8Array(parsedJson.public_key.map(Number)),
    };

    const restoredKeyPair = new rsa.KeyPair(
      RSAFormed.private_key,
      RSAFormed.public_key,
    );

    return restoredKeyPair;
  });

  const { noir, backend } = await getNoir(
    "../keccak-circuits/deposit/target/circuits.json",
    backendClass,
  );

  const { noir: transactNoir, backend: transactBackend } = await getNoir(
    "../keccak-circuits/transact/target/transact.json",
    backendClass,
  );

  const { noir: withdrawNoir, backend: withdrawBackend } = await getNoir(
    "../keccak-circuits/withdraw/target/withdraw.json",
    backendClass,
  );

  const [funder] = await hre.ethers.getSigners();

  const alice_private_key =
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  const bob_private_key =
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  const charlie_private_key =
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";

  const alice = new ethers.Wallet(alice_private_key, hre.ethers.provider);
  const bob = new ethers.Wallet(bob_private_key, hre.ethers.provider);
  const charlie = new ethers.Wallet(charlie_private_key, hre.ethers.provider);

  await funder.sendTransaction({
    to: alice.address,
    value: ethers.parseEther("1000.0"),
  });

  await funder.sendTransaction({
    to: bob.address,
    value: ethers.parseEther("1000.0"),
  });

  await funder.sendTransaction({
    to: charlie.address,
    value: ethers.parseEther("1000.0"),
  });

  // CONTRACTS
  const Keccak256Proof = await hre.ethers.getContractFactory("Keccak256Proof");
  const keccak256Proof = await Keccak256Proof.deploy();

  const USDCMock = await hre.ethers.getContractFactory("USDC");
  const usdc = await USDCMock.deploy();

  const NoteVerifier = await hre.ethers.getContractFactory("NoteVerifier");
  const noteVerifier = await NoteVerifier.deploy();

  const TransactVerifier = await hre.ethers.getContractFactory(
    "TransactVerifier",
  );
  const transactVerifier = await TransactVerifier.deploy();

  const WithdrawVerifier = await hre.ethers.getContractFactory(
    "WithdrawVerifier",
  );
  const withdrawVerifier = await WithdrawVerifier.deploy();

  const CommBank = await hre.ethers.getContractFactory("CommBankDotEth");
  const commbank = await CommBank.deploy(
    await noteVerifier.getAddress(),
    await transactVerifier.getAddress(),
    await withdrawVerifier.getAddress(),
  );

  const tree = getEmptyTree();

  return {
    noir,
    backend,
    transactNoir,
    transactBackend,
    withdrawNoir,
    withdrawBackend,
    alice,
    bob,
    aliceRSA,
    bobRSA,
    keccak256Proof,
    usdc,
    commbank,
    tree,
  };
};
