import { ethers } from "ethers";

export class NoteEncryption {
  static async getPublicKeyFromAddress(signer: ethers.Signer): Promise<string> {
    if (signer instanceof ethers.Wallet) {
      const signingKey = new ethers.SigningKey(signer.privateKey);
      return signingKey.publicKey;
    }
    const message = "derive_public_key";
    const signature = await signer.signMessage(message);
    const messageHash = ethers.hashMessage(message);
    const recoveredKey = ethers.SigningKey.recoverPublicKey(
      messageHash,
      signature,
    );
    return recoveredKey;
  }

  static async encryptNoteSecret(
    secret: string | bigint,
    recipientPublicKey: string,
  ): Promise<string> {
    // Dynamic import of eciesjs for client-side
    const { encrypt } = await import("eciesjs");
    const secretBigInt = BigInt(secret);
    const secretHex = "0x" + secretBigInt.toString(16).padStart(64, "0");
    const secretBytes = ethers.getBytes(secretHex);
    const encryptedData = encrypt(recipientPublicKey, secretBytes);
    return ethers.hexlify(encryptedData);
  }

  static async createEncryptedNote(
    note: {
      secret: string | bigint;
      owner: string;
      asset_id: string;
      asset_amount: string;
    },
    recipientSigner: ethers.Signer,
  ) {
    const recipientPublicKey =
      await this.getPublicKeyFromAddress(recipientSigner);
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
}
