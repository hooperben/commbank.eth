import { TransactionAccordionItem } from "@/_components/account/transaction-accordion-item";
import { Accordion } from "@/_components/ui/accordion";
import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import { Skeleton } from "@/_components/ui/skeleton";
import { PAGE_METADATA } from "@/_constants/seo-config";
import { useTransactionsByChainId } from "@/_hooks/use-transactions";
import { useAuth } from "@/_providers/auth-provider";
import PageContainer from "@/_providers/page-container";
import { getAssetAddress } from "@/lib/formatting/transactions";
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
        tx.transactionHash?.toLowerCase().includes(query) ||
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
    <PageContainer
      {...PAGE_METADATA.transactions}
      description="View your commbank.eth transactions."
    >
      <div className="container mx-auto max-w-6xl space-y-6 text-left">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/account">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Account
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2">
                <CardTitle className="text-2xl font-bold">
                  Transactions
                </CardTitle>
                <CardDescription>
                  <p className="text-muted-foreground">
                    View and search all your transaction history
                  </p>
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-80 mt-4 lg:mt-2">
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
                      <p className="text-sm mt-2">
                        Sign in to view transactions
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : (
              <>
                <Accordion type="single" collapsible className="w-full">
                  {paginatedTransactions.map((tx) => (
                    <TransactionAccordionItem key={tx.id} transaction={tx} />
                  ))}
                </Accordion>

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
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
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
                            const showEllipsis =
                              prevPage && page - prevPage > 1;

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
    </PageContainer>
  );
}
