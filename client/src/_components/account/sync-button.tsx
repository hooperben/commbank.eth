import { Button } from "@/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/_components/ui/tooltip";
import { CheckCircle, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useState } from "react";

type SyncState = "syncing" | "complete" | "error";

interface SyncButtonProps {
  state: SyncState;
  errorMessage?: string;
  onSync?: () => void;
}

export function SyncButton({
  state,
  errorMessage = "An error occurred during sync",
  onSync,
}: SyncButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleErrorClick = () => {
    setIsDialogOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        {state === "syncing" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled variant="outline" aria-label="Syncing">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Scanning for new private balances</TooltipContent>
          </Tooltip>
        )}

        {state === "complete" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                aria-label="Sync complete - Click to sync again"
                onClick={onSync}
              >
                <RefreshCw className="h-4 w-4 text-green-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>Synced - Click to refresh</span>
              </div>
            </TooltipContent>
          </Tooltip>
        )}

        {state === "error" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={handleErrorClick}
                  aria-label="Sync error, click for details"
                >
                  <XCircle className="h-4 w-4 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Error Syncing - Click for details</TooltipContent>
            </Tooltip>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sync Error</DialogTitle>
                  <DialogDescription>{errorMessage}</DialogDescription>
                </DialogHeader>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      onSync?.();
                    }}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Retry Sync
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
