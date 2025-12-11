import { DecryptModal } from "@/_components/PUM/decrypt-modal";
import { InlineEncryptConfirmation } from "@/_components/PUM/inline-encrypt-confirmation";
import { SendModal } from "@/_components/PUM/private-send-modal";
import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import {
  defaultNetwork,
  mainnetAssets,
  sepoliaAssets,
  type SupportedAsset,
} from "shared/constants/token";
import { BalanceRow, PrivateBalanceRow, TotalBalanceRow } from "./balance";
import { SyncState } from "./sync-state";

export function AssetBreakdown() {
  const assets: SupportedAsset[] =
    defaultNetwork === 1 ? mainnetAssets : sepoliaAssets;

  const [encryptingAsset, setEncryptingAsset] = useState<string | null>(null);
  const [decryptModalOpen, setDecryptModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset | null>(
    null,
  );

  const handleEncryptClick = (asset: SupportedAsset) => {
    setSelectedAsset(asset);
    setEncryptingAsset(asset.symbol);
  };

  const handleDecryptClick = (asset: SupportedAsset) => {
    setSelectedAsset(asset);
    setDecryptModalOpen(true);
  };

  const handleSendClick = (asset: SupportedAsset) => {
    setSelectedAsset(asset);
    setSendModalOpen(true);
  };

  const handleCancelEncrypt = () => {
    setEncryptingAsset(null);
    setSelectedAsset(null);
  };

  const handleEncryptSuccess = () => {
    setEncryptingAsset(null);
    setSelectedAsset(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Accounts</CardTitle>
            <SyncState />
          </div>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Asset</th>
                  <th className="text-center p-3 font-semibold">
                    Public Balance
                  </th>
                  <th className="text-center p-3 font-semibold">
                    Private Balance
                  </th>
                  <th className="text-right p-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <>
                    <tr
                      key={asset.symbol}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-3 font-semibold text-left">
                        {asset.symbol}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <BalanceRow
                            key={`${asset.address}${asset.chainId}`}
                            asset={asset}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleEncryptClick(asset)}
                          >
                            encrypt
                          </Button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <PrivateBalanceRow asset={asset} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleDecryptClick(asset)}
                          >
                            decrypt
                          </Button>
                        </div>
                      </td>
                      <td className="p-3 text-right font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleSendClick(asset)}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                          <TotalBalanceRow
                            key={`${asset.address}${asset.chainId}`}
                            asset={asset}
                          />
                        </div>
                      </td>
                    </tr>
                    {encryptingAsset === asset.symbol && selectedAsset && (
                      <tr key={`${asset.symbol}-encrypt`}>
                        <td colSpan={4} className="p-3">
                          <InlineEncryptConfirmation
                            asset={selectedAsset}
                            onCancel={handleCancelEncrypt}
                            onSuccess={handleEncryptSuccess}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <DecryptModal
        open={decryptModalOpen}
        onOpenChange={setDecryptModalOpen}
        asset={selectedAsset || undefined}
      />
      <SendModal
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
        asset={selectedAsset || undefined}
      />
    </>
  );
}
