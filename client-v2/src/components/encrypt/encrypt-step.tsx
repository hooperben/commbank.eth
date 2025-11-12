"use client";

import { useState } from "react";
import { sepoliaAssets } from "shared/constants/token";
import type { EncryptData } from "./encrypt-modal";
import { Loader2 } from "lucide-react";
import { useERC20Balance } from "@/hooks/use-erc20-balance";
import { ethers } from "ethers";

export function EncryptStep({
  onSelectAsset,
}: {
  onSelectAsset: (data: EncryptData) => void;
}) {
  const [selectedAsset, setSelectedAsset] = useState<
    (typeof sepoliaAssets)[0] | null
  >(null);
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
    <div className="space-y-8 py-8">
      <div>
        <h2 className="text-3xl font-light mb-2 font-mono">Encrypt</h2>
        <p className="text-sm mb-4">
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
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full bg-transparent text-2xl font-mono outline-none placeholder-white/20"
            />
          </div>

          <div className="border border-white/20 p-4 rounded">
            <label className="text-xs mb-2 block">Asset</label>
            <select
              value={selectedAsset?.address || ""}
              onChange={(e) => {
                const asset = sepoliaAssets.find(
                  (a) => a.address === e.target.value,
                );
                setSelectedAsset(asset || null);
                setAmount("");
              }}
              className="w-full bg-transparent text-xl font-mono outline-none "
            >
              <option value="" className="bg-black">
                Select asset...
              </option>
              {sepoliaAssets.map((asset) => (
                <option
                  key={asset.address}
                  value={asset.address}
                  className="bg-black"
                >
                  {asset.symbol}
                </option>
              ))}
            </select>
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
                {/* TODO */}
                <div className="text">0 {selectedAsset.symbol} already PUM</div>
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
        <button
          onClick={handleProceed}
          disabled={!isValid}
          className="border border-white/20 px-12 py-3 rounded font-mono disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition-colors"
        >
          Proceed
        </button>
      </div>
    </div>
  );
}
