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
import {
  authenticateWithPasskey,
  isUsernameRegistered,
  registerPasskey,
} from "@/lib/passkey";
import { encryptSecret, initDB, storeEncryptedSecret } from "@/lib/db";
import { useAuth } from "@/lib/auth-context";
import {
  generateAndStoreEVMAccount,
  generateAndStoreRSAAccount,
} from "@/lib/wallet";

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

// Generate a random 32-byte string

const SignUp = () => {
  const { signIn } = useAuth();

  const [step, setStep] = useState<
    "username" | "checking" | "confirm" | "success"
  >("username");

  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter a username to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingUsername(true);
    setStep("checking");

    try {
      // Check if username is available
      const { available } = await checkUsernameAvailability(username);

      if (available) {
        setStep("confirm");
      } else {
        toast({
          title: "Username Not Available",
          description:
            "This username is already taken. Please try another one.",
          variant: "destructive",
        });
        setStep("username");
      }
    } catch (error) {
      console.error("Error checking username:", error);
      toast({
        title: "Error",
        description: "Failed to check username availability. Please try again.",
        variant: "destructive",
      });
      setStep("username");
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setIsRegistering(true);

    await initDB();

    try {
      // Register passkey
      const success = await registerPasskey(username);

      if (!success) {
        throw new Error("Failed to register passkey");
      }

      setStep("success");
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

  const generateRandomSecret = (): string => {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const [isGeneratingAccount, setIsGeneratingAccount] = useState(false);

  const handleGenerateAccounts = async () => {
    setIsGeneratingAccount(true);

    await initDB();

    try {
      const secret = generateRandomSecret();
      const authData = await authenticateWithPasskey();

      if (!authData) {
        toast({
          title: "Authentication Failed",
          description: "Failed to authenticate with passkey",
          variant: "destructive",
        });
        return;
      }

      const encryptedSecret = await encryptSecret(
        "commbank.eth",
        secret,
        authData,
        true,
      );

      await storeEncryptedSecret(encryptedSecret);

      // generate EVM and RSA keys
      generateAndStoreEVMAccount(secret, username);
      await generateAndStoreRSAAccount(secret, username);

      signIn(secret);

      toast({
        title: "Success",
        description: "Secret encrypted and stored successfully",
      });
    } catch (err) {
      console.error("Failed to store secret:", err);
      toast({
        title: "Error",
        description: "Failed to encrypt and store secret",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAccount(false);
    }
  };

  return (
    <>
      {step === "username" && (
        <>
          <CardHeader>
            <CardTitle className="text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              commbank.eth stores a secret in your device using passkey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-black"
              >
                <User className="mr-2 h-4 w-4" />
                Continue
              </Button>
            </form>
          </CardContent>
        </>
      )}

      {step === "checking" && (
        <>
          <CardHeader>
            <CardTitle className="text-center">Checking Username</CardTitle>
            <CardDescription className="text-center">
              Please wait while we check if the username is available
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
              <p className="text-sm text-zinc-400">
                Checking availability for "{username}"
              </p>
            </div>
          </CardContent>
        </>
      )}

      {step === "confirm" && (
        <>
          <CardHeader>
            <CardTitle className="text-center">Confirm Your Identity</CardTitle>
            <CardDescription className="text-center">
              Set up a passkey for {username} to secure your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-800 p-4 text-center">
                <Fingerprint className="h-12 w-12 mx-auto mb-2 text-amber-500" />
                <p className="text-sm text-zinc-400">
                  You'll use this passkey to securely access your account in the
                  future. No password needed!
                </p>
              </div>
              <div className="text-center">
                <p className="font-medium">Username: {username}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button
              onClick={handleRegisterPasskey}
              disabled={isRegistering}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black"
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
              className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Back
            </Button>
          </CardFooter>
        </>
      )}

      {step === "success" && (
        <>
          <CardHeader>
            <div className="mx-auto w-fit p-4 rounded-full bg-amber-500/10 mb-4">
              <CheckCircle className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle className="text-center">Pass Key Linked</CardTitle>
            <CardDescription className="text-center">
              Now you we need to generate your account details.
            </CardDescription>
          </CardHeader>
          <CardContent></CardContent>
          <CardFooter>
            <Button
              onClick={handleGenerateAccounts}
              disabled={isGeneratingAccount}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black"
            >
              {isGeneratingAccount ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Account Details
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Generate Account
                </>
              )}
            </Button>
          </CardFooter>
        </>
      )}
    </>
  );
};

export default SignUp;
