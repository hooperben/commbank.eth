import { getAllNotes } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import type { SupportedAsset } from "shared/constants/token";

export type PrivateBalance = {
  asset: SupportedAsset;
  balance: bigint;
};

/**
 * Hook to fetch private balances for multiple assets from IndexedDB
 * @param assets - Array of assets to get balances for
 */
export function usePrivateBalances(assets: SupportedAsset[]) {
  return useQuery({
    queryKey: ["privateBalances", assets.map((a) => a.address)],
    queryFn: async () => {
      const allNotes = await getAllNotes();

      const balances: PrivateBalance[] = assets.map((asset) => {
        const assetNotes = allNotes.filter(
          (note) => BigInt(note.assetId) === BigInt(asset.address),
        );

        const balance = assetNotes.reduce((acc, note) => {
          return acc + (note.isUsed ? 0n : BigInt(note.assetAmount));
        }, 0n);

        return { asset, balance };
      });

      return balances;
    },
    enabled: assets.length > 0,
  });
}
