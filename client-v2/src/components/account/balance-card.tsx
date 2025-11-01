import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

interface BalanceCardProps {
  balance: string;
  usdValue: string;
  isLoading?: boolean;
  onAssetBreakdownClick?: () => void;
}

export function BalanceCard({
  balance,
  usdValue,
  isLoading,
  onAssetBreakdownClick,
}: BalanceCardProps) {
  if (isLoading) {
    return (
      <Card className="backdrop-blur-xl bg-background/40 border-border/50">
        <CardContent className="p-8">
          <Skeleton className="h-12 w-48 mb-4" />
          <Skeleton className="h-6 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-xl bg-background/40 border-border/50 shadow-lg">
      <CardContent className="p-8">
        <div className="space-y-2">
          <h2 className="text-5xl font-bold tracking-tight">{balance}</h2>
          <p className="text-muted-foreground text-lg">{usdValue}</p>
        </div>

        <button
          onClick={onAssetBreakdownClick}
          className="mt-6 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Asset Breakdown
          <ChevronRight className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
