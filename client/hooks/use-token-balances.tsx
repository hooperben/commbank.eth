import { erc20ABI } from "@/const/erc20-abi";
import { RPC_URL } from "@/const/rpc";
import { USDC_ADDRESS } from "@/const/supported-assets";
import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";

export const useTokenBalances = (
  accountsData:
    | {
        evm: {
          username: string;
          address: string;
          createdAt: number;
        } | null;
        rsa: {
          username: string;
          circuitPubKey: string;
          publicKey: Uint8Array;
          createdAt: number;
        } | null;
      }
    | undefined,
) => {
  const fetchTokenBalances = async () => {
    if (!accountsData?.evm?.address) return { eth: "0", usdc: "0" };

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);

      // Fetch ETH balance
      const ethBalance = await provider.getBalance(accountsData.evm.address);

      const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        erc20ABI,
        provider,
      );

      // Fetch USDC balance
      const usdcBalance = await usdcContract.balanceOf(
        accountsData.evm.address,
      );

      return {
        eth: ethers.formatEther(ethBalance),
        usdc: ethers.formatUnits(usdcBalance, 6), // USDC has 6 decimals
      };
    } catch (error) {
      console.error("Error fetching token balances:", error);
      return { eth: "0", usdc: "0" };
    }
  };

  const queryFn = useQuery({
    queryKey: ["token-balances", accountsData?.evm?.address],
    queryFn: fetchTokenBalances,
    enabled: !!accountsData?.evm?.address,
  });

  return queryFn;
};
