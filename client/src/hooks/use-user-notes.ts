import { getAllNotes } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch all notes from IndexedDB
 */
export function useUserNotes() {
  return useQuery({
    queryKey: ["notes"],
    queryFn: getAllNotes,
  });
}
