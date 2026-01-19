import { useAudUsdPrice, useEthUsdPrice } from "@/_hooks/use-chainlink-price";
import { useERC20Balances } from "@/_hooks/use-erc20-balance";
import { usePrivateBalances } from "@/_hooks/use-private-balances";
import { ethers } from "ethers";
import {
  defaultNetwork,
  mainnetAssets,
  arbSepoliaAssets,
  type SupportedAsset,
} from "shared/constants/token";

export const useAccountTotal = () => {
  const assets: SupportedAsset[] =
    defaultNetwork === 1 ? mainnetAssets : arbSepoliaAssets;

  // Fetch prices
  const { data: ethUsdPrice, isLoading: isLoadingEthPrice } = useEthUsdPrice();
  const { data: audUsdPrice, isLoading: isLoadingAudPrice } = useAudUsdPrice();

  // Fetch erc20 balances
  const { data: assetBalances, isLoading: isLoadingAsset } =
    useERC20Balances(assets);

  const { data: privateBalances, isLoading: isLoadingPrivate } =
    usePrivateBalances(assets);

  // Helper to convert asset balance to USD
  const assetToUsd = (
    symbol: string,
    balance: bigint,
    decimals: number,
  ): number => {
    if (!ethUsdPrice || !audUsdPrice) return 0;

    const balanceFormatted = parseFloat(ethers.formatUnits(balance, decimals));

    if (symbol === "ETH") {
      const ethPrice = parseFloat(ethUsdPrice.formattedPrice);
      return balanceFormatted * ethPrice;
    } else if (symbol === "AUDD") {
      const audToUsd = parseFloat(audUsdPrice.formattedPrice);
      return balanceFormatted * audToUsd;
    } else if (symbol === "USDC") {
      return balanceFormatted;
    }

    return 0;
  };

  // Calculate total value in USD (public + private balances)
  const totalUsd = (() => {
    if (!ethUsdPrice || !audUsdPrice || !assetBalances) return 0;

    let total = 0;

    // Add public ERC20 balances
    for (const asset of assetBalances) {
      if (!asset.balance) continue;
      total += assetToUsd(asset.symbol, asset.balance, asset.decimals);
    }

    // Add private note balances
    if (privateBalances) {
      for (const { asset, balance } of privateBalances) {
        if (balance === 0n) continue;
        total += assetToUsd(asset.symbol, balance, asset.decimals);
      }
    }

    return total;
  })();

  return {
    totalUsd,
    isLoading:
      isLoadingEthPrice ||
      isLoadingAudPrice ||
      isLoadingAsset ||
      isLoadingPrivate,
  };
};
