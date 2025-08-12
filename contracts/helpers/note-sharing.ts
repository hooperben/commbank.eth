import { encrypt, decrypt } from "eciesjs";
import {
  Signer,
  Wallet,
  getBytes,
  hexlify,
  hashMessage,
  SigningKey,
} from "ethers";

interface EncryptedNote {
  encryptedSecret: string;
  owner: string;
  asset_id: string;
  asset_amount: string;
}

interface DecryptedNote {
  secret: string;
  owner: string;
  asset_id: string;
  asset_amount: string;
}

class NoteEncryption {
  /**
   * Encrypt a note secret using the recipient's public key
   */
  static async encryptNoteSecret(
    secret: string | bigint,
    recipientPublicKey: string,
  ): Promise<string> {
    // Convert the secret to a proper hex string
    const secretBigInt = BigInt(secret);
    const secretHex = "0x" + secretBigInt.toString(16).padStart(64, "0"); // 32 bytes = 64 hex chars
    const secretBytes = getBytes(secretHex);
    const encryptedData = encrypt(recipientPublicKey, secretBytes);
    return hexlify(encryptedData);
  }

  /**
   * Decrypt a note secret using the recipient's private key
   */
  static async decryptNoteSecret(
    encryptedSecret: string,
    signer: Signer,
  ): Promise<string> {
    // Get the private key from the signer
    const privateKey = await this.getPrivateKeyFromSigner(signer);
    const encryptedBytes = getBytes(encryptedSecret);
    const decryptedData = decrypt(privateKey, encryptedBytes);
    const decryptedHex = hexlify(decryptedData);
    // Convert back to decimal string representation
    const secretBigInt = BigInt(decryptedHex);
    return secretBigInt.toString();
  }

  /**
   * Get public key from a signer
   */
  static async getPublicKeyFromAddress(signer: Signer): Promise<string> {
    // If it's a Wallet, we can get the public key directly
    if (signer instanceof Wallet) {
      const signingKey = new SigningKey(signer.privateKey);
      return signingKey.publicKey;
    }

    // For other signers, derive from signature
    const message = "derive_public_key";
    const signature = await signer.signMessage(message);
    const messageHash = hashMessage(message);
    const recoveredKey = SigningKey.recoverPublicKey(messageHash, signature);
    return recoveredKey;
  }

  /**
   * Helper to get private key from signer (only works with Wallet signers)
   */
  private static async getPrivateKeyFromSigner(
    signer: Signer,
  ): Promise<string> {
    if (signer instanceof Wallet) {
      return signer.privateKey;
    }
    throw new Error("Signer must be a Wallet instance to access private key");
  }

  /**
   * Create an encrypted note for a recipient
   */
  static async createEncryptedNote(
    note: {
      secret: string | bigint;
      owner: string;
      asset_id: string;
      asset_amount: string;
    },
    recipientSigner: Signer,
  ): Promise<EncryptedNote> {
    const recipientPublicKey = await this.getPublicKeyFromAddress(
      recipientSigner,
    );
    const encryptedSecret = await this.encryptNoteSecret(
      note.secret,
      recipientPublicKey,
    );

    return {
      encryptedSecret,
      owner: note.owner,
      asset_id: note.asset_id,
      asset_amount: note.asset_amount,
    };
  }

  /**
   * Decrypt a note using the recipient's signer
   */
  static async decryptNote(
    encryptedNote: EncryptedNote,
    recipientSigner: Signer,
  ): Promise<DecryptedNote> {
    const decryptedSecret = await this.decryptNoteSecret(
      encryptedNote.encryptedSecret,
      recipientSigner,
    );

    return {
      secret: decryptedSecret,
      owner: encryptedNote.owner,
      asset_id: encryptedNote.asset_id,
      asset_amount: encryptedNote.asset_amount,
    };
  }
}

export { NoteEncryption, EncryptedNote, DecryptedNote };
