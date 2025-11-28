import { Skeleton } from "@/components/ui/skeleton";
import { useERC20Balance } from "@/hooks/use-erc20-balance";
import { ethers } from "ethers";
import type { SupportedAsset } from "shared/constants/token";

export const Balance = ({ asset }: { asset: SupportedAsset }) => {
  const { data, isLoading } = useERC20Balance(asset);

  return (
    <div className="flex items-center justify-between p-4 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors duration-150 border-0">
      <div className="text-left">
        <div className="font-medium text-sm text-foreground">
          {asset.symbol}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{asset.name}</div>
      </div>
      {isLoading && <Skeleton className="w-24 h-8" />}
      {data && !isLoading && (
        <div className="text-right">
          <div className="font-medium text-sm text-foreground">
            {ethers.formatUnits(data, asset.decimals)} {asset.symbol}
          </div>
        </div>
      )}
    </div>
  );
};

export const BalanceRow = ({ asset }: { asset: SupportedAsset }) => {
  const { data, isLoading } = useERC20Balance(asset);

  const formatBalance = (balance: bigint) => {
    const formatted = ethers.formatUnits(balance, asset.decimals);
    if (asset.roundTo !== undefined) {
      return parseFloat(formatted).toFixed(asset.roundTo);
    }
    return formatted;
  };

  return (
    <div>
      {isLoading && <Skeleton className="w-24 h-8" />}
      {data && !isLoading && (
        <div className="text-right">
          <div className="font-medium text-sm text-foreground">
            {formatBalance(data)}
          </div>
        </div>
      )}
    </div>
  );
};
