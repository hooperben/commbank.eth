"use client";

import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isPasskeySupported } from "@/lib/passkey";

const SignIn = () => {
  const isPassKeySupported = isPasskeySupported();

  return (
    <Button
      type="submit"
      className="w-full bg-amber-500 hover:bg-amber-600 text-black"
      disabled={!isPassKeySupported}
    >
      <>
        <Fingerprint className="mr-2 h-4 w-4" />
        Sign In with commbank.eth
      </>
    </Button>
  );
};

export default SignIn;
