import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { Skeleton } from "@/_components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/_components/ui/tooltip";
import { useAccountTotal } from "@/_hooks/use-account-total";
import { useAudUsdPrice, useEthUsdPrice } from "@/_hooks/use-chainlink-price";
import { usePreferredCurrency } from "@/_hooks/use-preferred-currency";
import { formatDollarAmount } from "@/lib/formatting/data-formatting";

export const BalanceCard = () => {
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
      ? formatDollarAmount(
          parseFloat(ethUsdPrice.formattedPrice) /
            parseFloat(audUsdPrice.formattedPrice),
        )
      : null;

  const ethUsdValue = ethUsdPrice
    ? formatDollarAmount(parseFloat(ethUsdPrice.formattedPrice))
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
                    ? `$${formatDollarAmount(totalAud)}`
                    : `$${formatDollarAmount(totalUsd)}`}
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
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          {isPriceLoading ? (
            <Skeleton className="h-5 w-64" />
          ) : ethAudValue && ethUsdValue ? (
            <>
              <span className="tabular-nums text-xs">
                1 ETH = {ethAudValue} AUD / {ethUsdValue} USD
              </span>
              {/* Desktop: tooltip on hover */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="shrink-0 hidden md:inline">
                    <img
                      src="/link-logo.png"
                      alt="Chainlink"
                      className="h-4 w-4"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pricing data provided by Chainlink pricing feeds</p>
                </TooltipContent>
              </Tooltip>
              {/* Mobile: inline text */}
              <span className="flex items-center gap-1 text-[11px] md:hidden">
                <img src="/link-logo.png" alt="Chainlink" className="h-3 w-3" />
                prices provided by ChainLink
              </span>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
