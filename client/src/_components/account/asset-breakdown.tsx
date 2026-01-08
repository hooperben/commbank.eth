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
import { Separator } from "@/_components/ui/separator";
import { ArrowRight, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  defaultNetwork,
  mainnetAssets,
  sepoliaAssets,
  type SupportedAsset,
} from "shared/constants/token";
import { BalanceRow, PrivateBalanceRow, TotalBalanceRow } from "./balance";

export function AssetBreakdown() {
  const navigate = useNavigate();
  const assets: SupportedAsset[] =
    defaultNetwork === 1 ? mainnetAssets : sepoliaAssets;

  const [decryptModalOpen, setDecryptModalOpen] = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset | null>(
    null,
  );

  const handleEncryptClick = (asset: SupportedAsset) => {
    if (selectedAsset) {
      setSelectedAsset(asset === selectedAsset ? null : asset);
    } else {
      setSelectedAsset(asset);
    }
  };

  // TODO readd
  // const handleDecryptClick = (asset: SupportedAsset) => {
  //   setSelectedAsset(asset);
  //   setDecryptModalOpen(true);
  // };

  // const handleSendClick = (asset: SupportedAsset) => {
  //   setSelectedAsset(asset);
  //   setSendModalOpen(true);
  // };

  const handleCancelEncrypt = () => {
    setSelectedAsset(null);
  };

  const handleEncryptSuccess = () => {
    setSelectedAsset(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">Accounts</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/accounts")}
            >
              View Portfolio
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {assets.map((asset) => (
                  <>
                    <tr
                      key={asset.symbol}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-2 font-semibold text-left">
                        <div className="flex flex-row items-center gap-2">
                          <img
                            src={asset.logo}
                            className={`h-6 w-6 md:h-8 md:w-8 ${asset.symbol === "AUDD" && "invert dark:invert-0"}`}
                          />
                          <span className="md:text-lg">{asset.symbol}</span>
                        </div>
                      </td>

                      <td className="md:p-3 font-medium">
                        <div className="flex items-center gap-4">
                          <div className="w-[120px] text-right">
                            <TotalBalanceRow
                              key={`${asset.address}${asset.chainId}`}
                              asset={asset}
                            />
                          </div>

                          <Separator
                            orientation="vertical"
                            className="h-[20px]! bg-primary/30"
                          />

                          <div className="flex flex-col min-w-[100px]">
                            <div className="flex text-xs flex-row justify-between items-center gap-2">
                              <span className="text-muted-foreground">
                                Public:
                              </span>
                              <BalanceRow
                                key={`${asset.address}${asset.chainId}`}
                                asset={asset}
                              />
                            </div>

                            <div className="flex text-xs flex-row justify-between items-center gap-3">
                              <span className="text-muted-foreground">
                                Private:
                              </span>
                              <PrivateBalanceRow asset={asset} />
                            </div>
                          </div>

                          <Button
                            size="icon"
                            onClick={() => handleEncryptClick(asset)}
                            variant="outline"
                            className="hidden sm:inline-flex"
                          >
                            <ArrowRightLeft className="h-4 w-4 rotate-90" />
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {selectedAsset && selectedAsset.symbol === asset.symbol && (
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
