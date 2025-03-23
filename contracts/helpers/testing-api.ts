import { Noir } from "@noir-lang/noir_js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { UltraHonkBackend } from "@aztec/bb.js";
import hre, { ethers } from "hardhat";
import fs from "fs";
import RSA from "./rsa";
import { getEmptyTree } from "./merkle-tree";
import { getNoir } from "./get-noir";

const RSA_ACCOUNTS = ["alice", "bob"];
const RSA_ACCOUNT_PATH = "./const/";

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
    "../circuits/deposit/target/circuits.json",
    backendClass,
  );

  const { noir: transactNoir, backend: transactBackend } = await getNoir(
    "../circuits/transact/target/transact.json",
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
