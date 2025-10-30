import { Wallet, HDNodeWallet } from "ethers";

/**
 * Passkey credential information for disaster recovery
 *
 * TODO test a recovery process and then implement server
 */
export interface PasskeyCredentialInfo {
  credentialId: string; // Base64url-encoded credential ID
  publicKey: string; // Base64url-encoded public key (COSE format)
  address: string; // Ethereum address associated with this passkey
  createdAt: number; // Timestamp when credential was created
}

/**
 * CommbankDotETHAccount - A class-based account management system using WebAuthn passkeys
 *
 * This implementation provides secure, domain-locked account management for commbank.eth
 * The passkey is registered under the username "commbank.eth" and is locked to the domain
 * specified in the rp.id parameter (commbank.eth.limo in prod, dev env in dev).
 *
 * TODO: probably add dev environment when thats commissioned
 *
 * Security Model:
 * - Passkey is domain-locked via WebAuthn's rp.id (cannot be used on other domains)
 * - Account mnemonic is encrypted using a key derived from passkey authenticator data
 * - Encrypted mnemonic is stored in localStorage (can only be decrypted with passkey auth)
 * - No sensitive data is stored unencrypted
 */
export class CommbankDotETHAccount {
  private static readonly USERNAME = "commbank.eth";
  private static readonly RP_NAME = "commbank.eth";
  private static readonly RP_ID = import.meta.env.PROD
    ? "commbank.eth.limo"
    : typeof window !== "undefined"
      ? window.location.hostname
      : "localhost";
  private static readonly STORAGE_KEY_USERNAME = "registeredUsername";
  private static readonly STORAGE_KEY_ENCRYPTED = "encryptedMnemonic"; // TODO migrate ?
  private static readonly STORAGE_KEY_CREDENTIAL = "cb_credential_info";
  private static readonly SALT = "commbank.eth-fixed-salt";

  constructor() {
    // TODO accept any params?
  }

  /**
   * Check if a passkey is registered for commbank.eth
   * First checks localStorage, then optionally verifies with WebAuthn
   */
  async isRegistered(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    // Quick check: see if we have the username stored
    const storedUsername = localStorage.getItem(
      CommbankDotETHAccount.STORAGE_KEY_USERNAME,
    );
    const hasEncryptedAccount = localStorage.getItem(
      CommbankDotETHAccount.STORAGE_KEY_ENCRYPTED,
    );

    if (
      storedUsername === CommbankDotETHAccount.USERNAME &&
      hasEncryptedAccount
    ) {
      return true;
    }

    // If localStorage check fails, try a quick passkey availability check
    // This is a non-intrusive way to check if passkeys exist
    try {
      const available = await this.checkPasskeyAvailability();
      return available;
    } catch {
      return false;
    }
  }

  /**
   * Register a new passkey and create a new random Ethereum account
   * This will NOT overwrite an existing passkey/account
   *
   * @returns The newly created Wallet, or null if registration failed
   */
  async registerPasskey(): Promise<HDNodeWallet | null> {
    try {
      // Check if already registered
      const alreadyRegistered = await this.isRegistered();
      if (alreadyRegistered) {
        console.warn(
          "Passkey already registered. Use restorePasskey() to restore an existing account.",
        );
        return null;
      }

      // Create a random wallet
      const randomWallet = Wallet.createRandom();
      const mnemonic = randomWallet.mnemonic?.phrase;

      if (!mnemonic) {
        throw new Error("Failed to generate mnemonic");
      }

      // Register the passkey
      const credential = await this.createPasskeyCredential();
      if (!credential) {
        throw new Error("Failed to create passkey credential");
      }

      // Extract and store credential info for disaster recovery
      await this.storeCredentialInfo(credential, randomWallet.address);

      // Authenticate immediately to get authenticator data for encryption
      const authData = await this.authenticatePasskey();
      if (!authData) {
        throw new Error("Failed to authenticate with new passkey");
      }

      // Encrypt and store the mnemonic
      await this.encryptAndStoreAccount(authData, mnemonic);

      // Store the username
      localStorage.setItem(
        CommbankDotETHAccount.STORAGE_KEY_USERNAME,
        CommbankDotETHAccount.USERNAME,
      );

      return randomWallet;
    } catch (error) {
      console.error("Error registering passkey:", error);
      return null;
    }
  }

