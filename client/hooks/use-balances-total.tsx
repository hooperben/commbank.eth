import { useTokenPrices } from "./use-token-prices";
import { useTokenBalances } from "./use-token-balances";
import { useEffect } from "react";
import { useCurrency } from "@/lib/currency-context";

const coingeckoToSymbol = {
  bitcoin: "BTC",
  ethereum: "ETH",
  "novatti-australian-digital-dollar": "AUDD",
  "usd-coin": "USDC",
};

const symbolToCoingecko = Object.fromEntries(
  Object.entries(coingeckoToSymbol).map(([k, v]) => [v, k]),
) as Record<string, keyof typeof coingeckoToSymbol>;

export const useBalancesTotal = (address?: string) => {
  const {
    data: tokenPriceData,
    isLoading: isPriceLoading,
    error: priceError,
  } = useTokenPrices();
  const { data: tokenBalanceData, isLoading: isBalanceLoading } =
    useTokenBalances(address);

  const { currency } = useCurrency();

  const isLoading = isPriceLoading || isBalanceLoading;
  const error = priceError;

  useEffect(() => {
    console.log("tokenPriceData: ", tokenPriceData);
    console.log("tokenBalanceData: ", tokenBalanceData);
  }, [tokenPriceData, tokenBalanceData]);

  if (tokenPriceData && tokenBalanceData) {
    console.log("tokenPriceData: ", tokenPriceData);
    console.log("tokenBalanceData: ", tokenBalanceData);

    const balancesWithValues = tokenBalanceData.map((item) => {
      const currentCG = symbolToCoingecko[item.symbol];

      if (!currentCG || !tokenPriceData[currentCG]) {
        console.warn(`Price data not found for symbol: ${item.symbol}`);
        return { ...item, value: 0 };
      }

      const currentValue =
        currency === "USD"
          ? tokenPriceData[currentCG].usd
          : tokenPriceData[currentCG].aud;

      const value = Number(item.balance) * currentValue;

      console.log("value of: ", currentCG, value);

      return { ...item, value };
    });

    const sum = balancesWithValues.reduce(
      (acc, item) => acc + (item.value || 0),
      0,
    );

    return {
      data: sum,
      isLoading,
      error,
    };
  }

  return {
    data: undefined,
    isLoading,
    error,
  };
};
