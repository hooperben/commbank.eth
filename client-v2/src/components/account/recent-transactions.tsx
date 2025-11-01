import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownToLine, ArrowUpFromLine, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";

interface Transaction {
  type: "send" | "receive";
  amount: string;
  symbol: string;
  to?: string;
  from?: string;
  timestamp: string;
  txHash: string;
  chainName: string;
}

interface RecentTransactionsProps {
  transactions?: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fake loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // TODO: Replace with real transaction data from blockchain
  const mockTransactions: Transaction[] = transactions || [
    {
      type: "receive",
      amount: "5.00",
      symbol: "USDC",
      from: "0x742d...4c92",
      timestamp: "2 hours ago",
      txHash: "0x1234567890abcdef",
      chainName: "Base",
    },
    {
      type: "send",
      amount: "2.50",
      symbol: "AUDD",
      to: "0x8a3b...2e1f",
      timestamp: "1 day ago",
      txHash: "0xabcdef1234567890",
      chainName: "Ethereum",
    },
  ];

  if (isLoading) {
    return (
      <Card className="backdrop-blur-xl bg-background/40 border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-lg border border-border/30"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (mockTransactions.length === 0) {
    return (
      <Card className="backdrop-blur-xl bg-background/40 border-border/50">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No transactions yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="backdrop-blur-xl bg-background/40 border-border/50">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockTransactions.map((tx, index) => (
          <button
            key={index}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-border/30 hover:border-border/60 hover:bg-background/60 transition-all text-left"
            onClick={() => {
              // TODO: Open transaction details or block explorer
              console.log("View transaction:", tx.txHash);
            }}
          >
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center ${
                tx.type === "receive"
                  ? "bg-green-500/20 text-green-500"
                  : "bg-blue-500/20 text-blue-500"
              }`}
            >
              {tx.type === "receive" ? (
                <ArrowDownToLine className="h-5 w-5" />
              ) : (
                <ArrowUpFromLine className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1">
              <div className="font-semibold">
                {tx.type === "receive" ? "Received" : "Sent"} {tx.symbol}
              </div>
              <div className="text-sm text-muted-foreground">
                {tx.type === "receive" ? `From ${tx.from}` : `To ${tx.to}`} •{" "}
                {tx.chainName}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {tx.timestamp}
              </div>
            </div>

            <div className="text-right">
              <div className="font-semibold">
                {tx.type === "receive" ? "+" : "-"}
                {tx.amount}
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto mt-1" />
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