  /**
   * Authenticate with passkey and retrieve the Ethereum account
   *
   * @returns The decrypted Wallet, or throws an error if authentication fails
   */
  async getPasskeyAccount(): Promise<HDNodeWallet> {
    try {
      // Check if registered
      const isRegistered = await this.isRegistered();
      if (!isRegistered) {
        throw new Error(
          "No passkey registered for commbank.eth. Please register first.",
        );
      }

      // Authenticate with passkey
      const authData = await this.authenticatePasskey();
      if (!authData) {
        throw new Error("Failed to authenticate with passkey");
      }

      // Decrypt the stored mnemonic
      const mnemonic = await this.decryptStoredAccount(authData);
      if (!mnemonic) {
        throw new Error("Failed to decrypt account data");
      }

      // Create wallet from mnemonic
      const wallet = Wallet.fromPhrase(mnemonic);
      return wallet;
    } catch (error) {
      console.error("Error getting passkey account:", error);
      throw error;
    }
  }

  /**
   * Restore an account from an existing mnemonic phrase
   * Requires passkey authentication, then replaces the stored encrypted mnemonic
   *
   * @param mnemonic - The BIP-39 mnemonic phrase to restore from
   * @returns The restored Wallet, or null if restoration failed
   */
  async restoreFromMnemonic(mnemonic: string): Promise<HDNodeWallet | null> {
    try {
      // Validate the mnemonic first
      const wallet = Wallet.fromPhrase(mnemonic);

      // Check if passkey is registered
      const isRegistered = await this.isRegistered();

      let authData: ArrayBuffer;

      if (!isRegistered) {
        // If no passkey exists, register one first
        const credential = await this.createPasskeyCredential();
        if (!credential) {
          throw new Error("Failed to create passkey credential");
        }

        // Store credential info for disaster recovery
        await this.storeCredentialInfo(credential, wallet.address);

        // Get auth data from new passkey
        const newAuthData = await this.authenticatePasskey();
        if (!newAuthData) {
          throw new Error("Failed to authenticate with new passkey");
        }
        authData = newAuthData;
      } else {
        // Authenticate with existing passkey
        const existingAuthData = await this.authenticatePasskey();
        if (!existingAuthData) {
          throw new Error("Failed to authenticate with passkey");
        }
        authData = existingAuthData;
      }

      // Encrypt and store the mnemonic
      await this.encryptAndStoreAccount(authData, mnemonic);

      // Store the username
      localStorage.setItem(
        CommbankDotETHAccount.STORAGE_KEY_USERNAME,
        CommbankDotETHAccount.USERNAME,
      );

      return wallet;
    } catch (error) {
      console.error("Error restoring from mnemonic:", error);
      return null;
    }
  }

  /**
   * Get the passkey credential information for disaster recovery
   * This includes the credential ID and public key that can be used to identify
   * the user's account in a backend database
   *
   * @returns PasskeyCredentialInfo or null if not found
   */
  getCredentialInfo(): PasskeyCredentialInfo | null {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem(
      CommbankDotETHAccount.STORAGE_KEY_CREDENTIAL,
    );
    if (!stored) return null;

    try {
      return JSON.parse(stored) as PasskeyCredentialInfo;
    } catch {
      return null;
    }
  }

