import type { Payload, TreeLeaf } from "@/_types";
import { useIndexerLeafs } from "@/hooks/use-indexer-leafs";
import { useIndexerNotes } from "@/hooks/use-indexer-notes";
import { getAllPayloads, getAllTreeLeaves } from "@/lib/db";
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
        const [existingLeafs, existingPayloads] = await Promise.all([
          getAllTreeLeaves(),
          getAllPayloads(),
        ]);

        // Create sets of existing IDs for quick lookup
        const existingLeafIds = new Set(existingLeafs.map((leaf) => leaf.id));
        const existingPayloadIds = new Set(
          existingPayloads.map((payload) => payload.id),
        );

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

        // Find new payloads that don't exist in IndexedDB
        const newPayloads: Payload[] = [];
        if (indexerNotes) {
          for (const indexerNote of indexerNotes) {
            if (!existingPayloadIds.has(indexerNote.id)) {
              newPayloads.push({
                id: indexerNote.id,
                encryptedNote: indexerNote.encryptedNote,
              });
            }
          }
        }

        // Log what would be written to IndexedDB
        if (newLeafs.length > 0 || newPayloads.length > 0) {
          console.log("=== SYNC: New data to be written ===");

          if (newLeafs.length > 0) {
            console.log(`Found ${newLeafs.length} new leafs:`);
            console.log(newLeafs);
          }

          if (newPayloads.length > 0) {
            console.log(`Found ${newPayloads.length} new payloads:`);
            console.log(newPayloads);
          }

          // TODO: Uncomment when ready to write to database
          // await Promise.all([
          //   ...newLeafs.map((leaf) => addTreeLeaf(leaf)),
          //   ...newPayloads.map((payload) => addPayload(payload)),
          // ]);

          console.log("=== SYNC: Complete (data not written yet) ===");
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
