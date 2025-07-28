"use client";

import { useCurrency } from "@/lib/currency-context";
import { formatCurrency, convertCurrency } from "@/lib/currency-utils";

interface BalanceCellProps {
  amount: number;
  symbol: string;
}

export function BalanceCell({ amount, symbol }: BalanceCellProps) {
  const { currency } = useCurrency();

  // For stablecoins, assume ~$1 USD value per token
  // Convert to selected currency for display
  const usdValue = amount; // 1 token ≈ $1 USD for stablecoins
  const displayAmount = convertCurrency(usdValue, "USD", currency);
  const formattedAmount = formatCurrency(displayAmount, currency, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });

  return (
    <div className="font-medium">
      <div>
        {formattedAmount} {currency === "USD" ? "USD" : "AUD"}
      </div>
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
