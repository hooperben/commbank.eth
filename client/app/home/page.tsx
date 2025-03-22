"use client";

import type React from "react";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import SignUp from "@/components/sign-up";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { isPasskeyRegistered } from "@/lib/passkey";
import SignIn from "@/components/sign-in";

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
    <div className="flex w-full min-h-screen">
      <main className="flex-1 flex items-center justify-center p-6">
        {!isLoading && token ? (
          <div>Content Goes here</div>
        ) : (
          <Card className="w-full max-w-md">
            {isLoading && (
              <CardContent className="pt-6">
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                </div>
              </CardContent>
            )}

            {!isLoading && hasRegistered && !token && <SignIn />}

            {!isLoading && !setHasRegistered && !token && <SignUp />}
          </Card>
        )}
      </main>
    </div>
  );
}
