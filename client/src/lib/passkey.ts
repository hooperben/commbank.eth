import { arrayBufferToBase64, base64ToArrayBuffer } from "./data-formatting";

// Helper to get stored credential IDs
const getStoredCredentialIds = (): string[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("passkeyCredentialIds");
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

// Helper to store credential ID
function storeCredentialId(credentialId: string): void {
  if (typeof window === "undefined") return;
  const existing = getStoredCredentialIds();
  if (!existing.includes(credentialId)) {
    existing.push(credentialId);
    localStorage.setItem("passkeyCredentialIds", JSON.stringify(existing));
  }
}

// Function to register a new passkey
export async function registerPasskey(username: string): Promise<boolean> {
  try {
    // Create a new challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Get existing credential IDs to exclude from re-registration
    const existingCredentialIds = getStoredCredentialIds();
    const excludeCredentials: PublicKeyCredentialDescriptor[] =
      existingCredentialIds.map((id) => ({
        type: "public-key" as const,
        id: base64ToArrayBuffer(id),
      }));

    // Create credential options
    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
      {
        challenge,
        rp: {
          name: "commbank.eth",
          id:
            typeof window !== "undefined"
              ? window.location.hostname
              : "localhost",
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
        // Exclude already registered credentials to prevent override
        excludeCredentials:
          excludeCredentials.length > 0 ? excludeCredentials : undefined,
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

    // Store credential ID and username in localStorage for reference
    if (typeof window !== "undefined") {
      const credentialId = arrayBufferToBase64(credential.rawId);
      storeCredentialId(credentialId);
      localStorage.setItem("registeredUsername", username);
    }

    return true;
  } catch (error) {
    console.error("Error registering passkey:", error);
    return false;
  }
}

// Function to authenticate with a passkey and get authentication data
export async function authenticateWithPasskey(): Promise<ArrayBuffer | null> {
  try {
    // Create a new challenge
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    // Try to authenticate with any registered passkey (no specific credential ID needed)
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
      {
        challenge,
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
  if (typeof window === "undefined") return false;
  return (
    window &&
    "PublicKeyCredential" in window &&
    typeof window.PublicKeyCredential === "function" &&
    "navigator" in window &&
    "credentials" in navigator
  );
}

// Check if a passkey is already registered
export async function isPasskeyRegistered(): Promise<boolean> {
  try {
    // First check localStorage for stored credential IDs
    const storedCredentialIds = getStoredCredentialIds();
    const hasStoredUsername = localStorage.getItem("registeredUsername");

    // If we have stored credentials and username, likely registered
    if (storedCredentialIds.length > 0 && hasStoredUsername) {
      return true;
    }

    // Fall back to checking if we can authenticate
    // This handles cases where localStorage was cleared but passkey still exists
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        userVerification: "required",
        timeout: 5000, // Short timeout for quick check
      },
      // Use 'silent' mediation to avoid showing UI
      mediation: "silent" as CredentialMediationRequirement,
    });

    // If we got an assertion but no stored IDs, store it now
    if (assertion && storedCredentialIds.length === 0) {
      const publicKeyCredential = assertion as PublicKeyCredential;
      const credentialId = arrayBufferToBase64(publicKeyCredential.rawId);
      storeCredentialId(credentialId);
    }

    return assertion !== null;
  } catch (error) {
    console.error(error);
    // If authentication fails, assume no passkey is registered
    return false;
  }
}

// Get the registered username - now using localStorage
export async function getRegisteredUsername(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("registeredUsername");
}

// Check if a username is already registered - simplified since we only support one user per device
export async function isUsernameRegistered(username: string): Promise<boolean> {
  const registeredUsername = await getRegisteredUsername();
  return registeredUsername === username;
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
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      mnemonicData,
    );

    // Store the encrypted mnemonic in localStorage
    const encryptedMnemonic = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encryptedData)),
      username,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "encryptedMnemonic",
        JSON.stringify(encryptedMnemonic),
      );
    }

    return true;
  } catch (error) {
    console.error("Error storing mnemonic:", error);
    return false;
  }
}

// Retrieve and decrypt the mnemonic - now using localStorage only
export async function retrieveMnemonic(): Promise<string | null> {
  try {
    // Check if there's a registered username first
    const username = await getRegisteredUsername();

    // Try to authenticate with passkey
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

    // Get the encrypted mnemonic from localStorage
    if (typeof window === "undefined") return null;
    const storedData = localStorage.getItem("encryptedMnemonic");
    if (!storedData) {
      throw new Error("No stored mnemonic found");
    }

    const encryptedMnemonic = JSON.parse(storedData);

    // Decrypt the mnemonic
    const iv = new Uint8Array(encryptedMnemonic.iv);
    const encryptedData = new Uint8Array(encryptedMnemonic.data);

    const decryptedData = await crypto.subtle.decrypt(
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

// Get count of stored credential IDs
export function getStoredCredentialCount(): number {
  return getStoredCredentialIds().length;
}

// Clear all passkey data (useful for debugging or account reset)
export function clearPasskeyData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("passkeyCredentialIds");
  localStorage.removeItem("registeredUsername");
  localStorage.removeItem("encryptedMnemonic");
}

// Check if we have credential IDs stored locally
export function hasStoredCredentials(): boolean {
  return getStoredCredentialIds().length > 0;
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
      console.error(e);
      console.log("Conditional UI failed, falling back to standard method");
    }

    // Fall back to standard authentication if conditional UI fails
    return authenticateWithPasskey();
  } catch (error) {
    console.error("Error with conditional UI authentication:", error);
    return null;
  }
}

// Function to restore account by replacing the existing mnemonic with a new one
export async function restoreAccountWithMnemonic(
  username: string,
  newMnemonic: string,
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

    // Encrypt the new mnemonic
    const encoder = new TextEncoder();
    const mnemonicData = encoder.encode(newMnemonic);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      mnemonicData,
    );

    // Replace the stored encrypted mnemonic in localStorage
    const encryptedMnemonic = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encryptedData)),
      username,
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "encryptedMnemonic",
        JSON.stringify(encryptedMnemonic),
      );
      localStorage.setItem("registeredUsername", username);
    }

    return true;
  } catch (error) {
    console.error("Error restoring account with mnemonic:", error);
    return false;
  }
}
