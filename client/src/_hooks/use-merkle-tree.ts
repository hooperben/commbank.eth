import { getAllTreeLeaves } from "@/lib/db";
import { useEffect, useState } from "react";
import { PoseidonMerkleTree } from "shared/classes/PoseidonMerkleTree";

/**
 * Hook to load and build a Poseidon Merkle Tree
 * 1. Fetches the base tree from full-tree.json
 * 2. Adds all leaves from IndexedDB to the tree
 * 3. Returns the complete tree instance
 */
export function useMerkleTree() {
  const [tree, setTree] = useState<PoseidonMerkleTree | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadTree = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch the base tree from public directory
        const treeResponse = await fetch("/full-tree.json"); // TODO should probably make this network specific
        if (!treeResponse.ok) {
          throw new Error("Failed to fetch tree data");
        }
        const treeJson = await treeResponse.text();
        const loadedTree = await PoseidonMerkleTree.fromJSON(treeJson);

        // Get all leaves from IndexedDB
        const dbLeaves = await getAllTreeLeaves();

        // Insert each leaf from the database into the tree
        for (const leaf of dbLeaves) {
          await loadedTree.insert(leaf.leafValue, Number(leaf.leafIndex));
        }

        setTree(loadedTree);
      } catch (err) {
        console.error("Failed to load merkle tree:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to load merkle tree"),
        );
        setTree(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadTree();
  }, []);

  return {
    tree,
    isLoading,
    error,
  };
}
