import { SUPPORTED_NETWORKS } from "@/_constants/networks";
import { useQuery } from "@tanstack/react-query";
import { Contract, JsonRpcProvider } from "ethers";

const CHAINLINK_ABI = [
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "description",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// Price feed addresses on Ethereum mainnet
export const PRICE_FEEDS = {
  ETH_USD: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
  AUD_USD: "0x77F9710E7d0A19669A13c055F62cd80d313dF022",
} as const;

const MAINNET_RPC = SUPPORTED_NETWORKS[1].rpc;

interface ChainlinkPriceData {
  price: bigint;
  decimals: number;
  formattedPrice: string;
  updatedAt: Date;
  description: string;
}

export const useChainlinkPrice = (
  feedAddress: string,
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  },
) => {
  return useQuery({
    queryKey: ["chainlink-price", feedAddress],
    queryFn: async (): Promise<ChainlinkPriceData> => {
      const provider = new JsonRpcProvider(MAINNET_RPC);
      const contract = new Contract(feedAddress, CHAINLINK_ABI, provider);

      const [roundData, decimals, description] = await Promise.all([
        contract.latestRoundData(),
        contract.decimals(),
        contract.description(),
      ]);

      const price = roundData[1]; // answer
      const updatedAt = roundData[3]; // updatedAt timestamp

      // Convert bigint price to formatted string based on decimals
      const formattedPrice = (
        Number(price) / Math.pow(10, Number(decimals))
      ).toFixed(Number(decimals));

      return {
        price,
        decimals: Number(decimals),
        formattedPrice,
        updatedAt: new Date(Number(updatedAt) * 1000),
        description: String(description),
      };
    },
    refetchInterval: options?.refetchInterval ?? 60000, // Default: refetch every 60 seconds
    enabled: options?.enabled ?? true,
  });
};

// Convenience hooks for specific price feeds
export const useEthUsdPrice = () => {
  return useChainlinkPrice(PRICE_FEEDS.ETH_USD);
};

export const useAudUsdPrice = () => {
  return useChainlinkPrice(PRICE_FEEDS.AUD_USD);
};
