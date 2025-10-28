"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_PASSKEY_USERNAME } from "@/const";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { restoreAccountWithMnemonic } from "@/lib/passkey";
import { ethers } from "ethers";
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";

interface RecoveryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RecoveryModal = ({ open, onOpenChange }: RecoveryModalProps) => {
  const { signIn } = useAuth();
  const [step, setStep] = useState<"input" | "confirm" | "complete">("input");
  const [mnemonic, setMnemonic] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const [recoveredAddress, setRecoveredAddress] = useState("");

  const validateAndShowAddress = () => {
    try {
      const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());
      setRecoveredAddress(wallet.address);
      setStep("confirm");
      return true;
    } catch (error) {
      console.error(error);
      toast({
        title: "Invalid Recovery Phrase",
        description: "Please check your recovery phrase and try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);

    try {
      const success = await restoreAccountWithMnemonic(
        DEFAULT_PASSKEY_USERNAME,
        mnemonic.trim(),
      );

      if (!success) {
        throw new Error("Failed to restore account");
      }

      await signIn(mnemonic.trim());
      setStep("complete");

      toast({
        title: "Account Restored",
        description:
          "Your account has been successfully restored and secured with your passkey.",
      });
    } catch (error) {
      console.error("Restore error:", error);
      toast({
        title: "Restore Failed",
        description: "Failed to restore your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClose = () => {
    setStep("input");
    setMnemonic("");
    setRecoveredAddress("");
    onOpenChange(false);
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(recoveredAddress);
    toast({
      title: "Address Copied",
      description: "Address has been copied to clipboard",
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Restore Account
          </DialogTitle>
          <DialogDescription>
            Enter your 12 or 24 word recovery phrase to restore your
            commbank.eth account.
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Enter your recovery phrase (12 or 24 words separated by spaces)..."
                className="h-24 resize-none"
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
              />
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-600">
                <strong>Warning:</strong> This will replace your current account
                with the recovered one. Make sure you have access to your
                current account&apos;s recovery phrase if you need it later.
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={validateAndShowAddress}
                disabled={!mnemonic.trim()}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <Card className="p-4">
              <h4 className="font-medium mb-3 text-center">Account Preview</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Recovered Address:
                  </p>
                  <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <code className="text-sm font-mono">
                      {recoveredAddress.slice(0, 6)}...
                      {recoveredAddress.slice(-4)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={copyAddress}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  This will become your new commbank.eth account address.
                </div>
              </div>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
                className="flex-1"
                disabled={isRestoring}
              >
                Back
              </Button>
              <Button
                onClick={handleRestore}
                disabled={isRestoring}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restoring...
                  </>
                ) : (
                  "Confirm Restore"
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-fit p-4 rounded-full bg-green-500/10">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium mb-2">
                Account Restored Successfully!
              </h3>
              <p className="text-sm text-muted-foreground">
                Your account has been restored and secured with your passkey.
                You can now access your recovered wallet.
              </p>
            </div>
            <Button
              onClick={handleClose}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black"
            >
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RecoveryModal;
