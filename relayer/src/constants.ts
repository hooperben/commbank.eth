// RPC URL configuration - map chain IDs to RPC URLs
export const RPC_URLS: Record<string, string> = {
  "1": process.env.RPC_ETH_MAINNET || "",
  "11155111": process.env.RPC_ETH_SEPOLIA || "",
  "421614": process.env.RPC_ARB_SEPOLIA || "",
};
