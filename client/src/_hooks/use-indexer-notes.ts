import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { IndexerNotePayload } from "@/_types";

interface NotePayloadResponse {
  envio_Commbankdoteth_NotePayload: IndexerNotePayload[];
}

export const fetchIndexerNotes = async (
  limit: number = 50,
  offset: number = 0,
): Promise<IndexerNotePayload[]> => {
  const restUrl = `https://hasura-production-0b6a.up.railway.app/api/rest/Commbankdoteth_NotePayload/${limit}/${offset}`;

  const response = await axios.get<NotePayloadResponse>(restUrl, {
    headers: {
      "Content-Type": "application/json",
      "X-Hasura-Role": "client",
    },
  });

  return response.data.envio_Commbankdoteth_NotePayload;
};

export const useIndexerNotes = (limit: number = 50, offset: number = 0) => {
  return useQuery({
    queryKey: ["indexer-notes", limit, offset],
    queryFn: () => fetchIndexerNotes(limit, offset),
    retry: 1,
    refetchInterval: 20_000, // refetch every 20 seconds
  });
};
