"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatAddress } from "@/const";
import { Copy, Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";

interface CustomWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomWalletModal({ isOpen, onClose }: CustomWalletModalProps) {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const [isNetworkSwitching] = useState(false);

  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    if (!isNetworkSwitching) {
      disconnect();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
        </DialogHeader>

        {/* Address and Balance Section */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Address</span>
            <div className="flex gap-2"></div>
          </div>

          <div className="flex flex-row items-center">
            <p className="font-mono text-sm">{formatAddress(address)}</p>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={copyAddress}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <Button
          variant="destructive"
          className="mt-2"
          onClick={handleDisconnect}
          disabled={isNetworkSwitching}
        >
          {isNetworkSwitching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="mr-2 h-4 w-4" />
          )}
          Disconnect
        </Button>
      </DialogContent>
    </Dialog>
  );
}
