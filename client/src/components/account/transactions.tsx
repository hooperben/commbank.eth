import type { Transaction } from "@/_types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionsByChainId } from "@/hooks/use-transactions";
import { useAuth } from "@/lib/auth-context";
import { formatEther, formatUnits } from "ethers/utils";
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

  const getAssetAddress = (transaction: Transaction) => {
    if (transaction.type === "Deposit") {
      const asset =
        `0x${transaction.data?.substring(34, 74)?.toLowerCase()}`.toLowerCase();
      return asset;
    }
    return transaction.to.toLowerCase();
  };

  const getAssetAmount = (transaction: Transaction) => {
    if (transaction.type === "Deposit") {
      const amount = `0x${transaction.data?.substring(74, 138)}`;

      console.log(BigInt(amount));
      return BigInt(amount);
    }
    return 0n;
  };

  return (
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
                    <h2>
                      {
                        defaultNetworkAssetByAddress[getAssetAddress(tx)]
                          ?.symbol
                      }
                    </h2>
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
                  {tx.value && Number(tx.value) > 0 && (
                    <span className="text-sm font-medium">
                      {(parseFloat(tx.value) / 1e18).toFixed(4)} ETH
                    </span>
                  )}

                  {tx.type === "Deposit" && !tx.value && (
                    <>
                      {formatUnits(
                        getAssetAmount(tx),
                        defaultNetworkAssetByAddress[getAssetAddress(tx)]
                          .decimals,
                      )}{" "}
                      {defaultNetworkAssetByAddress[getAssetAddress(tx)].symbol}
                    </>
                  )}

                  <Button variant="ghost" size="sm" asChild>
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
