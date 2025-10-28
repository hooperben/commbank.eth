import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface CurrencyData {
  usd: number;
  usd_24h_change: number;
  aud: number;
  aud_24h_change: number;
}

interface TokenPricesResponse {
  bitcoin: CurrencyData;
  ethereum: CurrencyData;
  "novatti-australian-digital-dollar": CurrencyData;
  "usd-coin": CurrencyData;
}

const getTokenPrices = async (): Promise<TokenPricesResponse | undefined> => {
  try {
    const { data } = await axios.get(
      "https://commbank-eth.vercel.app/api/prices",
    );

    return data;
  } catch (err) {
    console.error(err);
    return undefined;
  }
};

export const useTokenPrices = () => {
  const queryFn = useQuery({
    queryFn: getTokenPrices,
    queryKey: ["token-prices"],
  });

  return queryFn;
};
