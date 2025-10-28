"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Currency = "USD" | "AUD";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedCurrency = localStorage.getItem("selectedCurrency") as Currency;
    if (storedCurrency && (storedCurrency === "USD" || storedCurrency === "AUD")) {
      setCurrencyState(storedCurrency);
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedCurrency", newCurrency);
    }
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}