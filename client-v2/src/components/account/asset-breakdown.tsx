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
      <Card className="backdrop-blur-xl bg-background/40 border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-xl bg-background/40 border-border/50">
      <CardHeader>
        <CardTitle>Asset Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockAssets.map((asset, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:border-border/60 transition-colors"
          >
            <div>
              <div className="font-semibold">{asset.symbol}</div>
              <div className="text-sm text-muted-foreground">
                {asset.name} • {asset.chainName}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{asset.balance}</div>
              <div className="text-sm text-muted-foreground">
                {asset.usdValue}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
