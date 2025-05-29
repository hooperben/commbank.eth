"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shortenAddress } from "@/helpers";
import { useAccountsData } from "@/hooks/use-accounts-data";
import {
  ArrowDownToLine,
  Check,
  Copy,
  SendHorizontal,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const PrivateAddressManager = () => {
  const { data: accountsData } = useAccountsData();

  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Private Address
          <Badge variant="outline" className="ml-2">
            commbank.eth
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {accountsData.rsa && (
                <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">
                  {shortenAddress(
                    `0x${Buffer.from(accountsData.rsa.publicKey).toString(
                      "hex",
                    )}:${accountsData.rsa.circuitPubKey}`,
                  )}
                </code>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  accountsData.rsa &&
                  copyToClipboard(
                    `0x${Buffer.from(accountsData.rsa.publicKey).toString(
                      "hex",
                    )}:${accountsData.rsa.circuitPubKey}`,
                  )
                }
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="pt-2 space-y-2">
            <div className="text-sm text-muted-foreground mb-1">Balances</div>
            <div className="flex justify-between items-center">
              <div className="font-mono text-lg font-semibold">0 USDC</div>
              <Badge variant="secondary">$0</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-9">
          <Button size="sm" className="w-full">
            <ArrowDownToLine className="h-4 w-4 mr-2" />
            Receive
          </Button>
          <Button size="sm" className="w-full" disabled>
            <SendHorizontal className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivateAddressManager;
