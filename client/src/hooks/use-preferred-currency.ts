import { useEffect, useState } from "react";

export type Currency = "AUD" | "USD";

const STORAGE_KEY = "preferredCurrency";

export const usePreferredCurrency = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState<Currency>("AUD");

  useEffect(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "AUD" || stored === "USD") {
        setCurrency(stored);
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Persist to localStorage whenever currency changes (skip initial load)
    if (!isLoading && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, currency);
    }
  }, [currency, isLoading]);

  const toggleCurrency = () => {
    setCurrency((prev) => (prev === "AUD" ? "USD" : "AUD"));
  };

  return {
    currency,
    setCurrency,
    toggleCurrency,
    isLoading,
  };
};
