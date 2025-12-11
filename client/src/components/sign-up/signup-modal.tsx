import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsRegistered } from "@/_hooks/use-is-registered";
import { useAuth } from "@/_providers/auth-provider";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { RestoreAccount } from "./restore-account";
import { useSignUp } from "@/_hooks/use-sign-up";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignupModal({ isOpen, onClose }: SignupModalProps) {
  const [showRestore, setShowRestore] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const { refetch: refetchIsRegistered } = useIsRegistered();

  const { state, mutateAsync: signUp, isPending } = useSignUp();

  useEffect(() => {
    console.log("Signup state changed:", state);
  }, [state]);

  const handleCreateAccount = async () => {
    try {
      await signUp();
      // Note: onClose is handled by useSignUp's onSuccess callback via navigation
    } catch (error) {
      // Error already handled by useSignUp's onError callback
      // Keep modal open so user can try again
    }
  };

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
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending && <span>{"Registering passkey and signing in"}</span>}
            {!isPending && <span>create a commbank.eth account</span>}
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
