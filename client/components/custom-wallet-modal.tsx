"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { formatAddress } from "@/const";
import { ChevronDown, Copy, ExternalLink, Loader2, LogOut } from "lucide-react";
import { useState } from "react";
import { useAccount, useBalance, useDisconnect } from "wagmi";

interface CustomWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomWalletModal({ isOpen, onClose }: CustomWalletModalProps) {
  const { address, chain } = useAccount();
  const { data: balanceData } = useBalance({ address });
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

          <div className="mt-4">
            <span className="text-sm text-muted-foreground">Balance</span>

            <div className="flex flex-row gap-2 w-full justify-between items-center">
              <p className="font-medium">
                {balanceData?.formatted &&
                  Number(balanceData.formatted).toFixed(4)}{" "}
                {balanceData?.symbol}
              </p>
              {chain && address && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-1" />
                      View on Explorers
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      key={chain.id}
                      className="cursor-pointer"
                      onClick={() => {
                        window.open(
                          `${chain.blockExplorers?.default.url}/address/${address}`,
                          "_blank",
                        );
                      }}
                      disabled={isNetworkSwitching}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <ExternalLink size="15px" className="h-1 w-1" />
                        <span>View on {chain.name} Scan</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
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
