/**
 * Truncates an address to show first and last few characters
 * @param address - The full address to truncate
 * @param chars - Number of characters to show on each end (default: 6)
 * @returns Truncated address in format "0x1234...5678"
 */
export function truncateAddress(address: string, chars = 6): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
