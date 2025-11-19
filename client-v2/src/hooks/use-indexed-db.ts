import { useEffect, useState, useCallback } from "react";
import * as db from "@/lib/db";
import type { Note, TreeLeaf, Payload, Meta } from "@/_types";

/**
 * USAGE EXAMPLES:
 *
 * Basic usage (just database operations):
 * ```tsx
 * const db = useIndexedDB();
 *
 * // Check if initialized
 * if (!db.isInitialized) return <Loading />;
 *
 * // Use database operations
 * await db.addNote(myNote);
 * const notes = await db.getAllNotes();
 * ```
 *
 * With stats tracking (for dashboard/testing):
 * ```tsx
 * const { stats, allNotes, refresh, db } = useDBStats();
 *
 * // Stats auto-refresh when data changes
 * console.log(stats.notes, stats.unusedNotes);
 *
 * // Access all data
 * console.log(allNotes, allTreeLeaves);
 *
 * // Manual refresh
 * await refresh();
 * ```
 */

/**
 * Hook to manage IndexedDB initialization and provide database operations
 * Ensures the database is initialized before any operations can be performed
 */
export function useIndexedDB() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize database on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        await db.initDB();
        setIsInitialized(true);
      } catch (err) {
        console.error("Failed to initialize IndexedDB:", err);
        setError(
          err instanceof Error
            ? err
            : new Error("Failed to initialize database"),
        );
        setIsInitialized(false);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, []);

  // Notes operations
  const addNote = useCallback(
    async (note: Note) => {
      if (!isInitialized) throw new Error("Database not initialized");
      return db.addNote(note);
    },
    [isInitialized],
  );

  const getNote = useCallback(
    async (id: string) => {
      if (!isInitialized) throw new Error("Database not initialized");
      return db.getNote(id);
    },
    [isInitialized],
  );

  const getAllNotes = useCallback(async () => {
    if (!isInitialized) throw new Error("Database not initialized");
    return db.getAllNotes();
  }, [isInitialized]);

  const getUnusedNotes = useCallback(async () => {
    if (!isInitialized) throw new Error("Database not initialized");
    return db.getUnusedNotes();
  }, [isInitialized]);

  const updateNote = useCallback(
    async (note: Note) => {
      if (!isInitialized) throw new Error("Database not initialized");
      return db.updateNote(note);
    },
    [isInitialized],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      if (!isInitialized) throw new Error("Database not initialized");
      return db.deleteNote(id);
    },
    [isInitialized],
  );

  const clearNotes = useCallback(async () => {
    if (!isInitialized) throw new Error("Database not initialized");
    return db.clearNotes();
  }, [isInitialized]);

  // Tree operations
  const addTreeLeaf = useCallback(
    async (leaf: TreeLeaf) => {
      if (!isInitialized) throw new Error("Database not initialized");
      return db.addTreeLeaf(leaf);
    },
    [isInitialized],
  );

  const getTreeLeaf = useCallback(
    async (id: string) => {
      if (!isInitialized) throw new Error("Database not initialized");
      return db.getTreeLeaf(id);
    },
    [isInitialized],
  );

  const getAllTreeLeaves = useCallback(async () => {
    if (!isInitialized) throw new Error("Database not initialized");
    return db.getAllTreeLeaves();
  }, [isInitialized]);

  const deleteTreeLeaf = useCallback(
    async (id: string) => {
      if (!isInitialized) throw new Error("Database not initialized");
      return db.deleteTreeLeaf(id);
    },
    [isInitialized],
  );

  const clearTree = useCallback(async () => {
    if (!isInitialized) throw new Error("Database not initialized");
    return db.clearTree();
  }, [isInitialized]);

  // Payload operations
  const addPayload = useCallback(
    async (payload: Payload) => {
      if (!isInitialized) throw new Error("Database not initialized");
      return db.addPayload(payload);
    },
    [isInitialized],
  );

  const getPayload = useCallback(
    async (id: string) => {
      if (!isInitialized) throw new Error("Database not initialized");
      return db.getPayload(id);
    },
    [isInitialized],
  );

  const getAllPayloads = useCallback(async () => {
    if (!isInitialized) throw new Error("Database not initialized");
    return db.getAllPayloads();
  }, [isInitialized]);

  const deletePayload = useCallback(
    async (id: string) => {
      if (!isInitialized) throw new Error("Database not initialized");
      return db.deletePayload(id);
    },
    [isInitialized],
  );

  const clearPayloads = useCallback(async () => {
    if (!isInitialized) throw new Error("Database not initialized");
    return db.clearPayloads();
  }, [isInitialized]);

  // Meta operations
  const getMeta = useCallback(async () => {
    if (!isInitialized) throw new Error("Database not initialized");
    return db.getMeta();
  }, [isInitialized]);

  const updateMeta = useCallback(
    async (meta: Partial<Meta>) => {
      if (!isInitialized) throw new Error("Database not initialized");
      return db.updateMeta(meta);
    },
    [isInitialized],
  );

  const incrementLastId = useCallback(async () => {
    if (!isInitialized) throw new Error("Database not initialized");
    return db.incrementLastId();
  }, [isInitialized]);

  // Utility operations
  const clearAllData = useCallback(async () => {
    if (!isInitialized) throw new Error("Database not initialized");
    return db.clearAllData();
  }, [isInitialized]);

  const getDBStats = useCallback(async () => {
    if (!isInitialized) throw new Error("Database not initialized");
    return db.getDBStats();
  }, [isInitialized]);

  return {
    // Status
    isInitialized,
    isInitializing,
    error,

    // Notes
    addNote,
    getNote,
    getAllNotes,
    getUnusedNotes,
    updateNote,
    deleteNote,
    clearNotes,

    // Tree
    addTreeLeaf,
    getTreeLeaf,
    getAllTreeLeaves,
    deleteTreeLeaf,
    clearTree,

    // Payload
    addPayload,
    getPayload,
    getAllPayloads,
    deletePayload,
    clearPayloads,

    // Meta
    getMeta,
    updateMeta,
    incrementLastId,

    // Utility
    clearAllData,
    getDBStats,
  };
}

