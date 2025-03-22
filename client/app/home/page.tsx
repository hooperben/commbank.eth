"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Fingerprint, Loader2, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/app-sidebar";
import {
  authenticateWithPasskey,
  getRegisteredUsername,
  handleSuccessfulRegistration,
  isUsernameRegistered,
  registerPasskey,
} from "@/lib/passkey";
import {
  decryptSecret,
  encryptSecret,
  getAllEncryptedSecrets,
  getEncryptedSecretById,
  getRSAKeys,
  initDB,
  storeEncryptedSecret,
} from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import SignUp from "@/components/sign-up";

// if the user has a token, they're logged in
// if a user is registered, show them sign in
// no token and unregistered is Sign Up

export default function LoginPage() {
  const { token, isLoading, signOut, signIn } = useAuth();
  const [rsaKeys, setRsaKeys] = useState<any>(null);
  const [isLoadingKeys, setIsLoadingKeys] = useState<boolean>(false);
  const router = useRouter();

  const [hasRegistered, setHasRegistered] = useState(false);

  useEffect(() => {
    if (isUsernameRegistered()) {
      setHasRegistered(true);
    }
  }, [setHasRegistered, hasRegistered]);

  // Fetch RSA keys when user is authenticated

  const handleSignIn = async () => {
    console.log("handleSignIn");

    try {
      await initDB();

      const commbankSecret = await getEncryptedSecretById("commbank.eth");

      if (!commbankSecret) throw new Error("No commbank.eth registered");

      const authData = await authenticateWithPasskey();

      console.log(authData);

      if (!authData) {
        toast({
          title: "Authentication Failed",
          description: "Failed to authenticate with passkey",
          variant: "destructive",
        });
        return;
      }

      const decryptedSecret = await decryptSecret(commbankSecret, authData);

      console.log(decryptedSecret);

      signIn(decryptedSecret);
    } catch (err) {
      console.log(err);
    }

    // try {
    //   const authData = await authenticateWithPasskey();
    //   if (authData) {
    //     // Successfully authenticated
    //     window.dispatchEvent(new Event("auth-change"));
    //     // Navigate to dashboard or reload page
    //     router.refresh();
    //   } else {
    //     toast({
    //       title: "Authentication Failed",
    //       description: "Could not authenticate with passkey.",
    //       variant: "destructive",
    //     });
    //   }
    // } catch (err) {
    //   console.error(err);
    //   toast({
    //     title: "Error",
    //     description: "An error occurred during authentication.",
    //     variant: "destructive",
    //   });
    // }
  };

  return (
    <div className="flex w-full min-h-screen bg-black text-white">
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
          {isLoading && (
            <CardContent className="pt-6">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            </CardContent>
          )}

          {!isLoading && token && (
            <div>
              <CardHeader>
                <CardTitle className="text-center">Dashboard</CardTitle>
                <CardDescription className="text-center">
                  Welcome back, {getRegisteredUsername()}!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-zinc-800 p-4">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Authenticated with Passkey
                  </h3>

                  {isLoadingKeys ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                    </div>
                  ) : rsaKeys ? (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">RSA Keys:</h4>
                      <pre className="text-xs bg-zinc-950 p-3 rounded overflow-auto max-h-60">
                        {JSON.stringify(rsaKeys, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-400">
                      No RSA keys found. They may need to be generated.
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  className="w-full bg-zinc-800 hover:bg-zinc-700"
                  onClick={() => (window.location.href = "/dashboard")}
                >
                  Go to Dashboard
                </Button>
                <Button
                  className="w-full bg-red-800 hover:bg-red-700"
                  onClick={() => {
                    signOut();
                    console.log(token);
                  }}
                >
                  Logout
                </Button>
              </CardFooter>
            </div>
          )}

          {!isLoading && hasRegistered && !token && (
            <>
              <CardHeader>
                <CardTitle className="text-center">Login</CardTitle>
                <CardDescription className="text-center">
                  Welcome back!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black"
                  onClick={handleSignIn}
                >
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Sign In with Passkey
                </Button>
              </CardContent>
            </>
          )}

          {!isLoading && !hasRegistered && <SignUp />}
        </Card>
      </main>
    </div>
  );
}

// Helper function to get public key for a user
async function getPublicKeyForUser(username: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const db = window.indexedDB.open("commbankDB", 2);

    db.onerror = () => reject(new Error("Failed to open database"));

    db.onsuccess = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      const transaction = database.transaction(["public_keys"], "readonly");
      const store = transaction.objectStore("public_keys");
      const request = store.get(username);

      request.onerror = () => reject(new Error("Failed to get public key"));

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.publicKey);
        } else {
          reject(new Error("Public key not found"));
        }
      };
    };
  });
}
