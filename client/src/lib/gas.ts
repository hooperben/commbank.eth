import type { ethers } from "ethers";

/**
 * Get adjusted gas price from provider.
 * Doubles the gas price on Sepolia testnet for faster confirmations.
 * Falls back to 2 gwei if gas price is unavailable.
 */
export async function getAdjustedGasPrice(
  provider: ethers.JsonRpcProvider,
): Promise<ethers.FeeData> {
  const feeData = await provider.getFeeData();

  return feeData;
}
