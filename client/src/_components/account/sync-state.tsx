import type { TreeLeaf } from "@/_types";
import { useIndexerLeafs } from "@/_hooks/use-indexer-leafs";
import { useIndexerNotes } from "@/_hooks/use-indexer-notes";
import { addTreeLeaf, getAllTreeLeaves } from "@/lib/db";
import { useEffect, useState } from "react";
import { SyncButton } from "./sync-button";

type SyncState = "syncing" | "complete" | "error";

export const SyncState = () => {
  const [syncState, setSyncState] = useState<SyncState>("syncing");
  const [errorMessage, setErrorMessage] = useState<string>();

  const { data: indexerLeafs, isLoading: isLoadingLeafs } = useIndexerLeafs();
  const { data: indexerNotes, isLoading: isLoadingNotes } = useIndexerNotes();

  useEffect(() => {
    const syncData = async () => {
      try {
        // Wait for both queries to finish loading
        if (isLoadingLeafs || isLoadingNotes) {
          setSyncState("syncing");
          return;
        }

        // Get existing data from IndexedDB
        const [existingLeafs] = await Promise.all([getAllTreeLeaves()]);

        // Create sets of existing IDs for quick lookup
        const existingLeafIds = new Set(existingLeafs.map((leaf) => leaf.id));

        // Find new leafs that don't exist in IndexedDB
        const newLeafs: TreeLeaf[] = [];
        if (indexerLeafs) {
          for (const indexerLeaf of indexerLeafs) {
            if (!existingLeafIds.has(indexerLeaf.id)) {
              newLeafs.push({
                id: indexerLeaf.id,
                leafValue: indexerLeaf.leafValue,
                leafIndex: indexerLeaf.leafIndex,
              });
            }
          }
        }

        // Log what would be written to IndexedDB
        if (newLeafs.length > 0) {
          console.log("=== SYNC: New data to be written ===");

          if (newLeafs.length > 0) {
            console.log(`Found ${newLeafs.length} new leafs:`);
            console.log(newLeafs);
          }

          await Promise.all([...newLeafs.map((leaf) => addTreeLeaf(leaf))]);

          console.log("Wrote to DB");
        } else {
          console.log("=== SYNC: No new data to sync ===");
        }

        setSyncState("complete");
      } catch (error) {
        console.error("Sync error:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to sync data",
        );
        setSyncState("error");
      }
    };

    syncData();
  }, [indexerLeafs, indexerNotes, isLoadingLeafs, isLoadingNotes]);

  return <SyncButton state={syncState} errorMessage={errorMessage} />;
};
