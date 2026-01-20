import { getAllNotes } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch all notes for a specific asset from IndexedDB
 * @param assetId - The asset address to filter notes by
 */
export function useUserAssetNotes(assetId: string | undefined) {
  return useQuery({
    queryKey: ["notes", assetId],
    queryFn: async () => {
      const allNotes = await getAllNotes();
      return allNotes.filter(
        (note) => BigInt(note.assetId) === BigInt(assetId ?? "0"),
      );
    },
    retry: 3,
    enabled: !!assetId,
  });
}
