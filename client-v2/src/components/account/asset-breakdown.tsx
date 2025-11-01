import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";

interface Asset {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  chainName: string;
}

interface AssetBreakdownProps {
  assets?: Asset[];
}

export function AssetBreakdown({ assets }: AssetBreakdownProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fake loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // TODO: Replace with real asset data from wallet
  const mockAssets: Asset[] = assets || [
    {
      symbol: "USDC",
      name: "USD Coin",
      balance: "5.00",
      usdValue: "$5.00",
      chainName: "Base",
    },
    {
      symbol: "AUDD",
      name: "Australian Digital Dollar",
      balance: "5.00",
      usdValue: "$5.00",
      chainName: "Ethereum",
    },
  ];

  if (isLoading) {
    return (
      <Card className="bg-background border-0 shadow-none">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background border-0 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Asset Breakdown
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockAssets.map((asset, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors duration-150 border-0"
          >
            <div className="text-left">
              <div className="font-medium text-sm text-foreground">
                {asset.symbol}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {asset.name}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-sm text-foreground">
                {asset.balance}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {asset.usdValue}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
