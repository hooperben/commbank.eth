import { Skeleton } from "@/_components/ui/skeleton";
import { useERC20Balance } from "@/_hooks/use-erc20-balance";
import { useUserAssetNotes } from "@/_hooks/use-user-asset-notes";
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
      {isLoading && <Skeleton className="w-24 h-8" />}
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
  const { data: assetNotes, isLoading } = useUserAssetNotes(asset.address);

  const assetTotal = assetNotes
    ? assetNotes.reduce((acc, curr) => {
        return acc + BigInt(curr.assetAmount);
      }, 0n)
    : undefined;

  return (
    <div>
      {isLoading && <Skeleton className="w-24 h-8" />}
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
  const { data: assetNotes, isLoading } = useUserAssetNotes(asset.address);

  const privateAssetTotal = assetNotes
    ? assetNotes.reduce((acc, curr) => {
        return acc + BigInt(curr.assetAmount);
      }, 0n)
    : 0n;

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
      {isLoading && <Skeleton className="w-24 h-8" />}

      {assetNotes && !isLoading && (
        <div className="text-right">
          <div className="font-medium text-sm text-foreground">
            {erc20BalanceData &&
              sumAndFormatBalances(erc20BalanceData, privateAssetTotal)}{" "}
            {asset.symbol}
          </div>
        </div>
      )}
    </div>
  );
};
