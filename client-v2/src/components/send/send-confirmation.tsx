import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import type { SendFormData } from "./send-modal";

interface SendConfirmationProps {
  data: SendFormData;
  onConfirm: () => Promise<void>;
  onBack: () => void;
}

export function SendConfirmation({
  data,
  onConfirm,
  onBack,
}: SendConfirmationProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Transaction failed:", error);
      // TODO: Show error toast
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-background/40 border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold">{data.amount}</div>
            <div className="text-lg text-muted-foreground">{data.token}</div>
            <div className="text-sm text-muted-foreground">
              {/* TODO: Add USD conversion */}≈ $
              {(parseFloat(data.amount) * 1).toFixed(2)} USD
            </div>
          </div>

          <div className="py-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-sm text-muted-foreground">From</div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">To</div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-mono text-xs">
                {data.recipient.slice(0, 6)}...{data.recipient.slice(-4)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium">{getChainName(data.chainId)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Gas Fee</span>
              <span className="font-medium">
                {/* TODO: Calculate real gas fee */}
                ~$0.50
              </span>
            </div>

            <div className="pt-3 border-t border-border/30">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  {/* TODO: Add gas fee to total */}≈ $
                  {(parseFloat(data.amount) * 1 + 0.5).toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button
          onClick={handleConfirm}
          disabled={isConfirming}
          size="lg"
          className="w-full h-12 text-lg font-semibold rounded-xl backdrop-blur-xl bg-primary hover:bg-primary/90 transition-all"
        >
          {isConfirming ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Confirming...
            </>
          ) : (
            "Confirm & Send"
          )}
        </Button>

        <Button
          onClick={onBack}
          disabled={isConfirming}
          variant="outline"
          size="lg"
          className="w-full h-12 text-lg font-semibold rounded-xl backdrop-blur-xl bg-background/40 border-border/50"
        >
          Back
        </Button>
      </div>
    </div>
  );
}

function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: "Ethereum",
    8453: "Base",
    10: "Optimism",
    137: "Polygon",
  };
  return chainNames[chainId] || `Chain ${chainId}`;
}
