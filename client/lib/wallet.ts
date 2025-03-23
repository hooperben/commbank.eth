"use client";

import { Wallet } from "ethers";
import type { KeyPair, SignatureResult } from "../wasm/signature_gen";
import { initDB } from "./db";

export const generateAndStoreEVMAccount = async (
  secret: string,
  username: string,
) => {
  const wallet = new Wallet(secret);

  // Initialize database if needed
  await initDB();

  console.log(username);

  // Store the account data (no private key)
  await storeEVMAccount({
    username,
    address: wallet.address,
    createdAt: Date.now(),
  });

  console.log(wallet.address);
  return wallet.address;
};

// Store EVM account in IndexedDB
export const storeEVMAccount = (account: {
  username: string;
  address: string;
  createdAt: number;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = window.indexedDB.databases().then((databases) => {
      const db = databases.find((db) => db.name === "commbankDB");
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const request = window.indexedDB.open("commbankDB", db.version);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["evm-accounts"], "readwrite");
        const store = transaction.objectStore("evm-accounts");
        const request = store.put(account);

        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(new Error("Failed to store EVM account"));

        transaction.oncomplete = () => db.close();
      };

      request.onerror = () => reject(new Error("Failed to open database"));
    });
  });
};

// Get all EVM accounts from IndexedDB
export const getAllEVMAccounts = (): Promise<
  Array<{ address: string; createdAt: number; username: string }>
> => {
  return new Promise((resolve, reject) => {
    const db = window.indexedDB.databases().then((databases) => {
      const db = databases.find((db) => db.name === "commbankDB");
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const request = window.indexedDB.open("commbankDB", db.version);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["evm-accounts"], "readonly");
        const store = transaction.objectStore("evm-accounts");
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(new Error("Failed to get EVM accounts"));

        transaction.oncomplete = () => db.close();
      };

      request.onerror = () => reject(new Error("Failed to open database"));
    });
  });
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

  // Store RSA key pair in IndexedDB
  await storeRSAKeyPair({
    username,
    publicKey: keyPair.public_key,
    privateKey: keyPair.private_key,
    createdAt: Date.now(),
  });

  const keys = await getRSAKeyPairByUsername(username);

  console.log(keys);

  console.log("RSA key pair generated and stored for:", username);
  return keyPair;
};

// Store RSA key pair in IndexedDB
export const storeRSAKeyPair = (keyPair: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    const db = window.indexedDB.databases().then((databases) => {
      const db = databases.find((db) => db.name === "commbankDB");
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const request = window.indexedDB.open("commbankDB", db.version);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["rsa_keys"], "readwrite");
        const store = transaction.objectStore("rsa_keys");
        const request = store.add(keyPair);

        request.onsuccess = () => resolve();
        request.onerror = () =>
          reject(new Error("Failed to store RSA key pair"));

        transaction.oncomplete = () => db.close();
      };

      request.onerror = () => reject(new Error("Failed to open database"));
    });
  });
};

// Get all RSA key pairs from IndexedDB
export const getAllRSAKeyPairs = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const db = window.indexedDB.databases().then((databases) => {
      const db = databases.find((db) => db.name === "commbankDB");
      if (!db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const request = window.indexedDB.open("commbankDB", db.version);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(["rsa_keys"], "readonly");
        const store = transaction.objectStore("rsa_keys");
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () =>
          reject(new Error("Failed to get RSA key pairs"));

        transaction.oncomplete = () => db.close();
      };

      request.onerror = () => reject(new Error("Failed to open database"));
    });
  });
};

// Get RSA key pair by username
export const getRSAKeyPairByUsername = (
  username: string,
): Promise<any | null> => {
  return new Promise((resolve, reject) => {
    getAllRSAKeyPairs()
      .then((keyPairs) => {
        const keyPair = keyPairs.find((kp) => kp.username === username);
        resolve(keyPair || null);
      })
      .catch((error) => reject(error));
  });
};
