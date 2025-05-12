"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTestnet } from "@/hooks/use-testnet-mode";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { shortenAddress } from "@/helpers";
import { useAccountsData } from "@/hooks/use-accounts-data";
import { useTokenBalances } from "@/hooks/use-token-balances";
import {
  ArrowDownToLine,
  Check,
  Copy,
  ExternalLinkIcon,
  SendHorizontal,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { SendTransactionDialog } from "./send-transaction";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

const PublicAddressManager = () => {
  const { testnetEnabled, setTestnetEnabled } = useTestnet();
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [receiveAddress, setReceiveAddress] = useState("");

  // New state for send transaction dialog
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const { data: accountsData } = useAccountsData();
  const { data: tokenBalances, isLoading: isLoadingBalances } =
    useTokenBalances(accountsData);

  const [copiedPublic, setCopiedPublic] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPublic(true);
    setTimeout(() => setCopiedPublic(false), 2000);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Public Address
            <Badge variant="outline" className="ml-2">
              EVM
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">
                  {shortenAddress(accountsData.evm.address)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    accountsData.evm &&
                    copyToClipboard(accountsData.evm.address)
                  }
                >
                  {copiedPublic ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link
                    href={`https://etherscan.io/address/${accountsData.evm.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLinkIcon />
                  </Link>
                </Button>
              </div>
            </div>

            <Separator />

            <div className="pt-2">
              <div className="text-sm text-muted-foreground mb-1">Balance</div>
              {isLoadingBalances ? (
                <div className="h-12 flex items-center">
                  <div className="h-5 w-24 bg-muted animate-pulse rounded"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div className="font-mono text-xl font-semibold">
                      {tokenBalances?.usdc || "0"} USDC
                    </div>
                    <Badge variant="secondary">
                      ${tokenBalances?.usdc || "0"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 font-mono">
                    {tokenBalances?.eth || "0"} ETH
                  </div>
                  <Badge
                    variant="outline"
                    className="mt-3 w-full justify-center"
                  >
                    Only ethereum ETH and USDC are viewable at the moment -
                    support for more assets and networks is coming soon.
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                setReceiveAddress(accountsData.evm!.address);
                setReceiveDialogOpen(true);
              }}
            >
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Receive
            </Button>
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                setSendDialogOpen(true);
              }}
            >
              <SendHorizontal className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Receive Funds</DialogTitle>
            <DialogDescription>
              Scan this QR code or copy the address to receive funds.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={receiveAddress} size={200} />
            </div>
            <div className="flex flex-col items-center gap-2">
              <code className="bg-muted text-center px-2 py-1.5 rounded text-sm font-mono flex-1 overflow-hidden text-ellipsis">
                {receiveAddress}
              </code>
              <Button
                variant="outline"
                onClick={() => copyToClipboard(receiveAddress)}
              >
                {copiedPublic ? (
                  <>
                    Address Copied
                    <Check className="h-4 w-4 text-green-500" />
                  </>
                ) : (
                  <>
                    Copy Address to Clipboard
                    <Copy className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Transaction Dialog */}
      <SendTransactionDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        accountType={"public"}
      />
    </>
  );
};

export default PublicAddressManager;
