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

      // Create an object store for RSA keys if it doesn't exist
      if (!database.objectStoreNames.contains("rsa_keys")) {
        database.createObjectStore("rsa_keys", { autoIncrement: true });
      }

      // Create an object store for public keys if it doesn't exist
      if (!database.objectStoreNames.contains("public_keys")) {
        database.createObjectStore("public_keys", { keyPath: "username" });
      }

      if (!database.objectStoreNames.contains("evm-accounts")) {
        database.createObjectStore("evm-accounts", { keyPath: "address" });
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
  id: string,
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
    // @ts-expect-error -- TODO fix
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
    id,
    encryptedData,
    // @ts-ignore
    iv,
    // @ts-ignore
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

// Generate and store RSA key pair using a seed derived from the passkey
export const generateRSAPair = async (
  secret: string,
  username: string,
): Promise<object> => {
  // Create a seed from the secret and username
  const encoder = new TextEncoder();
  const seedData = encoder.encode(secret + username);

  // Generate RSA key pair
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"],
  );

  // Export keys to JWK format for storage
  const publicKey = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKey = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

  // Create key pair object
  const rsaKeyPair = {
    username,
    publicKey,
    privateKey,
    createdAt: Date.now(),
  };

  // Store the key pair
  await storeRSAKeyPair(rsaKeyPair);

  return rsaKeyPair;
};

// Store RSA key pair in IndexedDB
export const storeRSAKeyPair = (keyPair: object): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction(["rsa_keys"], "readwrite");
    const store = transaction.objectStore("rsa_keys");
    const request = store.add(keyPair);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to store RSA key pair"));
    };
  });
};

// Store public key in IndexedDB
export const storePublicKey = (
  username: string,
  publicKey: any,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction(["public_keys"], "readwrite");
    const store = transaction.objectStore("public_keys");
    const request = store.put({ username, publicKey });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(new Error("Failed to store public key"));
    };
  });
};

// Generate JWT token signed with the private key
export const generateJWT = async (
  payload: object,
  privateKey: CryptoKey,
): Promise<string> => {
  // Create JWT header
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  // Add expiration to payload
  const finalPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour expiration
  };

  // Encode header and payload
  const encoder = new TextEncoder();
  const headerString = JSON.stringify(header);
  const payloadString = JSON.stringify(finalPayload);

  const encodedHeader = btoa(headerString).replace(/=+$/, "");
  const encodedPayload = btoa(payloadString).replace(/=+$/, "");

  // Create signature base
  const signatureBase = `${encodedHeader}.${encodedPayload}`;

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    encoder.encode(signatureBase),
  );

  // Convert signature to base64
  const encodedSignature = btoa(
    String.fromCharCode(...new Uint8Array(signature)),
  )
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  // Return complete JWT
  return `${signatureBase}.${encodedSignature}`;
};

// Verify JWT token
export const verifyJWT = async (
  token: string,
  publicKey: CryptoKey,
): Promise<boolean> => {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");

    // Decode payload to check expiration
    const decoder = new TextDecoder();
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return false;
    }

    // Verify signature
    const signatureBase = `${headerB64}.${payloadB64}`;
    const signature = new Uint8Array(
      atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => c.charCodeAt(0)),
    );

    const isValid = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" },
      publicKey,
      signature,
      new TextEncoder().encode(signatureBase),
    );

    return isValid;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return false;
  }
};

// Get RSA keys with JWT verification
export const getRSAKeys = async (
  jwt: string,
  publicKey: CryptoKey,
): Promise<object | null> => {
  // Verify the JWT first
  const isValid = await verifyJWT(jwt, publicKey);

  if (!isValid) {
    throw new Error("Invalid or expired JWT");
  }

  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error("Database not initialized"));
      return;
    }

    const transaction = db.transaction(["rsa_keys"], "readonly");
    const store = transaction.objectStore("rsa_keys");
    const request = store.getAll();

    request.onsuccess = () => {
      if (request.result && request.result.length > 0) {
        resolve(request.result[request.result.length - 1]); // Get most recent key pair
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      reject(new Error("Failed to get RSA keys"));
    };
  });
};
