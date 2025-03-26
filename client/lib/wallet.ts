"use client";

import { keccak256 } from "ethers";
import type { KeyPair } from "../wasm/signature_gen";
import {
  initDB,
  storeEVMAccount,
  getAllEVMAccounts,
  storeRSAKeyPair,
  getAllRSAKeyPairs,
} from "./db";

export const storeEVMAccountPublicKey = async (
  address: string,
  username: string,
) => {
  // Initialize database if needed
  await initDB();

  console.log(address);

  // Store the account data (no private key)
  await storeEVMAccount({
    username,
    address,
    createdAt: Date.now(),
  });

  return address;
};

// Get all EVM accounts from IndexedDB
export const getAllEVMAccountsFromDB = (): Promise<
  Array<{ address: string; createdAt: number; username: string }>
> => {
  return getAllEVMAccounts();
};

// Get EVM account by username
export const getEVMAccountByUsername = (
  username: string,
): Promise<{ username: string; address: string; createdAt: number } | null> => {
  return new Promise((resolve, reject) => {
    getAllEVMAccounts()
      .then((accounts) => {
        const account = accounts.find((acc) => acc.username === username);
        resolve(account || null);
      })
      .catch((error) => reject(error));
  });
};

// Need to use dynamic import since WASM can't be used during SSR
export const generateAndStoreRSAAccount = async (
  secret: string,
  username: string,
) => {
  // Client-side only code
  if (typeof window === "undefined") {
    throw new Error("RSA account generation can only be performed in browser");
  }

  // Initialize database if needed
  await initDB();

  // Dynamically import the WASM module
  const wasmModule = await import("../wasm/signature_gen");

  // Initialize the WASM module with the correct path to the .wasm file
  // For Next.js 13+, WASM files should be in the public directory
  await wasmModule.default("/signature_gen_bg.wasm");
  // Note: The path is relative to your public directory

  // Create RSA key pair
  const keyPair: KeyPair = wasmModule.create_key_pair(secret, 2048, 65537);

  const circuitPubKey = keccak256(keyPair.private_key);

  // Store RSA key pair in IndexedDB
  await storeRSAKeyPair({
    username,
    circuitPubKey,
    publicKey: keyPair.public_key,
    createdAt: Date.now(),
  });

  return keyPair;
};

// Get all RSA key pairs from IndexedDB
// TODO typing is pretty gross
export const getAllRSAKeyPairsFromDB = (): Promise<any[]> => {
  return getAllRSAKeyPairs();
};

// Get RSA key pair by username
export const getRSAKeyPairByUsername = (
  username: string,
): Promise<{
  username: string;
  circuitPubKey: string;
  publicKey: Uint8Array;
  createdAt: number;
} | null> => {
  return new Promise((resolve, reject) => {
    getAllRSAKeyPairs()
      .then((keyPairs) => {
        const keyPair = keyPairs.find((kp) => kp.username === username);
        resolve(keyPair || null);
      })
      .catch((error) => reject(error));
  });
};
