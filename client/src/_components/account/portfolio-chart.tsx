import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/_components/ui/chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/_components/ui/tooltip";
import { useAccountTotal } from "@/_hooks/use-account-total";
import { usePreferredCurrency } from "@/_hooks/use-preferred-currency";
import { useAudUsdPrice, useEthUsdPrice } from "@/_hooks/use-chainlink-price";
import { useERC20Balances } from "@/_hooks/use-erc20-balance";
import { DEFAULT_ASSETS } from "shared/constants/token";
import { ethers } from "ethers";
import { Skeleton } from "@/_components/ui/skeleton";
import { formatCompactCurrency } from "@/lib/formatting/currency-formatting";

const chartConfig = {
  value: {
    label: "Value",
  },
  USDC: {
    label: "USDC",
    color: "var(--chart-1)",
  },
  AUDD: {
    label: "AUDD",
    color: "var(--chart-2)",
  },
  ETH: {
    label: "ETH",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function PortfolioChart() {
  const { totalUsd, isLoading: isLoadingTotal } = useAccountTotal();
  const { currency } = usePreferredCurrency();
  const { data: ethUsdPrice } = useEthUsdPrice();
  const { data: audUsdPrice } = useAudUsdPrice();
  const { data: assetBalances, isLoading: isLoadingAssets } =
    useERC20Balances(DEFAULT_ASSETS);

  // Calculate asset values in USD for the chart
  const chartData = React.useMemo(() => {
    if (!ethUsdPrice || !audUsdPrice || !assetBalances) return [];

    return assetBalances
      .map((asset) => {
        if (!asset.balance) return null;

        const balanceFormatted = parseFloat(
          ethers.formatUnits(asset.balance, asset.decimals),
        );

        let valueUsd = 0;

        if (asset.symbol === "ETH") {
          valueUsd = balanceFormatted * parseFloat(ethUsdPrice.formattedPrice);
        } else if (asset.symbol === "AUDD") {
          valueUsd = balanceFormatted * parseFloat(audUsdPrice.formattedPrice);
        } else if (asset.symbol === "USDC") {
          valueUsd = balanceFormatted;
        }

        return {
          asset: asset.symbol,
          value: valueUsd,
          fill: `var(--color-${asset.symbol})`,
        };
      })
      .filter(Boolean);
  }, [ethUsdPrice, audUsdPrice, assetBalances]);

  // Calculate total in preferred currency
  const totalAud =
    audUsdPrice && totalUsd
      ? totalUsd / parseFloat(audUsdPrice.formattedPrice)
      : 0;

  const displayTotal = currency === "AUD" ? totalAud : totalUsd;
  const { formatted, full } = formatCompactCurrency(displayTotal);

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      {isLoadingTotal || isLoadingAssets ? (
        <div className="w-full flex justify-center mt-4">
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      ) : (
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="asset"
            innerRadius={60}
            strokeWidth={5}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      {formatted === full ? (
                        <>
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-xl font-bold"
                          >
                            {formatted}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            {currency}
                          </tspan>
                        </>
                      ) : (
                        <>
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-xl font-bold"
                          >
                            {formatted}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground text-sm"
                          >
                            {currency}
                          </tspan>
                        </>
                      )}
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      )}
    </ChartContainer>
  );
}

const legendColors: Record<string, string> = {
  USDC: "var(--chart-1)",
  AUDD: "var(--chart-2)",
  ETH: "var(--chart-3)",
};

function PortfolioLegend() {
  const { currency } = usePreferredCurrency();
  const { data: ethUsdPrice } = useEthUsdPrice();
  const { data: audUsdPrice } = useAudUsdPrice();
  const { data: assetBalances, isLoading } = useERC20Balances(DEFAULT_ASSETS);

  const legendData = React.useMemo(() => {
    if (!ethUsdPrice || !audUsdPrice || !assetBalances) return [];

    return assetBalances
      .map((asset) => {
        if (!asset.balance) return null;

        const balanceFormatted = parseFloat(
          ethers.formatUnits(asset.balance, asset.decimals),
        );

        let valueUsd = 0;

        if (asset.symbol === "ETH") {
          valueUsd = balanceFormatted * parseFloat(ethUsdPrice.formattedPrice);
        } else if (asset.symbol === "AUDD") {
          valueUsd = balanceFormatted * parseFloat(audUsdPrice.formattedPrice);
        } else if (asset.symbol === "USDC") {
          valueUsd = balanceFormatted;
        }

        // Convert to preferred currency
        const displayValue =
          currency === "AUD"
            ? valueUsd / parseFloat(audUsdPrice.formattedPrice)
            : valueUsd;

        return {
          symbol: asset.symbol,
          value: displayValue,
          color: legendColors[asset.symbol] || "var(--chart-1)",
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.value ?? 0) - (a?.value ?? 0));
  }, [ethUsdPrice, audUsdPrice, assetBalances, currency]);

  if (isLoading) {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-6 w-24" />
        ))}
      </div>
    );
  }

  const currencySymbol = currency === "AUD" ? "A$" : "$";

  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
      {legendData.map((item) => (
        <div key={item?.symbol} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: item?.color }}
          />
          <span className="text-sm font-medium">{item?.symbol}</span>
          <span className="text-sm text-muted-foreground">
            {currencySymbol}
            {item?.value?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PortfolioChartWithTooltip() {
  const { totalUsd, isLoading: isLoadingTotal } = useAccountTotal();
  const { currency } = usePreferredCurrency();
  const { data: audUsdPrice } = useAudUsdPrice();

  const totalAud =
    audUsdPrice && totalUsd
      ? totalUsd / parseFloat(audUsdPrice.formattedPrice)
      : 0;

  const displayTotal = currency === "AUD" ? totalAud : totalUsd;
  const { formatted, full } = formatCompactCurrency(displayTotal);

  // If the value is large enough to be compacted, show tooltip
  if (formatted !== full && !isLoadingTotal) {
    return (
      <div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              <PortfolioChart />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{full}</p>
          </TooltipContent>
        </Tooltip>
        <PortfolioLegend />
      </div>
    );
  }

  return (
    <div>
      <PortfolioChart />
      <PortfolioLegend />
    </div>
  );
}
