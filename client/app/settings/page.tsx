"use client";

import ThemeToggle from "@/components/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { CheckIcon } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { token } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
    <div className="flex flex-1 flex-col gap-4 px-6 p-2 pt-0">
      <h1 className="text-3xl text-primary">Settings</h1>

      {token && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <p className="text-sm">Export your secret phrase</p>
            <Button className="max-w-[200px]" onClick={handleExportAccount}>
              Export Account
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Currency Display</Label>
          <RadioGroup
            value={currency}
            onValueChange={(value) => setCurrency(value as "USD" | "AUD")}
            className="flex flex-row gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="USD" id="usd" />
              <Label htmlFor="usd" className="cursor-pointer">
                USD (US Dollar)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="AUD" id="aud" />
              <Label htmlFor="aud" className="cursor-pointer">
                AUD (Australian Dollar)
              </Label>
            </div>
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            Choose your preferred currency for displaying values
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <ThemeToggle />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your Secret Recovery Phrase</DialogTitle>
            <DialogDescription>
              Keep this phrase safe and secure. Anyone with this phrase can
              access your account. Paste this somewhere only you have access to,
              ideally not on the internet.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 bg-secondary/20 rounded-md my-4 break-all font-mono">
            {mnemonic}
          </div>

          <DialogFooter className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => {
                if (mnemonic) {
                  navigator.clipboard.writeText(mnemonic);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
            >
              {copied ? (
                <>
                  <CheckIcon className="mr-2 h-4 w-4 animate-pulse text-green-500" />
                  Copied!
                </>
              ) : (
                "Copy to Clipboard"
              )}
            </Button>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
