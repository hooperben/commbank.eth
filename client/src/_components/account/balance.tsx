import { Skeleton } from "@/_components/ui/skeleton";
import { useERC20Balance } from "@/_hooks/use-erc20-balance";
import { usePrivateBalance } from "@/_hooks/use-private-balance";
import { ethers, formatUnits } from "ethers";
import type { SupportedAsset } from "shared/constants/token";

export const BalanceRow = ({
  asset,
  description,
}: {
  asset: SupportedAsset;
  description?: string;
}) => {
  const { data, isLoading } = useERC20Balance(asset);

  const formatBalance = (balance: bigint) => {
    const formatted = ethers.formatUnits(balance, asset.decimals);
    if (asset.roundTo !== undefined && balance != 0n) {
      return parseFloat(formatted).toFixed(asset.roundTo);
    }
    return formatted;
  };

  return (
    <div>
      {isLoading && <Skeleton className="w-12 h-3" />}
      {!isLoading && (
        <div className="text-right">
          <div className="font-medium text-xs text-foreground">
            {formatBalance(data ?? 0n)}
            {description && <span>{description}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export const PrivateBalanceRow = ({
  asset,
  description,
}: {
  asset: SupportedAsset;
  description?: string;
}) => {
  const { assetNotes, isLoading, assetTotal } = usePrivateBalance(asset);

  return (
    <div>
      {isLoading && <Skeleton className="w-12 h-3" />}
      {assetNotes && !isLoading && (
        <div className="text-right">
          <div className="font-medium text-xs text-foreground">
            {assetTotal && formatUnits(assetTotal, asset.decimals)}
            {description && <span>{description}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export const TotalBalanceRow = ({ asset }: { asset: SupportedAsset }) => {
  const {
    assetNotes,
    isLoading,
    assetTotal: privateAssetTotal,
  } = usePrivateBalance(asset);

  const { data: erc20BalanceData } = useERC20Balance(asset);

  const sumAndFormatBalances = (
    publicBalance: bigint,
    privateBalance: bigint,
  ) => {
    const formatted = ethers.formatUnits(
      publicBalance + privateBalance,
      asset.decimals,
    );
    if (asset.roundTo !== undefined) {
      return parseFloat(formatted).toFixed(asset.roundTo);
    }
    return formatted;
  };

  return (
    <div>
      {isLoading && <Skeleton className="ml-auto w-20 h-4" />}

      {assetNotes && !isLoading && privateAssetTotal !== undefined && (
        <div className="text-right">
          <div className="font-medium text-sm text-foreground">
            {erc20BalanceData !== undefined && (
              <>
                {sumAndFormatBalances(erc20BalanceData, privateAssetTotal)}{" "}
                {asset.symbol}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
