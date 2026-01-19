import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { defaultNetwork } from "shared/constants/token";

interface IndexerNullifier {
  id: string;
  nullifier: string;
}

interface NullifierResponse {
  envio_Commbankdoteth_NullifierUsed: IndexerNullifier[];
}

export const fetchIndexerNullifiers = async (
  limit: number = 50,
  offset: number = 0,
): Promise<IndexerNullifier[]> => {
  // URL-encode the % wildcard as %25
  const chainIdPattern = encodeURIComponent(`${defaultNetwork}_%`);
  // Note: this endpoint uses /:chainId/:offset/:limit (different order than notes)
  const restUrl = `https://hasura-production-0b6a.up.railway.app/api/rest/Commbankdoteth_NullifierUsed/${chainIdPattern}/${offset}/${limit}`;

  const response = await axios.get<NullifierResponse>(restUrl, {
    headers: {
      "Content-Type": "application/json",
      "X-Hasura-Role": "client",
    },
  });

  return response.data.envio_Commbankdoteth_NullifierUsed;
};

export const useIndexerNullifiers = (
  limit: number = 50,
  offset: number = 0,
) => {
  return useQuery({
    queryKey: ["indexer-nullifiers", limit, offset],
    queryFn: () => fetchIndexerNullifiers(limit, offset),
    retry: 1,
    refetchInterval: 20_000, // refetch every 20 seconds
  });
};
