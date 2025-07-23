"use client";

import AccountManager from "@/components/account-manager";
import DepositModal from "@/components/deposit-modal";
import SendModal from "@/components/send-modal";
import { TokenBalancesTable } from "@/components/token-balances-view";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  QrCodeIcon,
  SendIcon,
  WalletIcon,
  Copy,
  LogOut,
  ArrowRightLeft,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { useAuth } from "@/lib/auth-context";
import { formatAddress } from "@/const";
import { toast } from "@/hooks/use-toast";
import ConnectWallet from "@/components/connect-wallet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Account() {
  const { isConnected, address, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { isSignedIn, address: authAddress } = useAuth();
  const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const isUp = false;

  useEffect(() => {
    if (isConnected) {
      setIsAccountManagerOpen(false);
    }
  }, [isConnected]);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({
      title: "Address copied",
      description: "Address has been copied to clipboard",
    });
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleTransfer = async () => {
    if (!selectedAsset || !transferAmount || !address || !authAddress) {
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

      {/* Wallets Section */}
      <div className="">
        <div className="grid gap-4 md:grid-cols-2">
          {/* CommBank.eth Account */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-2 mb-4">
                {isSignedIn && (
                  <div className="flex flex-row w-full justify-between items-center pt-2">
                    <div className="flex flex-row gap-1 items-baseline">
                      <h1 className="text-3xl">$0.00</h1>
                      <p
                        className={`text-xs ${
                          isUp ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {isUp ? "+" : "-"}$0
                      </p>
                      <p className="text-xs text-gray-500">(24h)</p>
                    </div>

                    {/* Deposit & Send Buttons */}
                    <div className="flex flex-row gap-2">
                      <Button
                        className="flex flex-col h-16 text-sm w-20 text-gray-700"
                        onClick={() => setIsDepositModalOpen(true)}
                        disabled={!isSignedIn}
                      >
                        <QrCodeIcon />
                        Deposit
                      </Button>
                      <Button
                        className="flex flex-col h-16 text-sm w-20 text-gray-700"
                        onClick={() => setIsSendModalOpen(true)}
                        disabled={!isSignedIn}
                      >
                        <SendIcon />
                        Send
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-amber-500" />
                  <CardTitle>commbank.eth Account</CardTitle>
                </div>
                {isSignedIn && (
                  <Badge variant="outline" className="text-green-600">
                    Active
                  </Badge>
                )}
              </div>
              <CardDescription>
                Your primary commbank.eth account secured with passkey
                authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSignedIn && authAddress ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="font-mono text-sm text-muted-foreground">
                        {formatAddress(authAddress)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyAddress(authAddress)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    Sign in to your commbank.eth account to view details
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAccountManagerOpen(true)}
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected Wallet */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-500" />
                  <CardTitle>Connected Wallet</CardTitle>
                </div>
                {isConnected && (
                  <Badge variant="outline" className="text-green-600">
                    Connected
                  </Badge>
                )}
              </div>
              <CardDescription>
                External web3 wallet for transferring assets to your
                commbank.eth account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isConnected && address ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">
                        {connector?.name || "Unknown Wallet"}
                      </p>
                      <p className="font-mono text-sm text-muted-foreground">
                        {formatAddress(address)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyAddress(address)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => setTransferModalOpen(true)}
                      disabled={!isSignedIn}
                      className="flex-1"
                      size="sm"
                    >
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Transfer to commbank.eth
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleDisconnect}
                      size="sm"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </div>

                  {!isSignedIn && (
                    <p className="text-xs text-amber-600">
                      Sign in to your commbank.eth account to enable transfers
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    Connect a web3 wallet to transfer assets
                  </p>
                  <ConnectWallet />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