/**
 * Hook to reactively track database statistics
 * Automatically refreshes stats and provides data
 */
// TODO probably remove after initial dev?
export function useDBStats() {
  const indexedDB = useIndexedDB();
  const [stats, setStats] = useState<{
    notes: number;
    unusedNotes: number;
    treeLeaves: number;
    payloads: number;
  } | null>(null);
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [allTreeLeaves, setAllTreeLeaves] = useState<TreeLeaf[]>([]);
  const [allPayloads, setAllPayloads] = useState<Payload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Auto-refresh when database is initialized - only once
  useEffect(() => {
    const loadData = async () => {
      if (!indexedDB.isInitialized) return;

      try {
        setIsLoading(true);
        const [statsData, notes, leaves, payloads] = await Promise.all([
          indexedDB.getDBStats(),
          indexedDB.getAllNotes(),
          indexedDB.getAllTreeLeaves(),
          indexedDB.getAllPayloads(),
        ]);

        setStats(statsData);
        setAllNotes(notes);
        setAllTreeLeaves(leaves);
        setAllPayloads(payloads);
      } catch (error) {
        console.error("Failed to refresh DB stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexedDB.isInitialized]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!indexedDB.isInitialized) return;

    try {
      setIsLoading(true);
      const [statsData, notes, leaves, payloads] = await Promise.all([
        indexedDB.getDBStats(),
        indexedDB.getAllNotes(),
        indexedDB.getAllTreeLeaves(),
        indexedDB.getAllPayloads(),
      ]);

      setStats(statsData);
      setAllNotes(notes);
      setAllTreeLeaves(leaves);
      setAllPayloads(payloads);
    } catch (error) {
      console.error("Failed to refresh DB stats:", error);
    } finally {
      setIsLoading(false);
    }
    // We intentionally only depend on isInitialized to avoid infinite loops
    // The functions are stable enough for this use case
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indexedDB.isInitialized]);

  return {
    stats,
    allNotes,
    allTreeLeaves,
    allPayloads,
    isLoading,
    refresh,
    db: indexedDB,
  };
}
