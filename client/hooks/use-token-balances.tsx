import { supportedAssets } from "@/const/supported-assets";
import { useReadContracts } from "wagmi";
import { formatUnits } from "viem";

export type TokenBalance = {
  chainId: number;
  chainName: string;
  name: string;
  symbol: string;
  contractAddress: string;
  balance: string;
  formattedBalance: string;
  decimals: number;
};

const getChainName = (chainId: number): string => {
  const chains: Record<number, string> = {
    1: "Ethereum",
    10: "Optimism",
    137: "Polygon",
    8453: "Base",
    42161: "Arbitrum",
  };
  return chains[chainId] || `Chain ${chainId}`;
};

const erc20ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const useTokenBalances = (walletAddress?: string) => {
  // Prepare contract calls for all supported assets
  const contractCalls = supportedAssets.map(
    (asset) =>
      ({
        address: asset.address as `0x${string}`,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [walletAddress as `0x${string}`],
        chainId: asset.chainId,
      } as const),
  );

  const {
    data: contractData,
    isError,
    isLoading,
  } = useReadContracts({
    allowFailure: true,
    contracts: contractCalls,
    query: {
      enabled: !!walletAddress,
    },
  });

  // Format the returned token balances
  const data: TokenBalance[] | undefined = contractData
    ? contractData.map((result, index) => {
        const asset = supportedAssets[index];
        const balance =
          result.status === "success" ? result.result?.toString() || "0" : "0";
        const formattedBalance = formatUnits(BigInt(balance), asset.decimals);

        return {
          chainId: asset.chainId,
          chainName: getChainName(asset.chainId),
          name: asset.name,
          symbol: asset.symbol,
          contractAddress: asset.address,
          balance: formattedBalance,
          rawBalance: balance,
          formattedBalance,
          decimals: asset.decimals,
        };
      })
    : undefined;

  return {
    data,
    isError,
    isLoading,
  };
};
