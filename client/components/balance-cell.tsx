"use client";

import { useTokenPrices } from "@/hooks/use-token-prices";
import { useCurrency } from "@/lib/currency-context";
import { formatCurrency } from "@/lib/currency-utils";
import { Loader2 } from "lucide-react";

interface BalanceCellProps {
  amount: number;
  symbol: string;
}

// Map token symbols to the API keys used in the price data
const getTokenPriceKey = (symbol: string): string => {
  const symbolMap: Record<string, string> = {
    BTC: "bitcoin",
    ETH: "ethereum",
    AUDD: "novatti-australian-digital-dollar",
    USDC: "usd-coin",
  };
  return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
};

export function BalanceCell({ amount, symbol }: BalanceCellProps) {
  const { currency } = useCurrency();
  const { data: tokenPriceData, isLoading: isLoadingTokenPrices } =
    useTokenPrices();

  if (isLoadingTokenPrices) {
    return (
      <div className="font-medium flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-muted-foreground">Loading price...</span>
      </div>
    );
  }

  // Get the token price data
  const tokenKey = getTokenPriceKey(symbol);
  const tokenPrice = tokenPriceData?.[tokenKey as keyof typeof tokenPriceData];

  if (!tokenPrice) {
    // Fallback for tokens without price data
    const fallbackValue = amount;
    const formattedAmount = formatCurrency(fallbackValue, currency, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });

    return (
      <div className="font-medium">
        <div>{formattedAmount}</div>
        <div className="text-xs text-muted-foreground">
          {new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 4,
          }).format(amount)}{" "}
          {symbol}
        </div>
      </div>
    );
  }

  // Use the actual token price data based on selected currency
  const pricePerToken = currency === "USD" ? tokenPrice.usd : tokenPrice.aud;
  const totalValue = amount * pricePerToken;

  const formattedAmount = formatCurrency(totalValue, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

  return (
    <div className="font-medium">
      <div>{formattedAmount}</div>
      <div className="text-xs text-muted-foreground">
        {new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6,
        }).format(amount)}{" "}
        {symbol}
      </div>
    </div>
  );
}
