// RPC URL configuration - map chain IDs to RPC URLs
export const RPC_URLS: Record<string, string> = {
  "1": process.env.RPC_ETH_MAINNET || "",
  "11155111": process.env.RPC_ETH_SEPOLIA || "",
  "421614": process.env.RPC_ARB_SEPOLIA || "",
};

// Contract addresses by chain ID
// TODO move this to shared
export const CONTRACT_ADDRESSES: Record<number, string> = {
  11155111: "0x3b4eEb695754F868DF6BaF0c0B788cC6E553DbdA", // Sepolia
  421614: "0xC0e0C9DC1DE67B7f6434FfdDf2A33300ed6f49E3", // Arb Sepolia
};
