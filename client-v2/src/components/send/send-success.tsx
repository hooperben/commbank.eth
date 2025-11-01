import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ExternalLink } from "lucide-react";

interface SendSuccessProps {
  txHash: string;
  onClose: () => void;
}

export function SendSuccess({ txHash, onClose }: SendSuccessProps) {
  const handleViewTransaction = () => {
    // TODO: Open block explorer with actual chain
    const explorerUrl = `https://etherscan.io/tx/${txHash}`;
    window.open(explorerUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <Card className="backdrop-blur-xl bg-background/40 border-border/50">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold">Transaction Sent!</h3>
            <p className="text-muted-foreground">
              Your transaction has been submitted to the network
            </p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
            <div className="text-xs text-muted-foreground mb-2">
              Transaction Hash
            </div>
            <div className="font-mono text-xs break-all">{txHash}</div>
          </div>

          <Button
            onClick={handleViewTransaction}
            variant="outline"
            className="w-full rounded-xl backdrop-blur-xl bg-background/40 border-border/50"
          >
            View on Block Explorer
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Button
        onClick={onClose}
        size="lg"
        className="w-full h-12 text-lg font-semibold rounded-xl backdrop-blur-xl bg-primary hover:bg-primary/90 transition-all"
      >
        Done
      </Button>
    </div>
  );
}
