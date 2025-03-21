"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { registerPasskey } from "@/lib/passkey";
import { encryptSecret, initDB, storeEncryptedSecret } from "@/lib/db";

// Mock API call to check if username is available
const checkUsernameAvailability = async (
  username: string,
): Promise<{ available: boolean }> => {
  // Simulate API call with delay
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock logic: usernames containing "taken" are considered unavailable
      const available = !username.toLowerCase().includes("taken");
      resolve({ available });
    }, 1500);
  });
};

// Mock API call to register a user
const registerUser = async (
  username: string,
): Promise<{ success: boolean }> => {
  // Simulate API call with delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 1000);
  });
};

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"username" | "confirm" | "success">(
    "username",
  );
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // Query to check username availability
  const usernameQuery = useQuery({
    queryKey: ["checkUsername", username],
    queryFn: () => checkUsernameAvailability(username),
    enabled: false, // Don't run automatically
  });

  // Mutation to register user
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      setStep("success");
    },
    onError: () => {
      toast({
        title: "Registration Failed",
        description:
          "There was an error registering your account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCheckUsername = async () => {
    if (!username || username.length < 3) {
      toast({
        title: "Invalid Username",
        description: "Username must be at least 3 characters long.",
        variant: "destructive",
      });
      return;
    }

    await usernameQuery.refetch();

    console.log(usernameQuery);

    if (usernameQuery.data?.available) {
      setStep("confirm");
    } else {
      toast({
        title: "Username Not Available",
        description:
          "This username is already taken. Please choose another one.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmWithPasskey = async () => {
    setIsRegistering(true);

    const test = "ben";

    await initDB();

    try {
      // Register passkey
      const success = await registerPasskey(test);

      if (!success) {
        throw new Error("Failed to register passkey");
      }

      // Create and store a secret for the user
      const authData = await window.crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(username),
      );

      const secret = "USER_SECRET_KEY";
      const encryptedSecret = await encryptSecret(secret, authData, true);
      await storeEncryptedSecret(encryptedSecret);

      // Register the user
      await registerMutation.mutateAsync(username);
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description:
          "There was an error setting up your passkey. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleGoToHome = () => {
    router.push("/");
  };

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          {step === "username" && (
            <>
              <CardHeader>
                <CardDescription className="flex flex-col gap-2">
                  <p>
                    commbank.eth stores all of your information in your browser.
                    Because you&apos;re storing your own data, you have to
                    create an account on your device that allows you to encrypt
                    and decrypt your information.
                  </p>

                  <p>
                    thankfully, with passkey, this has become as easy as a
                    finger print or face ID scan
                  </p>
                </CardDescription>
              </CardHeader>
              <CardFooter className="flex flex-col space-y-2">
                <Button
                  onClick={handleConfirmWithPasskey}
                  disabled={isRegistering}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up passkey...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Create my account
                    </>
                  )}
                </Button>
              </CardFooter>
            </>
          )}

          {step === "confirm" && (
            <>
              <CardHeader>
                <CardTitle>Confirm Your Identity</CardTitle>
                <CardDescription>
                  Set up a passkey for {username} to secure your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4 text-center">
                    <Fingerprint className="h-12 w-12 mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      You'll use this passkey to securely access your account in
                      the future. No password needed!
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Username: {username}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button
                  onClick={handleConfirmWithPasskey}
                  disabled={isRegistering}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up passkey...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Confirm with Passkey
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setStep("username")}
                  disabled={isRegistering}
                  className="w-full"
                >
                  Back
                </Button>
              </CardFooter>
            </>
          )}

          {step === "success" && (
            <>
              <CardHeader>
                <div className="mx-auto w-fit p-4 rounded-full bg-primary/10 mb-4">
                  <CheckCircle className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-center">
                  Account Set Up Complete!
                </CardTitle>
                <CardDescription className="text-center">
                  Your account has been created successfully
                </CardDescription>
              </CardHeader>

              <CardFooter>
                <Button
                  onClick={handleGoToHome}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Go to my Account
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </main>
    </div>
  );
}
