"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useERC20Balance } from "@/hooks/use-erc20-balance";
import { ethers } from "ethers";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  defaultNetwork,
  mainnetAssets,
  sepoliaAssets,
} from "shared/constants/token";
import type { EncryptData } from "./encrypt-modal";

export function EncryptStep({
  onSelectAsset,
}: {
  onSelectAsset: (data: EncryptData) => void;
}) {
  const assets = defaultNetwork === 1 ? mainnetAssets : sepoliaAssets;
  const [selectedAsset, setSelectedAsset] = useState<(typeof assets)[0] | null>(
    null,
  );
  const [amount, setAmount] = useState<string>("");

  const { data: balance, isLoading: isLoadingBalance } =
    useERC20Balance(selectedAsset);

  const isValid =
    selectedAsset &&
    amount &&
    Number.parseFloat(amount) > 0 &&
    balance &&
    ethers.parseUnits(amount, selectedAsset.decimals);

  const handleProceed = () => {
    if (!selectedAsset || !isValid) return;

    onSelectAsset({
      asset: selectedAsset,
      amount: Number.parseFloat(amount),
    });
  };

  return (
    <div className="">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-light">Encrypt</h2>
        <p className="text-sm">
          Move assets from public to private, using commbank.eth's Private
          Unstoppable Money.
        </p>
        <p className="text-xs">
          There is a more in depth explanation of Private Unstoppable Money
          here.
        </p>
      </div>

      <div className="space-y-6">
        {/* Asset Selector */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-white/20 p-4 rounded">
            <label className="text-xs mb-2 block">Amount</label>
            <Input
              type="number"
              placeholder="Amount"
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="border border-white/20 p-4 rounded">
            <label className="text-xs mb-2 block">Asset</label>

            <Select
              value={selectedAsset?.address}
              // TODO make ID lookup
              onValueChange={(value) => {
                const asset = assets.find((item) => item.address === value);
                setSelectedAsset(asset ?? null);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.address} value={asset.address}>
                    {asset.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Balance Info */}
        {selectedAsset && (
          <div className="text-right text-xs space-y-1">
            {isLoadingBalance ? (
              <div className="flex items-center justify-end gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Loading balance...</span>
              </div>
            ) : (
              <>
                <div className="text">
                  {ethers.formatUnits(balance, selectedAsset.decimals)}{" "}
                  {selectedAsset.symbol} Available
                </div>
              </>
            )}
          </div>
        )}

        {/* Error State */}
        <div className="text-center text-xs text-red-400/60">
          {/* Error text placeholder */}
        </div>
      </div>

      {/* Proceed Button */}
      <div className="flex justify-end">
        <Button variant="ghost" onClick={handleProceed} disabled={!isValid}>
          Next
        </Button>
      </div>
    </div>
  );
}
