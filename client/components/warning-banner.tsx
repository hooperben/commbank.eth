import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export function WarningBanner() {
  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="font-medium">
        commbank.eth is experimental and unaudited. Please export your account
        secret on the settings page before depositing funds.
      </AlertDescription>
    </Alert>
  );
}
