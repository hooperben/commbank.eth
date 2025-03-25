"use client";

import type React from "react";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import AccountHome from "@/components/account-home";
import SignIn from "@/components/sign-in";
import SignUp from "@/components/sign-up";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { isPasskeyRegistered } from "@/lib/passkey";

// if the user has a token, they're logged in
// if a user is registered, show them sign in
// no token and unregistered is Sign Up

export default function Home() {
  const { token, isLoading } = useAuth();
  const [hasRegistered, setHasRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  useEffect(() => {
    const checkRegistration = async () => {
      setCheckingRegistration(true);

      // Check if user has registered using passkeys
      const registered = isPasskeyRegistered();
      setHasRegistered(registered);

      setCheckingRegistration(false);
    };

    checkRegistration();

    // Listen for changes in registration status
    const handleStorageChange = () => checkRegistration();
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [token]);

  // Determine loading state (either auth is loading or we're checking registration)
  const isPageLoading = isLoading || checkingRegistration;

  return (
    <div className="flex flex-col w-full">
      <main className="flex-1 flex-col flex justify-center p-6 w-full">
        {!isPageLoading && token ? (
          <AccountHome />
        ) : (
          <div className="flex justify-center items-center w-full h-screen">
            <Card className="w-full max-w-md">
              {isPageLoading && (
                <CardContent className="pt-6">
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                </CardContent>
              )}

              {!isPageLoading && hasRegistered && !token && <SignIn />}

              {!isPageLoading && !hasRegistered && !token && <SignUp />}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
