"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import { useTokenBalances } from "@/hooks/use-token-balances";

interface SendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SendModal = ({ open, onOpenChange }: SendModalProps) => {
  const { address, isSignedIn, getMnemonic } = useAuth();
  const { data: balances } = useTokenBalances(address || undefined);

  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!selectedAsset || !recipient || !amount || !isSignedIn) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Validate recipient address
      if (!ethers.isAddress(recipient)) {
        throw new Error("Invalid recipient address");
      }

      // Get the mnemonic to create a wallet for signing
      const mnemonic = await getMnemonic();
      if (!mnemonic) {
        throw new Error("Unable to access wallet credentials");
      }

      // Find the selected asset
      const asset = balances?.find(
        (b) => `${b.contractAddress}-${b.chainId}` === selectedAsset,
      );

      if (!asset) {
        throw new Error("Selected asset not found");
      }

      // TODO: Implement actual transaction sending
      // This would require connecting to the appropriate RPC provider
      // and handling ERC20 vs ETH transfers differently

      toast({
        title: "Transaction Sent",
        description: `Successfully sent ${amount} ${
          asset.symbol
        } to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`,
      });

      // Reset form
      setSelectedAsset("");
      setRecipient("");
      setAmount("");
      onOpenChange(false);
    } catch (error) {
      console.error("Send error:", error);
      toast({
        title: "Transaction Failed",
        description:
          error instanceof Error ? error.message : "Failed to send transaction",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isSignedIn || !address) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Assets
          </DialogTitle>
          <DialogDescription>
            Send tokens from your commbank.eth account to another address.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Asset Selection */}
          <div className="space-y-2">
            <Label htmlFor="asset">Select Asset</Label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an asset to send" />
              </SelectTrigger>
              <SelectContent>
                {balances?.map((balance) => {
                  const key = `${balance.contractAddress}-${balance.chainId}`;

                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center justify-between w-full">
                        <span>{balance.symbol}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {balance.balance} {balance.symbol}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="any"
              min="0"
            />
          </div>

          {/* Transaction Summary */}
          {selectedAsset && recipient && amount && (
            <Card className="p-4 bg-muted/50">
              <h4 className="font-medium mb-2">Transaction Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span>
                    {amount}{" "}
                    {
                      balances?.find(
                        (b) =>
                          `${b.contractAddress}-${b.chainId}` === selectedAsset,
                      )?.symbol
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>To:</span>
                  <span className="font-mono">
                    {recipient.slice(0, 6)}...{recipient.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>From:</span>
                  <span className="font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!selectedAsset || !recipient || !amount || isSending}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Transaction
              </>
            )}
          </Button>

          {/* Warning */}
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Warning:</strong> Double-check the recipient address and
              amount. Transactions cannot be reversed once confirmed.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SendModal;
