import { parseUnits, type ethers } from "ethers";

/**
 * Get adjusted gas price from provider.
 * Adds a 50% buffer to handle base fee volatility between estimation and inclusion.
 * Falls back to 2 gwei if gas price is unavailable.
 */
export async function getAdjustedGasPrice(
  provider: ethers.JsonRpcProvider,
): Promise<bigint> {
  const feeData = await provider.getFeeData();

  // Use maxFeePerGas (EIP-1559) or gasPrice (legacy), with 1.5x buffer
  const basePrice = feeData.maxFeePerGas ?? feeData.gasPrice;

  if (!basePrice) {
    // Fallback to 2 gwei if provider returns nothing
    return parseUnits("2", "gwei");
  }

  // Add 20% buffer to handle base fee increases between estimation and inclusion
  return (basePrice * 120n) / 100n;
}
