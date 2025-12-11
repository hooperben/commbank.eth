import { useAuth } from "@/_providers/auth-provider";
import { SUPPORTED_NETWORKS } from "@/_constants/networks";
import { useQuery } from "@tanstack/react-query";
import { Contract, JsonRpcProvider } from "ethers";
import type { SupportedAsset } from "shared/constants/token";

export const useERC20Balance = (asset?: SupportedAsset | null) => {
  const { address } = useAuth();
  const queryFn = useQuery({
    queryKey: [asset?.address, asset?.chainId],
    queryFn: async () => {
      if (!asset) return;
      const chain = SUPPORTED_NETWORKS[asset.chainId];
      if (!chain) return 0n;

      const provider = new JsonRpcProvider(chain.rpc);

      if (asset.isNative) {
        return provider.getBalance(address!);
      }

      const contract = new Contract(
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
    enabled: !!address && !!asset,
  });

  return queryFn;
};
