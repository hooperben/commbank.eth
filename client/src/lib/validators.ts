/**
 * Validates if a string is a valid Ethereum address
 * @param address - The address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEthereumAddress(address: string): boolean {
  // Check if address starts with 0x and has 40 hex characters after it
  const ethereumAddressRegex = /^0x[0-9a-fA-F]{40}$/;
  return ethereumAddressRegex.test(address);
}

/**
 * Validates if a string is a valid hex string (for Poseidon hashes, signing keys, etc.)
 * @param value - The hex string to validate
 * @param minLength - Minimum length (default: 10 characters including 0x)
 * @returns true if valid, false otherwise
 */
export function isValidHexString(
  value: string,
  minLength: number = 10,
): boolean {
  if (!value.startsWith("0x")) return false;
  if (value.length < minLength) return false;
  const hexRegex = /^0x[0-9a-fA-F]+$/;
  return hexRegex.test(value);
}
