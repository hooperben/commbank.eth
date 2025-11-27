"use client";

import { Button } from "@/components/ui/button";
import { useEncryptMutation } from "@/hooks/use-encrypt-mutation";
import { Loader2 } from "lucide-react";
import type { EncryptData } from "./encrypt-modal";

export function ConfirmEncryptStep({
  data,
  onBack,
  onSuccess,
}: {
  data: EncryptData;
  onBack: () => void;
  onSuccess: (txHash: string, explorerUrl: string) => void;
}) {
  const { mutate: encrypt, isPending, error } = useEncryptMutation();

  const estimatedCost = 0.00003; // ETH
  const costUSD = 50; // Approximate USD

  const handleConfirm = () => {
    encrypt(
      {
        assetId: data.asset.address,
        chainId: data.asset.chainId,
        amount: data.amount,
        decimals: data.asset.decimals,
      },
      {
        onSuccess: (result) => {
          onSuccess(result?.txHash, "");
        },
      },
    );
  };
  return (
    <div className="">
      <div className="space-y-6 text-center">
        <p className="">You're about to encrypt</p>

        {/* Asset Display */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-3xl  font-light">{data.amount}</div>
          <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
            <span className="">◎</span>
          </div>
          <div className="text-xl ">
            {data.asset.name} ({data.asset.symbol})
          </div>
        </div>

        {/* Outcome Info */}
        <div className="bg-white/5 border border-white/10 p-6 rounded space-y-2 text-sm">
          <p className="text-xl">Once this is complete, you'll have:</p>
          <p className="">
            {99 - data.amount} {data.asset.symbol} Publicly Available
          </p>
          <p className="">
            {data.amount} {data.asset.symbol} Encrypted
          </p>
        </div>

        {/* Cost Info */}
        <p className="text-xs text-white/60">
          This TX will cost approximately {estimatedCost} ETH ({costUSD}¢ USD)
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-center text-xs text-red-400">{error.message}</div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 pt-4">
        <Button onClick={onBack} disabled={isPending} variant="secondary">
          Back
        </Button>
        <Button onClick={handleConfirm} disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? "Confirming..." : "Confirm"}
        </Button>
      </div>
    </div>
  );
}
