import { useAudUsdPrice, useEthUsdPrice } from "@/_hooks/use-chainlink-price";
import { useERC20Balances } from "@/_hooks/use-erc20-balance";
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

  // fetch erc20 balances
  const { data: assetBalances, isLoading: isLoadingAsset } =
    useERC20Balances(assets);

  // TODO add note balances here

  // Calculate total value in USD
  const totalUsd = (() => {
    if (!ethUsdPrice || !audUsdPrice || !assetBalances) return 0;

    let total = 0;

    for (const asset of assetBalances) {
      if (!asset.balance) continue;

      const balanceFormatted = parseFloat(
        ethers.formatUnits(asset.balance, asset.decimals),
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
    isLoading: isLoadingEthPrice || isLoadingAudPrice || isLoadingAsset,
  };
};
