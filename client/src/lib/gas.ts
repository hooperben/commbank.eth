import { parseUnits } from "ethers";
import type { ethers } from "ethers";

// Sepolia chain ID
const SEPOLIA_CHAIN_ID = 11155111;

// Fallback gas price: 2 gwei
const FALLBACK_GAS_PRICE = parseUnits("2", "gwei");

/**
 * Get adjusted gas price from provider.
 * Doubles the gas price on Sepolia testnet for faster confirmations.
 * Falls back to 2 gwei if gas price is unavailable.
 */
export async function getAdjustedGasPrice(
  provider: ethers.JsonRpcProvider,
  chainId: number,
): Promise<bigint> {
  const feeData = await provider.getFeeData();
  const baseGasPrice = feeData.gasPrice ?? FALLBACK_GAS_PRICE;

  // Double gas price on Sepolia for faster confirmations
  if (chainId === SEPOLIA_CHAIN_ID) {
    return baseGasPrice * 2n;
  }

  return baseGasPrice;
}
