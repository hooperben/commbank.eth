import { ethers } from "ethers";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { NoteEncryption } from "shared/classes/Note";
import type { DerivedAddresses } from "@/_types";

/**
 * Validate a 24-word mnemonic phrase
 * @param mnemonic - The mnemonic phrase to validate
 * @returns true if valid, false otherwise
 */
export function isValidMnemonic(mnemonic: string): boolean {
  try {
    const trimmed = mnemonic.trim();

    // Try to create a wallet from it
    ethers.Wallet.fromPhrase(trimmed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Derive addresses from a mnemonic
 * @param mnemonic - The mnemonic phrase
 * @returns Derived addresses (EVM, private address, envelope)
 */
export async function deriveAddressesFromMnemonic(
  mnemonic: string,
): Promise<DerivedAddresses> {
  const wallet = ethers.Wallet.fromPhrase(mnemonic);

  // Derive private address (poseidon hash of private key)
  const privateAddress = poseidon2Hash([BigInt(wallet.privateKey)]);
  const privateAddressHex = "0x" + privateAddress.toString(16);

  // Derive envelope (signing key)
  const envelope = await NoteEncryption.getPublicKeyFromAddress(wallet);

  return {
    address: wallet.address,
    privateAddress: privateAddressHex,
    envelope,
  };
}

/**
 * Mock decryption function (to be implemented later)
 * @param encryptedMnemonic - The encrypted mnemonic
 * @param pin - The decryption PIN
 * @returns Decrypted mnemonic or null if invalid
 */
export function decryptMnemonic(
  encryptedMnemonic: string,
  pin: string,
): string | null {
  // TODO: Implement actual decryption
  // For now, just return null to simulate invalid key
  console.log("Decrypt:", { encryptedMnemonic, pin });
  return null;
}
