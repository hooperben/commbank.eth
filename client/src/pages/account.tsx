import { AssetBreakdown } from "@/components/account/asset-breakdown";
import { ShareProfile } from "@/components/account/share-profile";
import PageContainer from "@/components/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAccountTotal } from "@/hooks/use-account-total";
import { useAudUsdPrice, useEthUsdPrice } from "@/hooks/use-chainlink-price";
import { usePreferredCurrency } from "@/hooks/use-preferred-currency";
import { useTransactionsByChainId } from "@/hooks/use-transactions";
import { useAuth } from "@/lib/auth-context";
import { PAGE_METADATA } from "@/lib/seo-config";
import { ArrowDownLeft, ArrowUpRight, Info, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  defaultNetwork,
  mainnetAssets,
  sepoliaAssets,
  type SupportedAsset,
} from "shared/constants/token";
// import { EncryptModal } from "@/components/encrypt/encrypt-modal";

export default function AccountPage() {
  const { isSignedIn } = useAuth();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const {
    currency,
    toggleCurrency,
    isLoading: isLoadingCurrency,
  } = usePreferredCurrency();

  // Fetch price data from Chainlink
  const { data: ethUsdPrice, isLoading: isLoadingEthUsd } = useEthUsdPrice();
  const { data: audUsdPrice, isLoading: isLoadingAudUsd } = useAudUsdPrice();

  // Calculate total account value
  const { totalUsd, isLoading: isLoadingTotal } = useAccountTotal();

  const assets: SupportedAsset[] =
    defaultNetwork === 1 ? mainnetAssets : sepoliaAssets;

  // Create mapping by address for quick access: assetByAddress[address]
  const assetByAddress: Record<string, SupportedAsset> = {};
  for (const asset of assets) {
    assetByAddress[asset.address] = asset;
  }

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

  // Fetch transactions for the default network
  const { data: transactions, isLoading: isLoadingTransactions } =
    useTransactionsByChainId(defaultNetwork);

  // Get the 5 most recent transactions, sorted by timestamp
  const recentTransactions = (transactions || [])
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <PageContainer {...PAGE_METADATA.account}>
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        {/* Balance Card */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              {/* Total Value */}
              <div className="flex items-center gap-2">
                {isLoadingTotal || isLoadingCurrency ? (
                  <Skeleton className="h-12 w-64" />
                ) : (
                  <>
                    <CardTitle className="text-4xl font-bold">
                      {currency === "AUD"
                        ? `$${totalAud.toFixed(2)} AUD`
                        : `$${totalUsd.toFixed(2)} USD`}
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg"
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
              <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isPriceLoading ? (
                <Skeleton className="h-12 w-64" />
              ) : ethAudValue && ethUsdValue ? (
                <>
                  <span>
                    1 ETH = {ethAudValue} AUD / {ethUsdValue} USD
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-5 w-5 p-0"
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

        {/* Navigation Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-16 text-lg font-semibold flex-col gap-1"
            disabled={!isSignedIn}
            asChild
          >
            <Link to="/contacts">
              <Users className="h-5 w-5" />
              <span className="text-sm">contacts</span>
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-16 text-lg font-semibold flex-col gap-1"
            disabled
          >
            <ArrowUpRight className="h-5 w-5" />
            <span className="text-sm">send</span>
          </Button>
          <Button
            variant="outline"
            className="h-16 text-lg font-semibold flex-col gap-1"
            disabled
          >
            <ArrowDownLeft className="h-5 w-5" />
            <span className="text-sm">receive</span>
          </Button>
        </div>

        {/* Accounts Section */}
        <AssetBreakdown />

        {/* Recent Transactions */}
        <Card className="text-left">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTransactions ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No recent transactions</p>
                {!isSignedIn && (
                  <p className="text-sm mt-2">Sign in to view transactions</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h2>{assetByAddress[tx.to]?.symbol}</h2>
                        <Badge variant="outline">{tx.type}</Badge>
                        <span className="text-sm font-mono text-muted-foreground">
                          {tx.transactionHash.slice(0, 10)}...
                          {tx.transactionHash.slice(-8)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tx.value && (
                        <span className="text-sm font-medium">
                          {(parseFloat(tx.value) / 1e18).toFixed(4)} ETH
                        </span>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${tx.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs"
                        >
                          View →
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
