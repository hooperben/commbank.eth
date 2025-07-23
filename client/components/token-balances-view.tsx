"use client";

import { columns } from "@/components/columns";
import { DataTable } from "@/components/data-table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { supportedAssets } from "@/const/supported-assets";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useReadContracts } from "wagmi";

export type TokenBalance = {
  id: string;
  chainId: number;
  chainName: string;
  name: string;
  symbol: string;
  address: string;
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

export function TokenBalancesTable({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hideZeroBalances, setHideZeroBalances] = useState(false);

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
    data,
    isError,
    isLoading: isLoadingBalances,
  } = useReadContracts({
    allowFailure: true,
    contracts: contractCalls,
  });

  // useEffect to format the returned token balances
  useEffect(() => {
    const fetchBalances = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (data) {
          const tokenBalances: TokenBalance[] = data.map((result, index) => {
            const asset = supportedAssets[index];
            const balance =
              result.status === "success"
                ? result.result?.toString() || "0"
                : "0";
            const formattedBalance = formatUnits(
              BigInt(balance),
              asset.decimals,
            );

            return {
              id: `${asset.chainId}-${asset.address}`,
              chainId: asset.chainId,
              chainName: getChainName(asset.chainId),
              name: asset.name,
              symbol: asset.symbol,
              address: asset.address,
              balance,
              formattedBalance,
              decimals: asset.decimals,
            };
          });

          setBalances(tokenBalances);
        }
      } catch (err) {
        setError("Failed to fetch token balances");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalances();
  }, [data, walletAddress, error, isError]);

  // Filter balances based on toggle state
  const filteredBalances = hideZeroBalances
    ? balances.filter((balance) => parseFloat(balance.formattedBalance) > 0)
    : balances;

  if (isError) {
    return (
      <Alert variant="destructive">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertDescription>
          Error fetching token balances. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading || isLoadingBalances) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mt-4">
        <Switch
          id="hide-zero-balances"
          checked={hideZeroBalances}
          onCheckedChange={setHideZeroBalances}
        />
        <Label htmlFor="hide-zero-balances">Hide zero balances</Label>
      </div>
      <DataTable columns={columns} data={filteredBalances} />
    </div>
  );
}