  /**
   * DANGER: Clear all stored account data (does NOT delete the passkey itself)
   * The passkey remains in the device's authenticator
   * WARNING: After calling this, you will need your mnemonic backup to restore access!
   */
  clearStoredAccount(): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem(CommbankDotETHAccount.STORAGE_KEY_USERNAME);
    localStorage.removeItem(CommbankDotETHAccount.STORAGE_KEY_ENCRYPTED);
    localStorage.removeItem(CommbankDotETHAccount.STORAGE_KEY_CREDENTIAL);
  }

  /**
   * Check if WebAuthn/Passkeys are supported in this environment
   */
  static isSupported(): boolean {
    if (typeof window === "undefined") return false;

    return (
      "PublicKeyCredential" in window &&
      typeof window.PublicKeyCredential === "function" &&
      "credentials" in navigator
    );
  }

  // ========== Private Helper Methods ==========

  /**
   * Create a new WebAuthn passkey credential
   */
  private async createPasskeyCredential(): Promise<PublicKeyCredential | null> {
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions =
      {
        challenge,
        rp: {
          name: CommbankDotETHAccount.RP_NAME,
          id: CommbankDotETHAccount.RP_ID,
        },
        user: {
          id: new TextEncoder().encode(CommbankDotETHAccount.USERNAME),
          name: CommbankDotETHAccount.USERNAME,
          displayName: CommbankDotETHAccount.USERNAME,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256 (ECDSA with SHA-256)
          { type: "public-key", alg: -257 }, // RS256 (RSASSA-PKCS1-v1_5 with SHA-256)
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Prefer platform authenticators (Touch ID, Face ID, Windows Hello)
          userVerification: "required", // Always require user verification
          residentKey: "required", // Create a resident key (discoverable credential)
        },
        timeout: 60000,
        attestation: "none",
      };

    try {
      const credential = (await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      })) as PublicKeyCredential;

      return credential;
    } catch (error) {
      console.error("Failed to create passkey:", error);
      return null;
    }
  }

  /**
   * Authenticate with the registered passkey
   */
  private async authenticatePasskey(): Promise<ArrayBuffer | null> {
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
        {
          challenge,
          rpId: CommbankDotETHAccount.RP_ID,
          userVerification: "required",
          timeout: 60000,
        };

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      if (!assertion) {
        return null;
      }

      const response = assertion.response as AuthenticatorAssertionResponse;
      return response.authenticatorData;
    } catch (error) {
      console.error("Failed to authenticate with passkey:", error);
      return null;
    }
  }

  /**
   * Check if passkeys are available without triggering authentication UI
   */
  private async checkPasskeyAvailability(): Promise<boolean> {
    try {
      // This is a quick, non-intrusive check
      // It doesn't trigger the authentication UI
      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const result = await Promise.race([
        navigator.credentials.get({
          publicKey: {
            challenge,
            rpId: CommbankDotETHAccount.RP_ID,
            userVerification: "required",
            timeout: 3000,
          },
          mediation: "conditional", // This prevents the UI from showing
        }),
        new Promise((resolve) => setTimeout(() => resolve(null), 3000)),
      ]);

      return result !== null;
    } catch {
      return false;
    }
  }

  /**
   * Derive a cryptographic key from passkey authenticator data
   */
  private async deriveKeyFromAuthData(
    authData: ArrayBuffer,
  ): Promise<CryptoKey> {
    // Import the authenticator data as a base key
    const baseKey = await crypto.subtle.importKey(
      "raw",
      authData,
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );

    const salt = new TextEncoder().encode(CommbankDotETHAccount.SALT);

    // Derive an AES-GCM key for encryption/decryption
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

  /**
   * Encrypt and store the account mnemonic
   */
  private async encryptAndStoreAccount(
    authData: ArrayBuffer,
    mnemonic: string,
  ): Promise<void> {
    // Derive encryption key from passkey auth data
    const key = await this.deriveKeyFromAuthData(authData);

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

    // Store in localStorage
    const encryptedAccount = {
      iv: Array.from(iv),
      data: Array.from(new Uint8Array(encryptedData)),
      version: 2, // Track version for future migrations
    };

    localStorage.setItem(
      CommbankDotETHAccount.STORAGE_KEY_ENCRYPTED,
      JSON.stringify(encryptedAccount),
    );
  }

  /**
   * Decrypt the stored account mnemonic
   */
  private async decryptStoredAccount(
    authData: ArrayBuffer,
  ): Promise<string | null> {
    try {
      // Get encrypted data from storage
      const storedData = localStorage.getItem(
        CommbankDotETHAccount.STORAGE_KEY_ENCRYPTED,
      );

      if (!storedData) {
        throw new Error("No encrypted account data found");
      }

      const encryptedAccount = JSON.parse(storedData);

      // Derive decryption key
      const key = await this.deriveKeyFromAuthData(authData);

      // Decrypt the mnemonic
      const iv = new Uint8Array(encryptedAccount.iv);
      const encryptedData = new Uint8Array(encryptedAccount.data);

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
      console.error("Failed to decrypt account:", error);
      return null;
    }
  }

  /**
   * Extract and store credential information from a WebAuthn credential
   * This is used for disaster recovery - the credential ID and public key
   * can be sent to a backend to associate encrypted backups with this passkey
   */
  private async storeCredentialInfo(
    credential: PublicKeyCredential,
    address: string,
  ): Promise<void> {
    try {
      const response = credential.response as AuthenticatorAttestationResponse;

      // Extract credential ID (this is the unique identifier for this passkey)
      const credentialId = this.arrayBufferToBase64Url(credential.rawId);

      // Extract public key from the attestation object
      // The public key is in COSE format inside the authenticator data
      const publicKey = this.arrayBufferToBase64Url(
        response.getPublicKey() || new ArrayBuffer(0),
      );

      const credentialInfo: PasskeyCredentialInfo = {
        credentialId,
        publicKey,
        address,
        createdAt: Date.now(),
      };

      localStorage.setItem(
        CommbankDotETHAccount.STORAGE_KEY_CREDENTIAL,
        JSON.stringify(credentialInfo),
      );
    } catch (error) {
      console.error("Failed to store credential info:", error);
      // Don't throw - this is not critical for account creation
    }
  }

  /**
   * Convert ArrayBuffer to base64url string
   */
  private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
}
