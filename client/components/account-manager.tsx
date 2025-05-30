"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatAddress } from "@/const";
import { Copy, LogOut } from "lucide-react";
import { useAccount, useDisconnect } from "wagmi";
import ConnectWallet from "./connect-wallet";
// import SignIn from "./sign-in";
// import { useQuery } from "@tanstack/react-query";
// import { getRegisteredUsername, isPasskeySupported } from "@/lib/passkey";
// import SignUp from "./sign-up";
// import { useAuth } from "@/lib/auth-context";

interface AccountManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AccountManager = ({ open, onOpenChange }: AccountManagerProps) => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // const { isSignedIn } = useAuth();

  // const { data: isRegisteredUsername, isLoading: isPageLoading } = useQuery({
  //   queryKey: ["registered-username", isSignedIn],
  //   queryFn: async () => {
  //     const username = await getRegisteredUsername();
  //     return { username };
  //   },
  // });

  // const isPassKeySupported = isPasskeySupported();
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-4">
        {isConnected ? (
          <SheetHeader>
            <SheetTitle>My Account</SheetTitle>
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
          </SheetHeader>
        ) : (
          <SheetHeader>
            <SheetTitle>Sign In</SheetTitle>
            <SheetDescription>
              Sign in with your commbank.eth account, or use an existing web3
              wallet.
            </SheetDescription>
          </SheetHeader>
        )}

        {/* {!isPageLoading && !isSignedIn && isRegisteredUsername?.username && (
          <SignIn />
        )}

        {!isPageLoading && !isSignedIn && !isRegisteredUsername?.username && (
          <SignUp />
        )}

        {!isPassKeySupported && (
          <p className="text-red-400 text-xs">
            This browser does not support passkey.
          </p>
        )} */}

        {isConnected ? (
          <Button
            variant="destructive"
            className="mt-2"
            onClick={handleDisconnect}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </Button>
        ) : (
          <ConnectWallet />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default AccountManager;
