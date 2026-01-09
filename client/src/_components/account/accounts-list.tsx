import { Card, CardContent } from "@/_components/ui/card";
import { Skeleton } from "@/_components/ui/skeleton";
import { useERC20Balance } from "@/_hooks/use-erc20-balance";
import { usePrivateBalance } from "@/_hooks/use-private-balance";
import { ethers } from "ethers";
import {
  defaultNetwork,
  mainnetAssets,
  sepoliaAssets,
  type SupportedAsset,
} from "shared/constants/token";

const AssetRow = ({ asset }: { asset: SupportedAsset }) => {
  const { data: publicBalance, isLoading: isLoadingPublic } =
    useERC20Balance(asset);
  const { assetTotal: privateBalance, isLoading: isLoadingPrivate } =
    usePrivateBalance(asset);

  const isLoading = isLoadingPublic || isLoadingPrivate;

  const formatBalance = (balance: bigint | undefined) => {
    if (!balance) return "0";
    const formatted = ethers.formatUnits(balance, asset.decimals);
    if (asset.roundTo !== undefined && balance !== 0n) {
      return parseFloat(formatted).toFixed(asset.roundTo);
    }
    return parseFloat(formatted).toFixed(asset.roundTo || 2);
  };

  const publicBal = publicBalance?.balance || 0n;
  const privateBal = privateBalance || 0n;
  const totalBal = publicBal + privateBal;

  if (isLoading) {
    return (
      <div className="flex items-center justify-between py-2 border-b last:border-b-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-2 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <img
          src={asset.logo}
          alt={asset.symbol}
          className={`h-6 w-6 ${asset.symbol === "AUDD" && "invert dark:invert-0"}`}
        />
        <div className="flex flex-col">
          <span className="font-semibold text-lg">{asset.symbol}</span>
          <div className="font-medium text-sm">
            {formatBalance(totalBal)} {asset.symbol}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex flex-col gap-1 min-w-[100px] text-right">
          <div className="flex justify-between items-center gap-3">
            <span className="text-muted-foreground text-xs">Public:</span>
            <span className="font-medium text-xs">
              {formatBalance(publicBal)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-muted-foreground text-xs">Private:</span>
            <span className="font-medium text-xs">
              {formatBalance(privateBal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export function AccountsList() {
  const assets: SupportedAsset[] =
    defaultNetwork === 1 ? mainnetAssets : sepoliaAssets;

  return (
    <Card>
      <CardContent className="px-2 py-1">
        <div className="space-y-0">
          {assets.map((asset) => (
            <AssetRow key={`${asset.address}-${asset.chainId}`} asset={asset} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
