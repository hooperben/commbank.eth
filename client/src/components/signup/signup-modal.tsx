import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RestoreAccount } from "./restore-account";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: () => void;
}

export function SignupModal({
  isOpen,
  onClose,
  onCreateAccount,
}: SignupModalProps) {
  const [showRestore, setShowRestore] = useState(false);

  const handleCreateAccount = () => {
    onCreateAccount();
    onClose();
  };

  const handleRestoreComplete = (mnemonic: string) => {
    // Sign the user up with the restored mnemonic
    console.log("Restore complete with mnemonic:", mnemonic);
    onClose();
    setShowRestore(false);
  };

  if (showRestore) {
    return (
      <RestoreAccount
        isOpen={isOpen}
        onClose={() => {
          setShowRestore(false);
          onClose();
        }}
        onComplete={handleRestoreComplete}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            Get Started
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <Button
            onClick={handleCreateAccount}
            className="w-full h-12 text-base"
            variant="outline"
          >
            create a commbank.eth account
          </Button>

          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Already have an account and need to restore it?
            </p>
            <Button
              onClick={() => setShowRestore(true)}
              className="w-full h-10"
              variant="outline"
            >
              Restore
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
