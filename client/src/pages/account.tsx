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
import { useAuth } from "@/lib/auth-context";
import { PAGE_METADATA } from "@/lib/seo-config";
import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Info,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { defaultNetwork } from "shared/constants/token";
// import { EncryptModal } from "@/components/encrypt/encrypt-modal";

export default function AccountPage() {
  const { isSignedIn } = useAuth();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [showAud, setShowAud] = useState(false);

  // Fetch price data from Chainlink
  const { data: ethUsdPrice, isLoading: isLoadingEthUsd } = useEthUsdPrice();
  const { data: audUsdPrice, isLoading: isLoadingAudUsd } = useAudUsdPrice();

  // Calculate total account value
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

  const recentTransactions = [
    // Will be populated later
  ];

  return (
    <PageContainer {...PAGE_METADATA.account}>
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        {/* Balance Card */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              {/* Total Value */}
              <div className="flex items-center gap-2">
                {isLoadingTotal ? (
                  <Skeleton className="h-12 w-64" />
                ) : (
                  <>
                    <CardTitle className="text-4xl font-bold">
                      {showAud
                        ? `$${totalAud.toFixed(2)} AUD`
                        : `$${totalUsd.toFixed(2)} USD`}
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setShowAud(!showAud)}
                        >
                          <DollarSign className="h-3 w-3" />
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
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No recent transactions</p>
                {!isSignedIn && (
                  <p className="text-sm mt-2">Sign in to view transactions</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {/* Transaction items will be added here later */}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
