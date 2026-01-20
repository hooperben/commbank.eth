import { BackupAccountModal } from "@/_components/settings/backup-account-modal";
import { useAuth } from "@/_providers/auth-provider";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

const BACKUP_STORAGE_KEY = "commbank-account-backed-up";

export function ExperimentalBanner() {
  const { isSignedIn } = useAuth();
  const [hasBackedUp, setHasBackedUp] = useState(true); // Default to true to prevent flash

  useEffect(() => {
    const backed = localStorage.getItem(BACKUP_STORAGE_KEY);
    setHasBackedUp(backed === "true");
  }, []);

  const handleBackupSuccess = () => {
    localStorage.setItem(BACKUP_STORAGE_KEY, "true");
    setHasBackedUp(true);
  };

  // Don't show if not signed in or already backed up
  if (!isSignedIn || hasBackedUp) {
    return null;
  }

  return (
    <div className="w-full mb-6 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1 text-left">
          <p className="text-base font-medium text-yellow-500">
            commbank.eth is experimental
          </p>
          <p className="text-sm text-muted-foreground">
            Please practise caution and{" "}
            <BackupAccountModal
              onBackupSuccess={handleBackupSuccess}
              trigger={
                <button className="underline text-yellow-500 hover:text-yellow-400 font-medium cursor-pointer">
                  backup your account secret
                </button>
              }
            />
          </p>
        </div>
      </div>
    </div>
  );
}
