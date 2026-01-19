import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/_components/ui/select";
import { Skeleton } from "@/_components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/_components/ui/tooltip";
import { useAccountTotal } from "@/_hooks/use-account-total";
import { useAudUsdPrice, useEthUsdPrice } from "@/_hooks/use-chainlink-price";
import {
  usePreferredCurrency,
  type Currency,
} from "@/_hooks/use-preferred-currency";
import { formatDollarAmount } from "@/lib/formatting/data-formatting";
import { BadgeDollarSign } from "lucide-react";
import { SyncState } from "./sync-state";

export const BalanceCard = () => {
  // Fetch price data from Chainlink
  const { data: ethUsdPrice, isLoading: isLoadingEthUsd } = useEthUsdPrice();
  const { data: audUsdPrice, isLoading: isLoadingAudUsd } = useAudUsdPrice();

  const {
    currency,
    setCurrency,
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
        <div>
          {/* Total Value */}
          <div className="flex items-center gap-1 flex-wrap">
            {isLoadingTotal || isLoadingCurrency ? (
              <Skeleton className="h-10 w-52" />
            ) : (
              <div className="flex flex-row gap-1 items-center">
                <CardTitle className="text-4xl md:text-5xl font-bold">
                  {currency === "AUD"
                    ? `$${formatDollarAmount(totalAud)}`
                    : `$${formatDollarAmount(totalUsd)}`}
                </CardTitle>
                <span className="text-4xl md:text-5xl font-bold text-muted-foreground">
                  {currency}
                </span>
                <Select
                  value={currency}
                  onValueChange={(value: Currency) => setCurrency(value)}
                >
                  <SelectTrigger className="p-2 h-8 w-8 border-0 bg-transparent shadow-none hover:bg-transparent focus:ring-0 dark:bg-transparent dark:hover:bg-transparent [&>svg:last-child]:hidden flex items-center justify-center">
                    <BadgeDollarSign className="h-5 w-5 text-muted-foreground" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        {/* TODO readd */}
        <div className="flex-row gap-1 items-center hidden">
          <SyncState />
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
                prices provided by Chainlink
              </span>
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};
