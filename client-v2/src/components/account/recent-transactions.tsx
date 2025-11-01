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
      <Card className="bg-background border-0 shadow-none">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-md bg-muted/40"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (mockTransactions.length === 0) {
    return (
      <Card className="bg-background border-0 shadow-none">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground text-sm">
            No transactions yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background border-0 shadow-none">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold tracking-tight">
            Recent Transactions
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {mockTransactions.map((tx, index) => (
          <button
            key={index}
            className="w-full flex items-center gap-4 p-4 rounded-md bg-muted/40 hover:bg-muted/60 transition-colors duration-150 text-left border-0"
            onClick={() => {
              // TODO: Open transaction details or block explorer
              console.log("View transaction:", tx.txHash);
            }}
          >
            <div
              className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                tx.type === "receive"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-slate-500/10 text-slate-600"
              }`}
            >
              {tx.type === "receive" ? (
                <ArrowDownToLine className="h-4 w-4" />
              ) : (
                <ArrowUpFromLine className="h-4 w-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground">
                {tx.type === "receive" ? "Received" : "Sent"} {tx.symbol}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {tx.type === "receive" ? `From ${tx.from}` : `To ${tx.to}`}
              </div>
              <div className="text-xs text-muted-foreground">
                {tx.timestamp}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <div className="font-medium text-sm text-foreground">
                {tx.type === "receive" ? "+" : "-"}
                {tx.amount}
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground ml-auto mt-2 opacity-60" />
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
