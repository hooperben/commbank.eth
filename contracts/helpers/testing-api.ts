import { Noir } from "@noir-lang/noir_js";
import { readFileSync } from "fs";
import { resolve } from "path";
import { UltraHonkBackend } from "@aztec/bb.js";
import hre, { ethers } from "hardhat";

export const getTestingAPI = async <T = UltraHonkBackend>(
  backendClass?: new (bytecode: string) => T,
) => {
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

  return { circuit, noir, backend, alice };
};
