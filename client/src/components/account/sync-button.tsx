import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useState } from "react";

type SyncState = "syncing" | "complete" | "error";

interface SyncButtonProps {
  state: SyncState;
  errorMessage?: string;
}

export function SyncButton({
  state,
  errorMessage = "An error occurred during sync",
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
              <Button
                disabled
                variant="outline"
                size="icon"
                className="h-10 w-10"
                aria-label="Syncing"
              >
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Scanning for new private balances</TooltipContent>
          </Tooltip>
        )}

        {state === "complete" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                disabled
                variant="outline"
                size="icon"
                className="h-10 w-10"
                aria-label="Sync complete"
              >
                <CheckCircle className="h-5 w-5 text-green-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Account Synced</TooltipContent>
          </Tooltip>
        )}

        {state === "error" && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 hover:bg-destructive/10"
                  onClick={handleErrorClick}
                  aria-label="Sync error, click for details"
                >
                  <XCircle className="h-5 w-5 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Error Syncing</TooltipContent>
            </Tooltip>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sync Error</DialogTitle>
                  <DialogDescription>{errorMessage}</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
