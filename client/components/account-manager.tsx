"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatAddress } from "@/const";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { getRegisteredUsername, isPasskeySupported } from "@/lib/passkey";
import { useQuery } from "@tanstack/react-query";
import { Copy, LogOut } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import SignIn from "./sign-in";
import SignUp from "./sign-up";

interface AccountManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountManager = ({ open, onOpenChange }: AccountManagerProps) => {
  const { address: wagmiAddress, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { isSignedIn, address: authAddress, signOut } = useAuth();

  const { data: isRegisteredUsername, isLoading: isPageLoading } = useQuery({
    queryKey: ["registered-username", isSignedIn],
    queryFn: async () => {
      const username = await getRegisteredUsername();
      return { username };
    },
  });

  const isPassKeySupported = isPasskeySupported();

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({
      title: "Address copied",
      description: "Address has been copied to clipboard",
    });
  };

  const handleDisconnect = () => {
    disconnect();
    onOpenChange(false);
  };

  const handleSignOut = () => {
    signOut();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle>My Account</SheetTitle>
          <SheetDescription>
            {!isSignedIn && !isConnected
              ? "Sign in with your commbank.eth account, or use an existing web3 wallet."
              : "Manage your commbank.eth account and connected wallets."}
          </SheetDescription>
        </SheetHeader>

        {/* CommBank.eth Account Section */}
        {isSignedIn && (
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">commbank.eth Account</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-red-500 hover:text-red-600"
              >
                <LogOut className="mr-1 h-3 w-3" />
                Sign Out
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm">
                {authAddress && formatAddress(authAddress)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => authAddress && copyAddress(authAddress)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* 3rd Party Wallet Section */}
        {isConnected && (
          <Card className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Connected Wallet</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-500 hover:text-red-600"
              >
                <LogOut className="mr-1 h-3 w-3" />
                Disconnect
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm">{formatAddress(wagmiAddress)}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => wagmiAddress && copyAddress(wagmiAddress)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Authentication Flow */}
        {!isPageLoading && !isSignedIn && isRegisteredUsername?.username && (
          <div className="space-y-4">
            <SignIn />
          </div>
        )}

        {!isPageLoading && !isSignedIn && !isRegisteredUsername?.username && (
          <div className="space-y-4">
            <h3 className="font-medium">Create commbank.eth account</h3>
            <Card>
              <SignUp />
            </Card>
          </div>
        )}

        {!isPassKeySupported && (
          <p className="text-red-400 text-xs">
            This browser does not support passkey.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AccountManager;
