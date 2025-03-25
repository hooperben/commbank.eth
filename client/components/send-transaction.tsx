"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { retrieveMnemonic } from "@/lib/passkey";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface SendTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountType: "public" | "private";
  availableAssets: {
    eth?: string;
    usdc?: string;
  };
}

export function SendTransactionDialog({
  open,
  onOpenChange,
  accountType,
  availableAssets,
}: SendTransactionDialogProps) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<"ETH" | "USDC">("USDC");

  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsPending(true);

    const mnemonic = await retrieveMnemonic();

    if (!mnemonic) {
      throw new Error("Failed");
    }

    const userToast = toast({
      title: "Submitting",
    });

    console.log(userToast);

    // Simulate transaction processing with a delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    userToast.update({
      id: userToast.id,
      title: "Transaction confirmed",
    });

    // Reset form and close dialog after successful transaction
    setRecipient("");
    setAmount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Send {accountType === "public" ? "Public" : "Private"} Funds
          </DialogTitle>
          <DialogDescription>
            Enter the recipient address and amount to send.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="recipient">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Select Asset</Label>
              <RadioGroup
                value={selectedAsset}
                onValueChange={(value) =>
                  setSelectedAsset(value as "ETH" | "USDC")
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="USDC" id="usdc" />
                  <Label htmlFor="usdc" className="cursor-pointer">
                    USDC
                    <span className="text-xs text-muted-foreground ml-1">
                      (Available: {availableAssets.usdc || "0"})
                    </span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ETH" id="eth" />
                  <Label htmlFor="eth" className="cursor-pointer">
                    ETH
                    <span className="text-xs text-muted-foreground ml-1">
                      (Available: {availableAssets.eth || "0"})
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                step="any"
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
