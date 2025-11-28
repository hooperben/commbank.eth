import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { isValidMnemonic } from "@/lib/mnemonic-helpers";
import { deleteAllAccountData } from "@/lib/account-deletion-helpers";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function DeleteAccountModal() {
  const { getMnemonic, signOut } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [mnemonicInput, setMnemonicInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      // Validate the mnemonic matches
      const actualMnemonic = await getMnemonic();
      if (!actualMnemonic) {
        toast.error("Failed to retrieve account mnemonic");
        setIsDeleting(false);
        return;
      }

      const trimmedInput = mnemonicInput.trim();

      // Validate input is a valid mnemonic
      if (!isValidMnemonic(trimmedInput)) {
        toast.error("Invalid mnemonic phrase");
        setIsDeleting(false);
        return;
      }

      // Check if input matches actual mnemonic
      if (trimmedInput !== actualMnemonic) {
        toast.error("Mnemonic does not match your account");
        setIsDeleting(false);
        return;
      }

      // Sign out first
      signOut();

      // Delete all data
      await deleteAllAccountData();

      // Close modal
      setIsOpen(false);

      // Show success message
      toast.success("Everything's deleted - have a good day!");

      // Navigate to home
      navigate("/");
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error("Failed to delete account");
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setMnemonicInput("");
    setIsDeleting(false);
  };

  const isValidInput = mnemonicInput.trim() && isValidMnemonic(mnemonicInput.trim());

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-destructive">
                  This action cannot be undone
                </p>
                <p className="text-xs text-muted-foreground">
                  All your account data including localStorage, sessionStorage,
                  and IndexedDB will be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          {/* Mnemonic Verification */}
          <div className="space-y-2">
            <Label htmlFor="mnemonic-verify" className="text-sm">
              Enter your 24-word mnemonic to confirm deletion
            </Label>
            <Textarea
              id="mnemonic-verify"
              placeholder="word1 word2 word3 ..."
              value={mnemonicInput}
              onChange={(e) => setMnemonicInput(e.target.value)}
              rows={4}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              This will require passkey authentication to retrieve your mnemonic
              for verification.
            </p>
          </div>

          {/* Delete Button */}
          <Button
            onClick={handleDeleteAccount}
            disabled={!isValidInput || isDeleting}
            variant="destructive"
            className="w-full gap-2"
          >
            {isDeleting ? (
              "Deleting..."
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Permanently Delete Account
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
