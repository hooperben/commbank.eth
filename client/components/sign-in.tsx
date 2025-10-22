"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { isPasskeySupported, retrieveMnemonic } from "@/lib/passkey";
import { Fingerprint, Loader2 } from "lucide-react";
import { useState } from "react";

const SignIn = () => {
  const { signIn, setIsAccountManagerOpen } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isPassKeySupported = isPasskeySupported();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleSignIn = async () => {
    setIsSigningIn(true);

    try {
      const mnemonic = await retrieveMnemonic();
      if (!mnemonic) {
        throw new Error("Failed to retrieve mnemonic from passkey");
      }

      await signIn(mnemonic);

      // if it's mobile, close the app-sidebar
      if (isMobile) {
        setOpenMobile(false);
        setIsAccountManagerOpen(false);
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in to your commbank.eth account",
      });
    } catch (error) {
      console.error("Sign in error:", error);
      toast({
        title: "Sign In Failed",
        description:
          "Failed to authenticate with your passkey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      className="w-full bg-amber-500 hover:bg-amber-600 text-black"
      disabled={!isPassKeySupported || isSigningIn}
    >
      {isSigningIn ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing In...
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
