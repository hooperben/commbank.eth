"use client";

import type React from "react";

import { CheckCircle, Fingerprint, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_PASSKEY_USERNAME } from "@/const";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { initDB } from "@/lib/db";
import { registerPasskey, storeMnemonicWithPasskey } from "@/lib/passkey";
import {
  generateAndStoreRSAAccount,
  storeEVMAccountPublicKey,
} from "@/lib/wallet";
import { ethers } from "ethers";

// Generate a random 32-byte string

const SignUp = () => {
  const { signIn } = useAuth();
  const [step, setStep] = useState<"confirm" | "success" | "complete">(
    "confirm",
  );
  const [isRegistering, setIsRegistering] = useState(false);
  const [isGeneratingAccount, setIsGeneratingAccount] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMnemonic, setImportMnemonic] = useState("");
  const [isImportingAccount, setIsImportingAccount] = useState(false);

  const handleRegisterPasskey = async () => {
    setIsRegistering(true);

    await initDB();

    try {
      // Register passkey
      const success = await registerPasskey(DEFAULT_PASSKEY_USERNAME);

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

  const handleGenerateAccounts = async () => {
    setIsGeneratingAccount(true);

    await initDB();

    try {
      const random = ethers.Wallet.createRandom();

      console.log(random);

      if (!random.mnemonic) {
        throw new Error("Failed to create account.");
      }

      // Store the secret securely with passkeys
      const storageSuccess = await storeMnemonicWithPasskey(
        DEFAULT_PASSKEY_USERNAME,
        random.mnemonic?.phrase,
      );

      if (!storageSuccess) {
        throw new Error("Failed to securely store mnemonic");
      }

      // Generate EVM and RSA keys
      storeEVMAccountPublicKey(random.address, DEFAULT_PASSKEY_USERNAME);
      await generateAndStoreRSAAccount(
        random.mnemonic?.phrase,
        DEFAULT_PASSKEY_USERNAME,
      );

      // Sign the user in
      signIn(random.privateKey);

      setStep("complete");

      toast({
        title: "Success",
        description:
          "Your wallet has been created and secured with your passkey",
      });
    } catch (err) {
      console.error("Failed to generate accounts:", err);
      toast({
        title: "Error",
        description: "Failed to generate and secure your wallet",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAccount(false);
    }
  };

  const handleImportAccount = async () => {
    setIsImportingAccount(true);

    await initDB();

    try {
      // Validate the mnemonic
      if (!ethers.Wallet.fromPhrase(importMnemonic.trim())) {
        throw new Error("Invalid mnemonic phrase");
      }

      // Create wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(importMnemonic.trim());

      // Store the secret securely with passkeys
      const storageSuccess = await storeMnemonicWithPasskey(
        DEFAULT_PASSKEY_USERNAME,
        importMnemonic.trim(),
      );

      if (!storageSuccess) {
        throw new Error("Failed to securely store mnemonic");
      }

      // Generate EVM and RSA keys
      storeEVMAccountPublicKey(wallet.address, DEFAULT_PASSKEY_USERNAME);
      await generateAndStoreRSAAccount(
        importMnemonic.trim(),
        DEFAULT_PASSKEY_USERNAME,
      );

      // Sign the user in
      signIn(wallet.privateKey);

      setStep("complete");

      toast({
        title: "Success",
        description:
          "Your wallet has been imported and secured with your passkey",
      });
    } catch (err) {
      console.error("Failed to import account:", err);
      toast({
        title: "Error",
        description:
          "Failed to import your wallet. Please check your recovery phrase.",
        variant: "destructive",
      });
    } finally {
      setIsImportingAccount(false);
      setIsImporting(false);
    }
  };

  return (
    <>
      {step === "confirm" && (
        <>
          <CardHeader>
            <CardTitle className="text-center">Create your account</CardTitle>
            <CardDescription className="text-center">
              commbank.eth uses passkey authentication to store your account
              details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-800 p-4 text-center">
                <Fingerprint className="h-12 w-12 mx-auto mb-2 text-amber-500" />
                <p className="text-sm text-zinc-400">
                  You&apos;ll use this passkey to securely access your account
                  in the future. No password needed!
                </p>
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
                  Registering your passkey...
                </>
              ) : (
                <>
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Register Passkey
                </>
              )}
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
              {isImporting
                ? "Please enter your recovery phrase below"
                : "Now you we need to generate your account details."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col">
            {isImporting ? (
              <>
                <Textarea
                  placeholder="Enter your 12 or 24 word recovery phrase..."
                  className="mb-4 h-24 resize-none"
                  value={importMnemonic}
                  onChange={(e) => setImportMnemonic(e.target.value)}
                />
                <div className="flex gap-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsImporting(false);
                      setImportMnemonic("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportAccount}
                    disabled={isImportingAccount || !importMnemonic.trim()}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    {isImportingAccount ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      "Import"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <>
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

                <div className="flex flex-col pt-4 gap-2">
                  <p className="text-xs">or, import an existing account</p>

                  <Button
                    variant="secondary"
                    onClick={() => setIsImporting(true)}
                  >
                    Import Account
                  </Button>
                </div>
              </>
            )}
          </CardFooter>
        </>
      )}
    </>
  );
};

export default SignUp;
