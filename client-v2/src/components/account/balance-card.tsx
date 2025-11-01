import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "../ui/button";

interface BalanceCardProps {
  balance: string;
  usdValue: string;
  isLoading?: boolean;
  isSwitched?: boolean;
  onAssetBreakdownClick?: () => void;
}

export function BalanceCard({
  balance,
  usdValue,
  isLoading,
  isSwitched,
  onAssetBreakdownClick,
}: BalanceCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-background border-0 shadow-none">
        <CardContent className="p-0 pt-6">
          <Skeleton className="h-16 w-48 mb-2" />
          <Skeleton className="h-5 w-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex bg-background border-0 shadow-none w-full flex-col">
      <CardContent className="p-0">
        <div className="space-y-4">
          <h2 className="text-7xl font-light tracking-tight text-foreground">
            {balance}
          </h2>
          <p className="text-sm text-muted-foreground font-normal">
            {usdValue}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex w-full justify-end">
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={onAssetBreakdownClick}
        >
          {isSwitched ? "Hide" : "Show"} Asset Balances
        </Button>
      </CardFooter>
    </Card>
  );
}
