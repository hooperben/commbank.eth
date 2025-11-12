"use client";

import type { EncryptData } from "./encrypt-modal";
import { ExternalLink } from "lucide-react";

export function SuccessStep({
  data,
  txHash,
  explorerUrl,
  onClose,
}: {
  data: EncryptData;
  txHash: string;
  explorerUrl: string;
  onClose: () => void;
}) {
  return (
    <div className="space-y-8 py-8">
      <h2 className="text-3xl font-light font-mono">Funds Encrypted!</h2>

      <div className="space-y-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <p className="text-white/60">You've encrypted</p>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-white/20 px-4 py-1 rounded text-xs font-mono text-white hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            View on Explorer
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Asset Display */}
        <div className="flex items-center justify-center gap-4">
          <div className="text-3xl font-mono font-light">{data.amount}</div>
          <div className="w-12 h-12 border border-white/20 rounded-full flex items-center justify-center">
            <span className="text-white/60">◎</span>
          </div>
          <div className="text-xl font-mono">
            {data.asset.name} ({data.asset.symbol})
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-white/60">
          You can view this transaction in your account history.
        </p>

        {/* TX Hash Display */}
        <div className="text-xs font-mono text-white/40 break-all">
          {txHash}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <button
          onClick={onClose}
          className="border border-white/20 px-12 py-3 rounded font-mono text-white hover:bg-white/5 transition-colors w-full"
        >
          View Account
        </button>
      </div>
    </div>
  );
}
