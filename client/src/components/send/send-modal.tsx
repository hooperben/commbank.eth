import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowUpRight } from "lucide-react";
import type { SupportedAsset } from "shared/constants/token";

export function SendModal({
  open,
  onOpenChange,
  asset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: SupportedAsset;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send {asset?.symbol}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-6">
          <Button
            variant="outline"
            className="w-full h-16 text-lg font-semibold flex-col gap-1"
            onClick={() => {
              // TODO: Implement send public balance
              onOpenChange(false);
            }}
          >
            <ArrowUpRight className="h-5 w-5" />
            <span className="text-sm">Send Public Balance</span>
          </Button>
          <Button
            variant="outline"
            className="w-full h-16 text-lg font-semibold flex-col gap-1"
            onClick={() => {
              // TODO: Implement send private balance
              onOpenChange(false);
            }}
          >
            <ArrowUpRight className="h-5 w-5" />
            <span className="text-sm">Send Private Balance</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
