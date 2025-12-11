import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { Skeleton } from "@/_components/ui/skeleton";
import { useTransactionsByChainId } from "@/_hooks/use-transactions";
import { useAuth } from "@/_providers/auth-provider";
import {
  getAssetAddress,
  getAssetAmount,
  getTransactionVerb,
} from "@/lib/formatting/transactions";
import { formatUnits } from "ethers/utils";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  defaultNetwork,
  defaultNetworkAssetByAddress,
} from "shared/constants/token";

export const Transactions = () => {
  const { isSignedIn } = useAuth();

  // Fetch transactions for the default network
  const { data: transactions, isLoading: isLoadingTransactions } =
    useTransactionsByChainId(defaultNetwork);

  // Get the 5 most recent transactions, sorted by timestamp
  const recentTransactions = (transactions || [])
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <Card className="text-left">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold">
            Recent Transactions
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/transactions">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
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
                className="flex items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-accent transition-colors gap-3 max-w-full"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="shrink-0">
                      {getTransactionVerb(tx.type)}
                    </Badge>
                    <h2 className="font-medium">
                      {defaultNetworkAssetByAddress[getAssetAddress(tx)]
                        ?.symbol ?? "ETH"}
                    </h2>
                    <span className="hidden md:inline text-sm font-mono text-muted-foreground">
                      {tx.transactionHash.slice(0, 10)}...
                      {tx.transactionHash.slice(-8)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(tx.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {tx.value && Number(tx.value) > 0 && (
                    <span className="text-sm font-medium tabular-nums">
                      {(parseFloat(tx.value) / 1e18).toFixed(4)} ETH
                    </span>
                  )}

                  {tx.type === "Deposit" && !tx.value && (
                    <span className="text-sm font-medium tabular-nums">
                      {formatUnits(
                        getAssetAmount(tx),
                        defaultNetworkAssetByAddress[getAssetAddress(tx)]
                          .decimals,
                      )}{" "}
                      {defaultNetworkAssetByAddress[getAssetAddress(tx)].symbol}
                    </span>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="shrink-0"
                  >
                    <a
                      href={`https://${defaultNetwork !== 1 && "sepolia."}etherscan.io/tx/${tx.transactionHash}`}
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
  );
};
