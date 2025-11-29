/**
 * Encrypt mnemonic with PIN (placeholder - to be implemented with real encryption)
 * @param _mnemonic - The mnemonic to encrypt
 * @param _pin - The encryption PIN
 * @returns Encrypted mnemonic string
 */
export function encryptMnemonicWithPin(
  _mnemonic: string,
  _pin: string,
): string {
  // TODO: Implement real encryption
  // For now, just return a placeholder
  return "TODO";
  // console.log("Encrypting mnemonic with PIN:", { mnemonic, pin });
  // return `encrypted_${mnemonic}_with_${pin}`;
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

/**
 * Copy text to clipboard
 * @param text - The text to copy
 * @returns Promise that resolves when copied
 */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
