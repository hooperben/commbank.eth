import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteAllAccountData } from "@/lib/account-deletion-helpers";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function DeleteAccountModal() {
  const { getMnemonic, signOut } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);

      // Validate the mnemonic matches
      const account = await getMnemonic();
      if (!account) {
        toast.error("Failed to retrieve account");
        setIsDeleting(false);
        return;
      }

      // Delete all data
      await deleteAllAccountData();

      // Close modal
      setIsOpen(false);

      // Show success message
      toast.success("Deletion Successful", {
        description: "Have a nice day.",
      });

      // Sign out
      signOut();

      // Navigate to home
      navigate("/");
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error("Failed to delete account");
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setIsDeleting(false);
  };

  const isValidInput = "delete my account";

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
            <Label
              htmlFor="delete-confirm"
              className="text-sm flex flex-row font-light"
            >
              Please Enter the text
            </Label>
            <Label htmlFor="delete-confirm" className="text-sm text-primary">
              'delete my account'.{" "}
            </Label>

            <Textarea
              id="delete-confirm"
              placeholder=""
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              rows={4}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Deleting your account will require passkey authentication.
            </p>
          </div>

          {/* Delete Button */}
          <Button
            onClick={handleDeleteAccount}
            disabled={confirmText !== isValidInput || isDeleting}
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
