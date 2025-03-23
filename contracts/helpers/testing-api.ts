import { Noir } from "@noir-lang/noir_js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { UltraHonkBackend } from "@aztec/bb.js";
import hre, { ethers } from "hardhat";
import fs from "fs";
import RSA from "./rsa";
import { getEmptyTree } from "./merkle-tree";

const RSA_ACCOUNTS = ["alice", "bob"];
const RSA_ACCOUNT_PATH = "./const/";

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

  const keccakFile = readFileSync(
    resolve("../circuits/target/circuits.json"),
    "utf-8",
  );
  const keccakNoteCircuit = JSON.parse(keccakFile);
  const circuit = new Noir(keccakNoteCircuit);

  backendClass ||= await (async () => {
    const { UltraHonkBackend } = await import("@aztec/bb.js");
    return UltraHonkBackend as unknown as NonNullable<typeof backendClass>;
  })();

  const noir = new Noir(keccakNoteCircuit);
  const backend = new backendClass(keccakNoteCircuit.bytecode);

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

  const CommBank = await hre.ethers.getContractFactory("CommBankDotEth");
  const commbank = await CommBank.deploy();

  const tree = getEmptyTree();

  return {
    circuit,
    noir,
    backend,
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
