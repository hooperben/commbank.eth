import { ethers } from "ethers";
import { decrypt } from "eciesjs";

export class NoteDecryption {
  static async decryptNoteSecret(
    encryptedData: string,
    privateKey: string,
  ): Promise<string> {
    try {
      // Remove 0x prefix if present
      const cleanEncryptedData = encryptedData.startsWith("0x")
        ? encryptedData.slice(2)
        : encryptedData;

      // Remove 0x prefix from private key if present
      const cleanPrivateKey = privateKey.startsWith("0x")
        ? privateKey.slice(2)
        : privateKey;

      const encryptedBytes = Buffer.from(cleanEncryptedData, "hex");
      const privateKeyBytes = Buffer.from(cleanPrivateKey, "hex");

      const decryptedBytes = decrypt(privateKeyBytes, encryptedBytes);
      const decryptedHex = "0x" + Buffer.from(decryptedBytes).toString("hex");
      const secretBigInt = BigInt(decryptedHex);
      return secretBigInt.toString();
    } catch (error) {
      console.error("Decryption error details:", error);
      throw new Error(
        `Failed to decrypt: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  static async decryptEncryptedNote(
    encryptedNote: string,
    privateKey: string,
  ): Promise<{
    secret: string;
    owner: string;
    asset_id: string;
    asset_amount: string;
  }> {
    try {
      // First, try to decode the ABI-encoded payload
      // The note is encoded as ["string", "string", "string", "string"]
      // [encryptedSecret, owner, asset_id, asset_amount]
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["string", "string", "string", "string"],
        encryptedNote,
      );

      const [encryptedSecret, owner, asset_id, asset_amount] = decoded;

      // Decrypt the secret
      const secret = await this.decryptNoteSecret(encryptedSecret, privateKey);

      return {
        secret,
        owner,
        asset_id,
        asset_amount,
      };
    } catch (abiError) {
      console.error("ABI decode failed, trying JSON parse:", abiError);
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(encryptedNote);

        // Decrypt the secret
        const secret = await this.decryptNoteSecret(
          parsed.encryptedSecret,
          privateKey,
        );

        return {
          secret,
          owner: parsed.owner,
          asset_id: parsed.asset_id,
          asset_amount: parsed.asset_amount,
        };
      } catch (jsonError) {
        console.error("JSON parse also failed:", jsonError);
        // If both fail, treat the whole string as encrypted data
        const secret = await this.decryptNoteSecret(encryptedNote, privateKey);

        return {
          secret,
          owner: "Unknown",
          asset_id: "Unknown",
          asset_amount: "Unknown",
        };
      }
    }
  }
}
