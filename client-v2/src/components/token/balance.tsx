import type { SupportedAsset } from "shared/constants/token";
import { ethers } from "ethers";
import { useERC20Balance } from "@/hooks/use-erc20-balance";

export const Balance = ({ asset }: { asset: SupportedAsset }) => {
  const { data } = useERC20Balance(asset);

  return (
    <div className="flex items-center justify-between p-4 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors duration-150 border-0">
      <div className="text-left">
        <div className="font-medium text-sm text-foreground">
          {asset.symbol}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{asset.name}</div>
      </div>
      {/* TODO ADD LOADING AND REFETCHING STATE */}
      {data && (
        <div className="text-right">
          <div className="font-medium text-sm text-foreground">
            {ethers.formatUnits(data, asset.decimals)} {asset.symbol}
          </div>
        </div>
      )}
    </div>
  );
};
