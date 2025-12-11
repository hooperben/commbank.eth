import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Copies text to clipboard and returns success status
 * @param text - Text to copy to clipboard
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
}

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

/**
 * Download data as JSON file
 * @param data - The data to download
 * @param filename - The filename (default: commbank.eth.json)
 */
export function downloadAsJson(
  data: Record<string, unknown>,
  filename = "commbank.eth.json",
): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
