import type { SupportedAsset } from "shared/constants/token";
import { useUserAssetNotes } from "./use-user-asset-notes";

export const usePrivateBalance = (asset: SupportedAsset | undefined) => {
  const {
    data: assetNotes,
    isLoading,
    refetch,
  } = useUserAssetNotes(asset?.address);

  const assetTotal = assetNotes
    ? assetNotes.reduce((acc, curr) => {
        return acc + (curr.isUsed ? 0n : BigInt(curr.assetAmount));
      }, 0n)
    : undefined;

  return { assetTotal, assetNotes, isLoading, refetch };
};
