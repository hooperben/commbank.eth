import { useAudUsdPrice, useEthUsdPrice } from "@/hooks/use-chainlink-price";
import { useERC20Balance } from "@/hooks/use-erc20-balance";
import { ethers } from "ethers";
import {
  defaultNetwork,
  mainnetAssets,
  sepoliaAssets,
  type SupportedAsset,
} from "shared/constants/token";

export const useAccountTotal = () => {
  const assets: SupportedAsset[] =
    defaultNetwork === 1 ? mainnetAssets : sepoliaAssets;

  // Fetch prices
  const { data: ethUsdPrice, isLoading: isLoadingEthPrice } = useEthUsdPrice();
  const { data: audUsdPrice, isLoading: isLoadingAudPrice } = useAudUsdPrice();

  // Fetch all balances
  const balances = assets.map((asset) => ({
    asset,
    ...useERC20Balance(asset),
  }));

  // Check if any balance is still loading
  const isLoadingBalances = balances.some((b) => b.isLoading);
  const isLoadingPrices = isLoadingEthPrice || isLoadingAudPrice;
  const isLoading = isLoadingBalances || isLoadingPrices;

  // Calculate total value in USD
  const totalUsd = (() => {
    if (!ethUsdPrice || !audUsdPrice) return 0;

    let total = 0;

    for (const { asset, data: balance } of balances) {
      if (!balance) continue;

      const balanceFormatted = parseFloat(
        ethers.formatUnits(balance, asset.decimals),
      );

      // Convert each asset to USD
      if (asset.symbol === "ETH") {
        // ETH to USD
        const ethPrice = parseFloat(ethUsdPrice.formattedPrice);
        total += balanceFormatted * ethPrice;
      } else if (asset.symbol === "AUDD") {
        // AUDD to USD (1 AUDD = 1 AUD)
        const audToUsd = parseFloat(audUsdPrice.formattedPrice);
        total += balanceFormatted * audToUsd;
      } else if (asset.symbol === "USDC") {
        // USDC to USD (1:1)
        total += balanceFormatted;
      }
    }

    return total;
  })();

  return {
    totalUsd,
    isLoading,
  };
};
