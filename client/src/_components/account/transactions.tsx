import { TransactionAccordionItem } from "@/_components/account/transaction-accordion-item";
import { Accordion } from "@/_components/ui/accordion";
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
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { defaultNetwork } from "shared/constants/token";

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
          <div className="text-center py-4 text-muted-foreground">
            <p>No recent transactions</p>
            {!isSignedIn && (
              <p className="text-sm mt-2">Sign in to view transactions</p>
            )}
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {recentTransactions.map((tx) => (
              <TransactionAccordionItem key={tx.id} transaction={tx} />
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};
