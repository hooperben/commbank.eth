"use client";

import { generateJWT, generateRSAPair, storePublicKey } from "./db";

// Passkey (WebAuthn) authentication and key derivation

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

    // Create the credential
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error("Failed to create credential");
    }

    // Store the credential ID in localStorage for later use
    const credentialId = credential.id;
    localStorage.setItem("passkeyCredentialId", credentialId);

    // Store the username in localStorage
    localStorage.setItem("passkeyUsername", username);

    return true;
  } catch (error) {
    console.error("Error registering passkey:", error);
    return false;
  }
}

// Function to authenticate with a passkey and get authentication data
export async function authenticateWithPasskey(): Promise<ArrayBuffer | null> {
  try {
    // Get the credential ID from localStorage
    const credentialId = localStorage.getItem("passkeyCredentialId");
    if (!credentialId) {
      throw new Error("No passkey registered");
    }

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

// Check if a passkey is already registered
export function isPasskeyRegistered(): boolean {
  return localStorage.getItem("passkeyCredentialId") !== null;
}

// Get the registered username if available
export function getRegisteredUsername(): string | null {
  return localStorage.getItem("passkeyUsername");
}

// Check if a username is already registered with a passkey
export function isUsernameRegistered(): boolean {
  return localStorage.getItem("passkeyUsername") !== null;
}

// Process post-registration steps (generate keys and JWT)
export async function handleSuccessfulRegistration(
  username: string,
  authData: ArrayBuffer,
): Promise<string> {
  try {
    // Derive key from passkey authentication data
    const key = await deriveKeyFromPasskey(authData);

    // Generate a secret from the authentication data
    const secret = Array.from(new Uint8Array(authData))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Generate RSA key pair
    const rsaKeyPair = await generateRSAPair(secret, username);

    // Extract public key
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      rsaKeyPair.publicKey,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      true,
      ["verify"],
    );

    // Store public key
    await storePublicKey(username, rsaKeyPair.publicKey);

    // Generate JWT
    const privateKey = await crypto.subtle.importKey(
      "jwk",
      rsaKeyPair.privateKey,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      true,
      ["sign"],
    );

    const jwt = await generateJWT({ username, sub: username }, privateKey);

    return jwt;
  } catch (error) {
    console.error("Error in post-registration process:", error);
    throw error;
  }
}
