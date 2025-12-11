import { ShareProfile } from "@/components/account/share-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAccountTotal } from "@/_hooks/use-account-total";
import { useAudUsdPrice, useEthUsdPrice } from "@/_hooks/use-chainlink-price";
import { usePreferredCurrency } from "@/_hooks/use-preferred-currency";
import { Info } from "lucide-react";
import { useState } from "react";
import { defaultNetwork } from "shared/constants/token";

export const BalanceCard = () => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Fetch price data from Chainlink
  const { data: ethUsdPrice, isLoading: isLoadingEthUsd } = useEthUsdPrice();
  const { data: audUsdPrice, isLoading: isLoadingAudUsd } = useAudUsdPrice();

  const {
    currency,
    toggleCurrency,
    isLoading: isLoadingCurrency,
  } = usePreferredCurrency();

  const { totalUsd, isLoading: isLoadingTotal } = useAccountTotal();

  // Calculate total in AUD
  const totalAud =
    audUsdPrice && totalUsd
      ? totalUsd / parseFloat(audUsdPrice.formattedPrice)
      : 0;

  // Calculate ETH value in AUD (ETH/USD / AUD/USD)
  const ethAudValue =
    ethUsdPrice && audUsdPrice
      ? (
          parseFloat(ethUsdPrice.formattedPrice) /
          parseFloat(audUsdPrice.formattedPrice)
        ).toFixed(2)
      : null;

  const ethUsdValue = ethUsdPrice
    ? parseFloat(ethUsdPrice.formattedPrice).toFixed(2)
    : null;

  const isPriceLoading = isLoadingEthUsd || isLoadingAudUsd;

  return (
    <Card>
      <CardHeader className="flex flex-row w-full justify-between">
        <div className="space-y-4">
          {/* Total Value */}
          <div className="flex items-center gap-2 flex-wrap">
            {isLoadingTotal || isLoadingCurrency ? (
              <Skeleton className="h-12 w-64" />
            ) : (
              <>
                <CardTitle className="text-4xl md:text-5xl font-bold">
                  {currency === "AUD"
                    ? `$${totalAud.toFixed(2)}`
                    : `$${totalUsd.toFixed(2)}`}
                </CardTitle>
                <CardTitle className="text-4xl md:text-5xl font-bold text-muted-foreground">
                  {currency === "AUD" ? "AUD" : "USD"}
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg shrink-0"
                      onClick={toggleCurrency}
                    >
                      {currency !== "AUD" ? "🇦🇺" : "🇺🇸"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Change currency</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {defaultNetwork !== 1 ? (
              <Badge variant="outline" className="text-sm bg-green-400">
                testnet
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-sm">
                available
              </Badge>
            )}

            <ShareProfile
              isShareDialogOpen={isShareDialogOpen}
              setIsShareDialogOpen={() =>
                setIsShareDialogOpen(!isShareDialogOpen)
              }
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          {isPriceLoading ? (
            <Skeleton className="h-5 w-64" />
          ) : ethAudValue && ethUsdValue ? (
            <>
              <span className="tabular-nums">
                1 ETH = {ethAudValue} AUD / {ethUsdValue} USD
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-5 w-5 p-0 shrink-0"
                  >
                    <Info className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pricing data provided by Chainlink pricing feeds</p>
                </TooltipContent>
              </Tooltip>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
