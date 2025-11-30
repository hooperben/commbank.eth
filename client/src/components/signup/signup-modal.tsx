import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsRegistered } from "@/hooks/use-is-registered";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RestoreAccount } from "./restore-account";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: () => Promise<void>;
}

export function SignupModal({
  isOpen,
  onClose,
  onCreateAccount,
}: SignupModalProps) {
  const [showRestore, setShowRestore] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    setLoading(true);
    await onCreateAccount();
    setLoading(false);
    onClose();
  };

  const { data: isRegistered, refetch: refetchIsRegistered } =
    useIsRegistered();

  const handleRestoreComplete = async (mnemonic: string) => {
    try {
      await signIn(mnemonic);
      await refetchIsRegistered();
      navigate("/account");
      toast.success("Account restored successfully", {
        description: "Welcome back",
      });
      onClose();
      setShowRestore(false);
    } catch (error) {
      console.error("Failed to restore account:", error);
      toast.error("Failed to restore account. Please try again.");
    }
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
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading && isRegistered && <p>(2/2) Sign in with passkey</p>}
            {loading && !isRegistered && <p>(1/2) Registering passkey</p>}
            {!loading && <p> create a commbank.eth account</p>}
          </Button>

          <div className="text-center space-y-3">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                A commbank.eth account is a passkey based authentication system
                that lives entirely on your device.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Already have an account and need to restore it?
            </p>
            <Button
              onClick={() => setShowRestore(true)}
              className="w-32 h-10"
              variant="secondary"
            >
              Restore
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
