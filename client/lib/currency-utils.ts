import type { Currency } from "./currency-context";

export function formatCurrency(
  amount: number,
  currency: Currency,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  },
): string {
  const locale = currency === "AUD" ? "en-AU" : "en-US";
  const currencyCode = currency;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 6,
  }).format(amount);
}

export function getCurrencySymbol(currency: Currency): string {
  return currency === "AUD" ? "A$" : "$";
}

export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  exchangeRate?: number,
): number {
  if (fromCurrency === toCurrency) return amount;

  // Use provided exchange rate if available, otherwise fallback to approximate rate
  const USD_TO_AUD_RATE = exchangeRate || 1.53;

  if (fromCurrency === "USD" && toCurrency === "AUD") {
    return amount * USD_TO_AUD_RATE;
  } else if (fromCurrency === "AUD" && toCurrency === "USD") {
    return amount / USD_TO_AUD_RATE;
  }

  return amount;
}
