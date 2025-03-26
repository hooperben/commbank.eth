"use client";

import AccountHome from "@/components/account-home";
import SignIn from "@/components/sign-in";
import SignUp from "@/components/sign-up";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { getRegisteredUsername } from "@/lib/passkey";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import type React from "react";

export default function Home() {
  const { isSignedIn } = useAuth();

  const { data: isRegisteredUsername, isLoading: isPageLoading } = useQuery({
    queryKey: ["registered-username", isSignedIn],
    queryFn: async () => {
      const username = await getRegisteredUsername();
      return { username };
    },
  });

  return (
    <div className="flex flex-col w-full">
      <main className="flex-1 flex-col flex justify-center p-6 w-full">
        {isRegisteredUsername?.username && isSignedIn ? (
          <AccountHome />
        ) : (
          <div className="flex justify-center items-center w-full h-screen">
            <Card className="w-full max-w-md">
              {!isPageLoading &&
                !isSignedIn &&
                isRegisteredUsername?.username && <SignIn />}

              {!isPageLoading &&
                !isSignedIn &&
                !isRegisteredUsername?.username && <SignUp />}

              {isPageLoading && (
                <CardContent className="pt-6">
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
