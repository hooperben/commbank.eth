import { Button } from "@/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/_components/ui/dialog";
import { useAuth } from "@/_providers/auth-provider";
import { resetAppData } from "@/lib/db";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ResetAppModal() {
  const { signIn, getMnemonic } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    try {
      setIsResetting(true);

      // Get mnemonic before reset for re-sync
      const mnemonic = await getMnemonic();
      if (!mnemonic) {
        toast.error("Failed to retrieve account credentials");
        setIsResetting(false);
        return;
      }

      // Clear app data (notes, tree, payloads, private transactions)
      await resetAppData();

      // Re-sync by signing in again with the mnemonic
      await signIn(mnemonic);

      // Close modal
      setIsOpen(false);

      // Show success message
      toast.success("App Reset Complete", {
        description: "Your data has been cleared and re-synced.",
      });
    } catch (error) {
      console.error("Reset app error:", error);
      toast.error("Failed to reset app");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reset & Re-sync
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset App Data</DialogTitle>
          <DialogDescription>
            This will clear your local cache and re-sync your account data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Info */}
          <div className="rounded-md border border-border bg-muted/50 p-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">What will be cleared:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Cached notes and balances</li>
                <li>Merkle tree data</li>
                <li>Private transaction history</li>
              </ul>
              <p className="text-sm font-medium mt-3">What will be kept:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Your account credentials</li>
                <li>Your contacts</li>
                <li>Approval transactions</li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            After reset, your account will automatically re-sync with the
            indexers. This may take a moment.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReset}
              disabled={isResetting}
              className="flex-1 gap-2"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Reset & Re-sync
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
