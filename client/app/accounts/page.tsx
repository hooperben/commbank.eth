"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Helper function to shorten address
const shortenAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Helper function to generate MD5 hash for Gravatar
const generateMD5 = (input: string) => {
  // This is a simple mock implementation since we can't use crypto in the browser directly
  // In a real app, you would use a proper MD5 library
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex string and ensure it's 32 chars
  const hexHash = Math.abs(hash).toString(16).padStart(32, "0");
  return hexHash;
};

// Mock wallet data
const wallet = {
  id: "wallet-2",
  address: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
  name: "Savings",
  balance: 12500,
  token: "USDC",
};

// Mock transaction data
const generateTransactions = (walletAddress: string) => {
  const transactions = [];
  const now = new Date();

  // Generate some receiving transactions
  for (let i = 0; i < 15; i++) {
    const randomAddress = `0x${Math.random()
      .toString(16)
      .slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    const amount = Number.parseFloat((Math.random() * 0.5).toFixed(4));
    const date = new Date(
      now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    );
  }

  // Generate some sending transactions
  for (let i = 0; i < 10; i++) {
    const randomAddress = `0x${Math.random()
      .toString(16)
      .slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    const amount = Number.parseFloat((Math.random() * 0.3).toFixed(4));
    const date = new Date(
      now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000,
    );
  }

  // Sort by date (newest first)
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export default function AccountsPage() {
  const [activeWallet, setActiveWallet] = useState(wallet);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    // Generate transactions for the active wallet
    const txs = generateTransactions(activeWallet.address);
    setTransactions(txs);
    setFilteredTransactions(txs);
  }, [activeWallet]);

  useEffect(() => {
    // Filter transactions based on search query and active tab
    let filtered = transactions;

    if (searchQuery) {
      filtered = filtered.filter(
        (tx) =>
          tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tx.to.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    if (activeTab !== "all") {
      filtered = filtered.filter((tx) => tx.type === activeTab);
    }

    setFilteredTransactions(filtered);
  }, [searchQuery, transactions, activeTab]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6">
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold">My Account</h1>

          <div className="flex flex-row w-full gap-2">
            <Avatar className="flex justify-center h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={gravatarUrl} alt={activeWallet.name} />
              <AvatarFallback>{activeWallet.name.slice(0, 2)}</AvatarFallback>
            </Avatar>

            <div className="flex flex-row w-full justify-between gap-4 items-end">
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  {activeWallet.name}
                </h1>
                <div className="flex items-center mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {shortenAddress(activeWallet.address)}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-1"
                    onClick={() => copyToClipboard(activeWallet.address)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-sm text-muted-foreground">Balance</span>
                <span className="text-3xl font-bold">
                  {activeWallet.balance} {activeWallet.token}
                </span>
              </div>
            </div>
          </div>

          <Card className="h-fit">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <h3 className="text-lg font-semibold">Recent Transactions</h3>
                  <div className="flex items-center w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by address or hash"
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Tabs
                  defaultValue="all"
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="receive">Received</TabsTrigger>
                    <TabsTrigger value="send">Sent</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="mt-1">
                    <TransactionList transactions={filteredTransactions} />
                  </TabsContent>
                  <TabsContent value="receive" className="mt-1">
                    <TransactionList transactions={filteredTransactions} />
                  </TabsContent>
                  <TabsContent value="send" className="mt-1">
                    <TransactionList transactions={filteredTransactions} />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function TransactionList({ transactions }: { transactions: any[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="h-fit overflow-y-auto">
        <table className="w-full">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                Type
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                Address
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                Amount
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                Time
              </th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground hidden lg:table-cell">
                Hash
              </th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-muted/30">
                <td className="p-3">
                  <div className="flex items-center">
                    {tx.type === "receive" ? (
                      <div className="bg-green-500/10 p-1.5 rounded-full text-green-500">
                        <ArrowDownLeft className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="bg-blue-500/10 p-1.5 rounded-full text-blue-500">
                        <ArrowUpRight className="h-4 w-4" />
                      </div>
                    )}
                    <span className="ml-2 text-xs font-medium capitalize">
                      {tx.type === "receive" ? "Received" : "Sent"}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center">
                    <code className="text-xs font-mono">
                      {tx.type === "receive" ? tx.from : tx.to}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
                <td className="p-3">
                  <span
                    className={`font-medium ${
                      tx.type === "receive" ? "text-green-500" : ""
                    }`}
                  >
                    {tx.type === "receive" ? "+" : "-"}
                    {tx.amount} {tx.token}
                  </span>
                </td>
                <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">
                  {formatDistanceToNow(tx.date, { addSuffix: true })}
                </td>
                <td className="p-3 hidden lg:table-cell">
                  <div className="flex items-center">
                    <code className="text-xs font-mono">{tx.hash}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
                <td className="p-3 text-right">
                  <Badge
                    variant={
                      tx.status === "confirmed" ? "outline" : "secondary"
                    }
                  >
                    {tx.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
