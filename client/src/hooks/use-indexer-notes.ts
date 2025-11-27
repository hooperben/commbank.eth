import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { IndexerNotePayload } from "@/_types";
import { getIndexerUrl } from "@/lib/indexer";

interface NotePayloadResponse {
  Commbankdoteth_NotePayload: IndexerNotePayload[];
}

const fetchIndexerNotes = async (
  limit: number = 50,
  offset: number = 0,
): Promise<IndexerNotePayload[]> => {
  const query = `
    query GetNotePayloads($limit: Int!, $offset: Int!) {
      Commbankdoteth_NotePayload(limit: $limit, offset: $offset, order_by: {id: desc}) {
        id
        encryptedNote
      }
    }
  `;

  const response = await axios.post<{ data: NotePayloadResponse }>(
    getIndexerUrl(),
    {
      query,
      variables: { limit, offset },
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.data.Commbankdoteth_NotePayload;
};

export const useIndexerNotes = (limit: number = 50, offset: number = 0) => {
  return useQuery({
    queryKey: ["indexer-notes", limit, offset],
    queryFn: () => fetchIndexerNotes(limit, offset),
    retry: 1,
  });
};
