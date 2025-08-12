"use client";

import AccountBalance from "@/components/account-balance";
import AccountManager from "@/components/account-manager";
import DepositModal from "@/components/deposit-modal";
import SendModal from "@/components/send-modal";
import { TokenBalancesTable } from "@/components/token-balances-view";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { WarningBanner } from "@/components/warning-banner";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { ArrowRightLeft, WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function Account() {
  const { isConnected, address } = useAccount();
  const { isSignedIn, address: authAddress } = useAuth();
  const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  useEffect(() => {
    if (isConnected) {
      setIsAccountManagerOpen(false);
    }
  }, [isConnected]);

  const handleTransfer = async () => {
    if (!selectedAsset || !transferAmount || !authAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement actual transfer from connected wallet to commbank.eth address
    toast({
      title: "Transfer Initiated",
      description: `Transfer of ${transferAmount} ${selectedAsset} to your commbank.eth account has been initiated.`,
    });

    setTransferModalOpen(false);
    setSelectedAsset("");
    setTransferAmount("");
  };

  // If not connected and not signed in, show connect wallet button
  if (!isConnected && !isSignedIn) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-6 p-2 pt-0">
        <h1 className="text-3xl text-primary">Account</h1>

        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div className="text-center">
            <h2 className="text-xl mb-2">Sign In</h2>
            <p className="text-gray-600 mb-6">
              Sign in to view your account and manage your assets.
            </p>
          </div>

          <Button
            onClick={() => setIsAccountManagerOpen(true)}
            className="flex items-center gap-2"
            size="lg"
          >
            <WalletIcon className="w-4 h-4" />
            Login/Sign Up
          </Button>
        </div>

        <AccountManager
          open={isAccountManagerOpen}
          onOpenChange={setIsAccountManagerOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 p-2 pt-0">
      <h1 className="text-3xl text-primary">Account</h1>

      <WarningBanner />

      {/* Wallets Section */}
      <AccountBalance
        setIsDepositModalOpen={setIsDepositModalOpen}
        setIsSendModalOpen={setIsSendModalOpen}
        setIsAccountManagerOpen={setIsAccountManagerOpen}
        setTransferModalOpen={setTransferModalOpen}
      />

      <div className="flex flex-col">
        <h1 className="text-2xl text-primary">Assets</h1>

        {(address || authAddress) && (
          <TokenBalancesTable walletAddress={address || authAddress!} />
        )}
      </div>

      <AccountManager
        open={isAccountManagerOpen}
        onOpenChange={setIsAccountManagerOpen}
      />

      <DepositModal
        open={isDepositModalOpen}
        onOpenChange={setIsDepositModalOpen}
      />

      <SendModal open={isSendModalOpen} onOpenChange={setIsSendModalOpen} />

      {/* Transfer Modal from Connected Wallet to CommBank.eth */}
      <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer to commbank.eth
            </DialogTitle>
            <DialogDescription>
              Transfer assets from your connected wallet to your commbank.eth
              account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asset">Select Asset</Label>
              <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an asset to transfer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETH">ETH</SelectItem>
                  <SelectItem value="USDC">USDC</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                step="any"
                min="0"
              />
            </div>

            {selectedAsset && transferAmount && (
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Transfer Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>
                      {transferAmount} {selectedAsset}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>From:</span>
                    <span className="font-mono">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span className="font-mono">
                      {authAddress?.slice(0, 6)}...{authAddress?.slice(-4)}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            <Button
              onClick={handleTransfer}
              disabled={!selectedAsset || !transferAmount}
              className="w-full"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transfer Assets
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
