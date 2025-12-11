import { SUPPORTED_NETWORKS } from "@/_constants/networks";
import { useAuth } from "@/_providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { Contract, JsonRpcProvider } from "ethers";
import type { SupportedAsset } from "shared/constants/token";

const getBalance = async (asset: SupportedAsset, address: string) => {
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
};

export const useERC20Balance = (asset?: SupportedAsset | null) => {
  const { address } = useAuth();
  const queryFn = useQuery({
    queryKey: [asset?.address, asset?.chainId],
    queryFn: async () => {
      if (!asset || !address) return 0n;

      return await getBalance(asset, address);
    },
    enabled: !!address && !!asset,
  });

  return queryFn;
};

export const useERC20Balances = (assets: SupportedAsset[]) => {
  const { address } = useAuth();

  const queryFn = useQuery({
    queryKey: [assets],
    queryFn: async () => {
      if (!assets || !address) return 0n;

      const assetsWithBalance = assets.map(async (asset) => ({
        ...asset,
        balance: await getBalance(asset, address),
      }));

      return await Promise.all(assetsWithBalance);
    },
    enabled: !!address && !!assets,
  });

  return queryFn;
};
