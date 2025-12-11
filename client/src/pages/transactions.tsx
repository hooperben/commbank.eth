import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionsByChainId } from "@/_hooks/use-transactions";
import { useAuth } from "@/_providers/auth-provider";
import {
  getAssetAddress,
  getAssetAmount,
  getTransactionVerb,
} from "@/lib/transactions";
import { formatUnits } from "ethers/utils";
import { ArrowLeft, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  defaultNetwork,
  defaultNetworkAssetByAddress,
} from "shared/constants/token";

const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
  const { isSignedIn } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch transactions for the default network
  const { data: transactions, isLoading: isLoadingTransactions } =
    useTransactionsByChainId(defaultNetwork);

  // Filter transactions based on search query
  const filteredTransactions = (transactions || [])
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((tx) => {
      if (!searchQuery) return true;

      const query = searchQuery.toLowerCase();
      const asset = defaultNetworkAssetByAddress[getAssetAddress(tx)];

      return (
        tx.transactionHash.toLowerCase().includes(query) ||
        tx.type.toLowerCase().includes(query) ||
        asset?.symbol.toLowerCase().includes(query) ||
        asset?.name.toLowerCase().includes(query)
      );
    });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    endIndex,
  );

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="container text-left py-8 px-4 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/account">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Account
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-2">All Transactions</h1>
        <p className="text-muted-foreground">
          View and search all your transaction history
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-2xl font-bold">Transactions</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by hash, type, or asset..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="space-y-2">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? (
                <>
                  <p>No transactions found matching "{searchQuery}"</p>
                  <Button
                    variant="link"
                    onClick={() => handleSearchChange("")}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                </>
              ) : (
                <>
                  <p>No transactions yet</p>
                  {!isSignedIn && (
                    <p className="text-sm mt-2">Sign in to view transactions</p>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {paginatedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">
                          {getTransactionVerb(tx.type)}
                        </Badge>
                        <h2 className="font-semibold">
                          {defaultNetworkAssetByAddress[getAssetAddress(tx)]
                            ?.symbol ?? "ETH"}
                        </h2>
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
                        <span className="text-sm font-medium">
                          {formatUnits(
                            getAssetAmount(tx),
                            defaultNetworkAssetByAddress[getAssetAddress(tx)]
                              .decimals,
                          )}{" "}
                          {
                            defaultNetworkAssetByAddress[getAssetAddress(tx)]
                              .symbol
                          }
                        </span>
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

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-
                  {Math.min(endIndex, filteredTransactions.length)} of{" "}
                  {filteredTransactions.length} transactions
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first page, last page, current page, and pages around current
                          return (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1
                          );
                        })
                        .map((page, index, array) => {
                          // Add ellipsis when there's a gap
                          const prevPage = array[index - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;

                          return (
                            <div key={page} className="flex items-center">
                              {showEllipsis && (
                                <span className="px-2 text-muted-foreground">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-10"
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
