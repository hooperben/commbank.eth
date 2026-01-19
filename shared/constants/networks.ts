interface NetworkConfig {
  rpc: string;
  CommBankDotEth: string;
  name: string;
}

export const SUPPORTED_NETWORKS: Record<number, NetworkConfig> = {
  // SEPOLIA
  11155111: {
    rpc: "https://relayer-production-91b9.up.railway.app/rpc/11155111",
    CommBankDotEth: "0x3b4eEb695754F868DF6BaF0c0B788cC6E553DbdA",
    name: "Ethereum",
  },
  // ARB SEPOLIA
  421614: {
    rpc: "https://relayer-production-91b9.up.railway.app/rpc/421614",
    CommBankDotEth: "0xC0e0C9DC1DE67B7f6434FfdDf2A33300ed6f49E3",
    name: "Arb Sepolia",
  },
  // MAINNET
  1: {
    rpc: "https://relayer-production-91b9.up.railway.app/rpc/1",
    name: "Ethereum",
    CommBankDotEth: "0x5eEAAE6dA50C2cBC94F8A0B25a1D9bAD8225db1e",
  },
};
