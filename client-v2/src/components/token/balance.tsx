import { useAuth } from "@/lib/auth-context";
import { SUPPORTED_NETWORKS } from "@/lib/networks";
import { useQuery } from "@tanstack/react-query";
import type { SupportedAsset } from "shared/constants/token";
import { ethers } from "ethers";

export const Balance = ({ asset }: { asset: SupportedAsset }) => {
  const { address } = useAuth();

  const { data } = useQuery({
    queryKey: [asset.address, asset.chainId],
    queryFn: async () => {
      const chain = SUPPORTED_NETWORKS[asset.chainId];

      console.log(chain);

      if (!chain) return 0n;

      const provider = new ethers.JsonRpcProvider(chain.rpc);
      const contract = new ethers.Contract(
        asset.address,
        [
          {
            inputs: [{ name: "account", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        provider,
      );

      const balance = await contract.balanceOf(address);

      return balance;
    },
    enabled: !!address,
  });

  return (
    <div className="flex items-center justify-between p-4 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors duration-150 border-0">
      <div className="text-left">
        <div className="font-medium text-sm text-foreground">
          {asset.symbol}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{asset.name}</div>
      </div>
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
