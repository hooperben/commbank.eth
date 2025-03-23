"use client";

import type React from "react";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import SignUp from "@/components/sign-up";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { isPasskeyRegistered } from "@/lib/passkey";
import SignIn from "@/components/sign-in";
import AccountHome from "@/components/account-home";

// if the user has a token, they're logged in
// if a user is registered, show them sign in
// no token and unregistered is Sign Up

export default function Home() {
  const { token, isLoading } = useAuth();

  const [hasRegistered, setHasRegistered] = useState(false);

  useEffect(() => {
    if (isPasskeyRegistered()) {
      setHasRegistered(true);
    }
  }, [setHasRegistered, hasRegistered]);

  // Fetch RSA keys when user is authenticated

  return (
    <div className="flex flex-col w-full">
      <main className="flex-1 flex-col flex items-center justify-center p-6 w-full">
        {!isLoading && token ? (
          <AccountHome />
        ) : (
          <div className="flex justify-center items-center w-full mt-[70%]">
            <Card className="w-full max-w-md">
              {isLoading && (
                <CardContent className="pt-6">
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                </CardContent>
              )}

              {!isLoading && hasRegistered && !token && <SignIn />}

              {!isLoading && !hasRegistered && !token && <SignUp />}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
