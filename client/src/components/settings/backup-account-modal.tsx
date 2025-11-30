import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import {
  copyToClipboard,
  downloadAsJson,
  encryptMnemonicWithPin,
} from "@/lib/backup-helpers";
import { AlertTriangle, Copy, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function BackupAccountModal() {
  const { getMnemonic } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [confirmExport, setConfirmExport] = useState(false);
  const [addPin, setAddPin] = useState(true);
  const [pin, setPin] = useState("");

  // only show error if it's around the same length
  const canExport = confirmExport;

  function waitForWindowFocus(): Promise<void> {
    return new Promise((resolve) => {
      // If window is already focused, resolve immediately
      if (document.hasFocus()) {
        resolve();
        return;
      }

      // Otherwise, wait for focus event
      const handleFocus = () => {
        window.removeEventListener("focus", handleFocus);
        // Small delay to ensure clipboard API is ready
        setTimeout(resolve, 100);
      };

      window.addEventListener("focus", handleFocus, { once: true });
    });
  }

  const handleExportToClipboard = async () => {
    try {
      // Require passkey interaction to decrypt mnemonic
      const mnemonic = await getMnemonic();
      if (!mnemonic) {
        toast.error("Failed to retrieve account");
        return;
      }

      let exportData: string;

      if (addPin && pin) {
        // Export encrypted with PIN
        const encrypted = encryptMnemonicWithPin(mnemonic, pin);
        exportData = JSON.stringify({ encryptedMnemonic: encrypted }, null, 2);
      } else {
        // Export plain mnemonic
        exportData = JSON.stringify({ mnemonic }, null, 2);
      }

      // Wait for window focus before copying (in case passkey dialog lost focus)
      await waitForWindowFocus();

      await copyToClipboard(exportData);
      toast.success("Account backup copied to clipboard!");
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Export to clipboard error:", error);
      toast.error("Failed to export to clipboard");
    }
  };

  const handleExportToFile = async () => {
    try {
      // Require passkey interaction to decrypt mnemonic
      const mnemonic = await getMnemonic();
      if (!mnemonic) {
        toast.error("Failed to retrieve account");
        return;
      }

      let exportData: Record<string, string>;

      if (addPin && pin) {
        // Export encrypted with PIN
        const encrypted = encryptMnemonicWithPin(mnemonic, pin);
        exportData = { encryptedMnemonic: encrypted };
      } else {
        // Export plain mnemonic
        exportData = { mnemonic };
      }

      downloadAsJson(exportData);
      toast.success("Account backup downloaded!");
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("Export to file error:", error);
      toast.error("Failed to export to file");
    }
  };

  const resetForm = () => {
    setConfirmExport(false);
    setAddPin(true);
    setPin("");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="">
          Back Up Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Back Up Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Confirm Export Warning */}
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-destructive">
                  Warning: Your account secret will be exported
                </p>
                <p className="text-xs text-muted-foreground">
                  Anyone with access to this backup can control all of your
                  account. Keep it secure.
                </p>
              </div>
            </div>
          </div>

          {/* Confirm Export Checkbox */}
          <Label
            className="hover:bg-accent/50 flex items-start gap-3 rounded-md border border-input p-3 transition-colors cursor-pointer"
            htmlFor="confirm-export"
          >
            <Checkbox
              id="confirm-export"
              checked={confirmExport}
              onCheckedChange={(checked) =>
                setConfirmExport(checked as boolean)
              }
            />
            <span className="text-sm">
              I understand and want to export my account secret
            </span>
          </Label>

          {/* Export Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              onClick={handleExportToClipboard}
              disabled={!canExport}
              variant="outline"
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Export to Clipboard
            </Button>
            <Button
              onClick={handleExportToFile}
              disabled={!canExport}
              variant="outline"
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export to File
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
