import ConnectWallet from "@/components/connect-wallet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatAddress } from "@/const";
import { useBalancesTotal } from "@/hooks/use-balances-total";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowRightLeft,
  Copy,
  LogOut,
  QrCodeIcon,
  SendIcon,
  Wallet,
} from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import { Skeleton } from "./ui/skeleton";

const AccountBalance = ({
  setIsDepositModalOpen,
  setIsSendModalOpen,
  setIsAccountManagerOpen,
  setTransferModalOpen,
}: {
  setIsDepositModalOpen: (input: boolean) => void;
  setIsSendModalOpen: (input: boolean) => void;
  setIsAccountManagerOpen: (input: boolean) => void;
  setTransferModalOpen: (input: boolean) => void;
}) => {
  const { isSignedIn, address: authAddress } = useAuth();
  const { isConnected, address, connector } = useAccount();
  const { disconnect } = useDisconnect();

  const { data, isLoading } = useBalancesTotal(authAddress!);

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

  return (
    <div className="">
      <div className="grid gap-4 md:grid-cols-2">
        {/* CommBank.eth Account */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-amber-500" />
                <CardTitle>commbank.eth Account</CardTitle>
              </div>
            </div>
            <CardDescription>
              Your primary commbank.eth account secured with passkey
              authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSignedIn && authAddress ? (
              <>
                <div className="flex flex-row justify-between w-full items-center space-y-4">
                  <div className="flex flex-row items-center">
                    {isLoading && <Skeleton className="w-24 h-12" />}
                    {data && (
                      <div className="flex flex-col">
                        <h1 className="text-5xl">${data?.toFixed(2)}</h1>
                      </div>
                    )}
                  </div>

                  {isSignedIn && (
                    <div className="flex flex-row gap-2 justify-center">
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
                  )}
                </div>

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
              External web3 wallet for transferring assets to your commbank.eth
              account
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
              <div className="py-4">
                <p className="text-muted-foreground mb-4 text-sm">
                  Connect a web3 wallet to transfer assets
                </p>
                <ConnectWallet />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountBalance;
