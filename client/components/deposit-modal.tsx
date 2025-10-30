"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Copy, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DepositModal = ({ open, onOpenChange }: DepositModalProps) => {
  const { address, isSignedIn } = useAuth();

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address copied",
        description: "Your commbank.eth address has been copied to clipboard",
      });
    }
  };

  if (!isSignedIn || !address) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Deposit to commbank.eth
          </DialogTitle>
          <DialogDescription>
            Send assets to your commbank.eth address using the QR code or by
            copying the address below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code */}
          <Card className="p-6 flex justify-center">
            <QRCodeCanvas
              value={address}
              size={200}
              level="M"
              className="rounded-lg"
            />
          </Card>

          {/* Address Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Your commbank.eth Address
            </label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono break-all">
                {address}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyAddress}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Warning */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> Only send assets on supported networks
              to this address. Sending assets on unsupported networks may result
              in permanent loss.
            </p>

            <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
              commbank.eth currently supports ethereum, base, optimism and
              arbitrum.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositModal;
