"use client";

import {
  initDB,
  storePasskeyRegistration,
  getPasskeyRegistration,
  storeMnemonicInDB,
  getMnemonicFromDB,
  getRegisteredUsername as readRegisteredUser,
} from "./db";

// Store passkey registration in IndexedDB
async function storePasskeyData(
  username: string,
  credentialId: string,
): Promise<void> {
  await initDB();
  return storePasskeyRegistration(username, credentialId);
}

// Function to register a new passkey
export async function registerPasskey(username: string): Promise<boolean> {
  try {
    // Create a new challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Create credential options
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
      {
        challenge,
        rp: {
          name: "commbank.eth",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(username),
          name: username,
          displayName: username,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "required",
        },
        timeout: 60000,
        attestation: "none",
      };

    await initDB();

    // Create the credential
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error("Failed to create credential");
    }

    // Store the credential ID in IndexedDB
    const credentialId = credential.id;
    await storePasskeyData(username, credentialId);

    return true;
  } catch (error) {
    console.error("Error registering passkey:", error);
    return false;
  }
}

// Function to authenticate with a passkey and get authentication data
export async function authenticateWithPasskey(): Promise<ArrayBuffer | null> {
  try {
    // Get the registration from IndexedDB
    const registration = await getPasskeyRegistration();
    if (!registration) {
      throw new Error("No passkey registered");
    }

    const credentialId = registration.credentialId;

    // Create a new challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Create credential request options
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
      {
        challenge,
        allowCredentials: [
          {
            id: Uint8Array.from(
              atob(credentialId.replace(/-/g, "+").replace(/_/g, "/")),
              (c) => c.charCodeAt(0),
            ),
            type: "public-key",
          },
        ],
        userVerification: "required",
        timeout: 60000,
      };

    // Get the credential
    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    if (!assertion) {
      throw new Error("Authentication failed");
    }

    // Get the authenticator data from the response
    const response = assertion.response as AuthenticatorAssertionResponse;

    // Return the authenticator data which will be used for key derivation
    return response.authenticatorData;
  } catch (error) {
    console.error("Error authenticating with passkey:", error);
    return null;
  }
}

// Function to derive an encryption key from passkey authentication data
export async function deriveKeyFromPasskey(
  authData: ArrayBuffer,
): Promise<CryptoKey> {
  // Use the authenticator data as the base for key derivation
  const baseKey = await crypto.subtle.importKey(
    "raw",
    authData,
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  // Use a fixed salt for key derivation
  // This ensures we get the same key for the same authenticator data
  const salt = new TextEncoder().encode("commbank.eth-fixed-salt");

  // Derive the key
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
}

// Check if passkeys are supported in this browser
export function isPasskeySupported(): boolean {
  return (
    window &&
    "PublicKeyCredential" in window &&
    typeof window.PublicKeyCredential === "function" &&
    "navigator" in window &&
    "credentials" in navigator
  );
}

// Check if a passkey is already registered - now using DB function
export async function isPasskeyRegistered(): Promise<boolean> {
  try {
    await initDB();
    const registration = await getPasskeyRegistration();
    return registration !== null;
  } catch (error) {
    console.error("Error checking passkey registration:", error);
    return false;
  }
}

// Get the registered username if available - now using DB function
export async function getRegisteredUsername(): Promise<string | null> {
  return readRegisteredUser();
}

// Check if a username is already registered with a passkey
export async function isUsernameRegistered(username: string): Promise<boolean> {
  try {
    await initDB();
    const registration = await getPasskeyRegistration(username);
    return registration !== null;
  } catch (error) {
    console.error("Error checking username registration:", error);
    return false;
  }
}

// Function to store a mnemonic phrase securely with passkey
export async function storeMnemonicWithPasskey(
  username: string,
  mnemonic: string,
): Promise<boolean> {
  try {
    const isRegistered = await isPasskeyRegistered();
    // First ensure the user has a registered passkey
    if (!isRegistered) {
      const success = await registerPasskey(username);
      if (!success) {
        throw new Error("Failed to register passkey");
      }
    }

    // Authenticate to get authenticator data
    const authData = await authenticateWithPasskey();
    if (!authData) {
      throw new Error("Failed to authenticate with passkey");
    }

    // Derive encryption key from the authenticator data
    const key = await deriveKeyFromPasskey(authData);

    // Encrypt the mnemonic
    const encoder = new TextEncoder();
    const mnemonicData = encoder.encode(mnemonic);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      mnemonicData,
    );

    // Store the encrypted mnemonic
    const encryptedMnemonic = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encryptedData)),
      username,
    };

    // 1. IndexedDB (most resilient against cache clearing)
    await storeMnemonicInDB(encryptedMnemonic);

    // 2. localStorage as a backup
    localStorage.setItem(
      "encryptedMnemonic",
      JSON.stringify(encryptedMnemonic),
    );

    return true;
  } catch (error) {
    console.error("Error storing mnemonic:", error);
    return false;
  }
}

// Retrieve and decrypt the mnemonic
export async function retrieveMnemonic(): Promise<string | null> {
  try {
    // Check if there's a registered username first
    const username = await getRegisteredUsername();

    // First try to authenticate with regular passkey if username exists
    let authData: ArrayBuffer | null = null;
    if (username) {
      authData = await authenticateWithPasskey();
    }

    // If no username or regular authentication failed, try conditional UI
    if (!authData) {
      authData = await authenticateWithConditionalUI();
    }

    if (!authData) {
      throw new Error("Failed to authenticate with passkey");
    }

    // Derive the decryption key
    const key = await deriveKeyFromPasskey(authData);

    // Try to get the encrypted mnemonic from IndexedDB first
    let encryptedMnemonic = await getMnemonicFromDB();

    // Fall back to localStorage if needed
    if (!encryptedMnemonic) {
      const storedData = localStorage.getItem("encryptedMnemonic");
      if (storedData) {
        encryptedMnemonic = JSON.parse(storedData);
      } else {
        throw new Error("No stored mnemonic found");
      }
    }

    // Decrypt the mnemonic
    const iv = new Uint8Array(encryptedMnemonic.iv);
    const encryptedData = new Uint8Array(encryptedMnemonic.data);

    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encryptedData,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error("Error retrieving mnemonic:", error);
    return null;
  }
}

// Use WebAuthn Conditional UI for authentication
async function authenticateWithConditionalUI(): Promise<ArrayBuffer | null> {
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Try conditional UI first (uses passkey without requiring explicit credential ID)
    try {
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          userVerification: "required",
          timeout: 60000,
        },
      })) as PublicKeyCredential;

      if (assertion) {
        const response = assertion.response as AuthenticatorAssertionResponse;
        return response.authenticatorData;
      }
    } catch (e) {
      console.log("Conditional UI failed, falling back to standard method");
    }

    // Fall back to standard authentication if conditional UI fails
    return authenticateWithPasskey();
  } catch (error) {
    console.error("Error with conditional UI authentication:", error);
    return null;
  }
}
