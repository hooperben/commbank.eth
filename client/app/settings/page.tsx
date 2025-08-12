"use client";

import ThemeToggle from "@/components/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/lib/auth-context";
import { useCurrency } from "@/lib/currency-context";
import { retrieveMnemonic } from "@/lib/passkey";
import { CheckIcon, DollarSign, Download, Palette, Shield } from "lucide-react";
import { useState } from "react";

export default function Settings() {
  const { token } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const closeModal = () => {
    setIsModalOpen(false);
    setMnemonic(null);
  };

  const handleExportAccount = async () => {
    try {
      setError(null);
      // This will trigger the passkey authentication
      const retrievedMnemonic = await retrieveMnemonic();

      if (retrievedMnemonic) {
        setMnemonic(retrievedMnemonic);
        setIsModalOpen(true);
      } else {
        setError(
          "Could not retrieve your account information. Make sure you have a registered passkey.",
        );
      }
    } catch (err) {
      console.error("Export account error:", err);
      setError("Failed to authenticate with passkey.");
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 py-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and security settings
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        {token && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Account Security
              </CardTitle>
              <CardDescription>
                Export your secret recovery phrase for backup purposes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                  <AlertDescription className="text-orange-800 dark:text-orange-200">
                    Keep your recovery phrase safe and secure. Anyone with
                    access to it can control your account.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handleExportAccount}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Recovery Phrase
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Currency Display
            </CardTitle>
            <CardDescription>
              Choose your preferred currency for displaying values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={currency}
              onValueChange={(value) => setCurrency(value as "USD" | "AUD")}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="USD" id="usd" />
                <Label htmlFor="usd" className="cursor-pointer flex-1">
                  <div className="font-medium">USD (US Dollar)</div>
                  <div className="text-sm text-muted-foreground">
                    United States Dollar
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="AUD" id="aud" />
                <Label htmlFor="aud" className="cursor-pointer flex-1">
                  <div className="font-medium">AUD (Australian Dollar)</div>
                  <div className="text-sm text-muted-foreground">
                    Australian Dollar
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel of your interface
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Theme</Label>
                <ThemeToggle />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              Your Secret Recovery Phrase
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p>
                Keep this phrase safe and secure. Anyone with this phrase can
                access your account.
              </p>
              <p className="text-orange-600 dark:text-orange-400 font-medium">
                Store this somewhere only you have access to, ideally offline.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-secondary/20 rounded-lg my-4 break-all font-mono text-sm border-2 border-dashed border-orange-200 dark:border-orange-800">
            {mnemonic}
          </div>

          <DialogFooter className="flex justify-between items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (mnemonic) {
                  navigator.clipboard.writeText(mnemonic);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className="flex-1"
            >
              {copied ? (
                <>
                  <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                "Copy to Clipboard"
              )}
            </Button>
            <Button onClick={() => closeModal()} className="flex-1">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
