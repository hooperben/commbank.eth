import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { IndexerLeafInserted } from "@/_types";
import { getIndexerUrl } from "@/lib/indexer";

interface LeafInsertedResponse {
  envio_Commbankdoteth_LeafInserted: IndexerLeafInserted[];
}

const fetchIndexerLeafs = async (
  limit: number = 50,
  offset: number = 0,
): Promise<IndexerLeafInserted[]> => {
  const query = `
    query GetLeafInserted($limit: Int!, $offset: Int!) {
      envio_Commbankdoteth_LeafInserted(limit: $limit, offset: $offset, order_by: {id: desc}) {
        id
        leafIndex
        leafValue
      }
    }
  `;

  const response = await axios.post<{ data: LeafInsertedResponse }>(
    getIndexerUrl(),
    {
      query,
      variables: { limit, offset },
    },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Hasura-Role": "client",
      },
    },
  );

  return response.data.data.envio_Commbankdoteth_LeafInserted;
};

export const useIndexerLeafs = (limit: number = 50, offset: number = 0) => {
  return useQuery({
    queryKey: ["indexer-leafs", limit, offset],
    queryFn: () => fetchIndexerLeafs(limit, offset),
    retry: 1,
  });
};
