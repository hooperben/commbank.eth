"use client";

import { useAuth } from "@/lib/auth-context";
import { Fingerprint, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isPasskeySupported } from "@/lib/passkey";

const SignIn = () => {
  const { handleSignIn, isAuthenticating } = useAuth();

  const isPassKeySupported = isPasskeySupported();

  return (
    <Button
      type="submit"
      className="w-full bg-amber-500 hover:bg-amber-600 text-black"
      onClick={handleSignIn}
      disabled={isAuthenticating || !isPassKeySupported}
    >
      {isAuthenticating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Authenticating...
        </>
      ) : (
        <>
          <Fingerprint className="mr-2 h-4 w-4" />
          Sign In with commbank.eth
        </>
      )}
    </Button>
  );
};

export default SignIn;
