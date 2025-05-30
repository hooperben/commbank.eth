"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  // const { isSignedIn } = useAuth();

  // const { data: isRegisteredUsername, isLoading: isPageLoading } = useQuery({
  //   queryKey: ["registered-username", isSignedIn],
  //   queryFn: async () => {
  //     const username = await getRegisteredUsername();
  //     return { username };
  //   },
  // });

  // const isPassKeySupported = isPasskeySupported();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle>Sign In</SheetTitle>
          <SheetDescription>
            Sign in with your commbank.eth account, or use an existing web3
            wallet.
          </SheetDescription>
        </SheetHeader>

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
        <ConnectWallet />
      </SheetContent>
    </Sheet>
  );
};

export default AccountManager;
