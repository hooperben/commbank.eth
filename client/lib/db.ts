"use client";

import { deriveKeyFromPasskey } from "./passkey";

// IndexedDB database for storing contacts and encrypted secrets
let db: IDBDatabase | null = null;

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve();
      return;
    }

    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      reject(new Error("Your browser doesn't support IndexedDB"));
      return;
    }

    const request = window.indexedDB.open("commbankDB", 2);

    request.onerror = (event) => {
      reject(new Error("Failed to open database"));
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create an object store for contacts if it doesn't exist
      if (!database.objectStoreNames.contains("contacts")) {
        database.createObjectStore("contacts", { autoIncrement: true });
      }

      // Create an object store for secrets if it doesn't exist
      if (!database.objectStoreNames.contains("secrets")) {
        database.createObjectStore("secrets", { keyPath: "id" });
      }
    };
  });
};

export const addContact = (contact: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction(["contacts"], "readwrite");
    const store = transaction.objectStore("contacts");
    const request = store.add(contact);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to add contact"));
    };
  });
};

export const getAllContacts = (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction(["contacts"], "readonly");
    const store = transaction.objectStore("contacts");
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error("Failed to get contacts"));
    };
  });
};

// Secret encryption and storage functions
export interface EncryptedSecret {
  id: string;
  encryptedData: ArrayBuffer;
  iv: ArrayBuffer;
  salt: ArrayBuffer;
  usePasskey: boolean;
}

// Generate a random secret
export const generateSecret = (length = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
};

// Derive an encryption key from a password
const deriveKeyFromPassword = async (
  password: string,
  salt: ArrayBuffer,
): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import the password as a key
  const baseKey = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  // Derive a key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

// Encrypt a secret with a password
export const encryptSecret = async (
  secret: string,
  password: string | ArrayBuffer,
  usePasskey = false,
): Promise<EncryptedSecret> => {
  const encoder = new TextEncoder();
  const secretBuffer = encoder.encode(secret);

  // Generate a random salt for key derivation
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Generate a random IV for encryption
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derive the encryption key
  let key: CryptoKey;
  if (usePasskey) {
    // If using passkey, the password parameter is actually the authenticator data
    key = await deriveKeyFromPasskey(password as ArrayBuffer);
  } else {
    key = await deriveKeyFromPassword(password as string, salt);
  }

  // Encrypt the secret
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    secretBuffer,
  );

  return {
    id: "secret-" + Date.now(), // Generate a unique ID
    encryptedData,
    iv,
    salt,
    usePasskey,
  };
};

// Decrypt a secret
export const decryptSecret = async (
  encryptedSecret: EncryptedSecret,
  password: string | ArrayBuffer,
): Promise<string> => {
  try {
    // Derive the decryption key
    let key: CryptoKey;
    if (encryptedSecret.usePasskey) {
      // If using passkey, the password parameter is actually the authenticator data
      key = await deriveKeyFromPasskey(password as ArrayBuffer);
    } else {
      key = await deriveKeyFromPassword(
        password as string,
        encryptedSecret.salt,
      );
    }

    // Decrypt the secret
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: encryptedSecret.iv,
      },
      key,
      encryptedSecret.encryptedData,
    );

    // Convert the decrypted buffer to a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    throw new Error(
      "Decryption failed. Authentication failed or corrupted data.",
    );
  }
};

// Store an encrypted secret in IndexedDB
export const storeEncryptedSecret = (
  encryptedSecret: EncryptedSecret,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction(["secrets"], "readwrite");
    const store = transaction.objectStore("secrets");
    const request = store.put(encryptedSecret);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to store encrypted secret"));
    };
  });
};

// Get all encrypted secrets from IndexedDB
export const getAllEncryptedSecrets = (): Promise<EncryptedSecret[]> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction(["secrets"], "readonly");
    const store = transaction.objectStore("secrets");
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(new Error("Failed to get encrypted secrets"));
    };
  });
};

// Get a specific encrypted secret by ID
export const getEncryptedSecretById = (
  id: string,
): Promise<EncryptedSecret | null> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction(["secrets"], "readonly");
    const store = transaction.objectStore("secrets");
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };

    request.onerror = () => {
      reject(new Error("Failed to get encrypted secret"));
    };
  });
};

// Delete an encrypted secret by ID
export const deleteEncryptedSecret = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction(["secrets"], "readwrite");
    const store = transaction.objectStore("secrets");
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to delete encrypted secret"));
    };
  });
};
