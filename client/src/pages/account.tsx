import { ShareProfile } from "@/components/account/share-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";

export default function AccountPage() {
  const { isSignedIn } = useAuth();
  const [showPrivateBalances, setShowPrivateBalances] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  // Mock data - will be replaced with real hooks later
  const totalAvailable = 120.33;
  const accounts = [
    {
      symbol: "AUDD",
      public: 50,
      private: 50,
      total: 100,
    },
    {
      symbol: "ETH",
      public: 0.003,
      private: 0,
      total: 0.0008,
    },
  ];

  const recentTransactions = [
    // Will be populated later
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Balance Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-4xl font-bold">
              ${totalAvailable.toFixed(2)}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                available
              </Badge>
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
          <div className="flex gap-2 text-sm text-muted-foreground">
            <div>100 AUDD</div>
            <Separator orientation="vertical" className="h-4" />
            <div>0.003 ETH</div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="grid grid-cols-3 gap-4">
        <Button
          variant="outline"
          className="h-16 text-lg font-semibold"
          disabled={!isSignedIn}
        >
          <Users className="mr-2 h-5 w-5" />
          CONTACTS
        </Button>
        <Button
          variant="outline"
          className="h-16 text-lg font-semibold"
          disabled={!isSignedIn}
        >
          <ArrowUpRight className="mr-2 h-5 w-5" />
          SEND
        </Button>
        <Button
          variant="outline"
          className="h-16 text-lg font-semibold"
          disabled={!isSignedIn}
        >
          <ArrowDownLeft className="mr-2 h-5 w-5" />
          RECEIVE
        </Button>
      </div>

      {/* Accounts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">ACCOUNTS</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPrivateBalances(!showPrivateBalances)}
            >
              {showPrivateBalances ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Asset</th>
                  <th className="text-center p-3 font-semibold">Public</th>
                  <th className="text-center p-3 font-semibold">Private</th>
                  <th className="text-right p-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.symbol}
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-3 font-semibold">{account.symbol}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span>{account.public}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Wallet className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span>
                          {showPrivateBalances ? account.private : "***"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <Wallet className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {account.total} {account.symbol}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            RECENT TRANSACTIONS
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
  );
}
