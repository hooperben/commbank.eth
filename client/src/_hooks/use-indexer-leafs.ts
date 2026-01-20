import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { IndexerLeafInserted } from "@/_types";
import { defaultNetwork } from "shared/constants/token";

interface LeafInsertedResponse {
  envio_Commbankdoteth_LeafInserted: IndexerLeafInserted[];
}

export const fetchIndexerLeafs = async (
  limit: number = 50,
  offset: number = 0,
): Promise<IndexerLeafInserted[]> => {
  // URL-encode the % wildcard as %25
  const chainIdPattern = encodeURIComponent(`${defaultNetwork}_%`);
  const restUrl = `https://hasura-production-0b6a.up.railway.app/api/rest/Commbankdoteth_LeafInserted/${chainIdPattern}/${limit}/${offset}`;

  const response = await axios.get<LeafInsertedResponse>(restUrl, {
    headers: {
      "Content-Type": "application/json",
      "X-Hasura-Role": "client",
    },
  });

  return response.data.envio_Commbankdoteth_LeafInserted;
};

export const useIndexerLeafs = (limit: number = 50, offset: number = 0) => {
  return useQuery({
    queryKey: ["indexer-leafs", limit, offset],
    queryFn: () => fetchIndexerLeafs(limit, offset),
    retry: 3,
    refetchInterval: 20_000, // refetch every 20 seconds
  });
};
