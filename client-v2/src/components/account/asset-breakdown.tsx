import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { sepoliaAssets, type SupportedAsset } from "shared/constants/token";
import { Balance } from "../token/balance";

export function AssetBreakdown() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fake loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // TODO: Replace with real asset data from wallet
  const mockAssets: SupportedAsset[] = sepoliaAssets;

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
        {mockAssets.map((asset) => (
          <Balance key={`${asset.address}${asset.chainId}`} asset={asset} />
        ))}
      </CardContent>
    </Card>
  );
}
