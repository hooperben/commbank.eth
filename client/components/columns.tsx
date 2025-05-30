"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { TokenBalance } from "./token-balances-view";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export const columns: ColumnDef<TokenBalance>[] = [
  {
    accessorKey: "chainName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Network
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const chainId = row.original.chainId;
      const chainName = row.getValue("chainName") as string;

      return (
        <div className="flex items-center gap-2">
          <Badge variant="outline">{chainId}</Badge>
          <span>{chainName}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Token
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.symbol}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "formattedBalance",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="justify-end"
        >
          Balance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("formattedBalance"));
      const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "address",
    header: "Contract",
    cell: ({ row }) => {
      const address = row.original.address;
      const chainId = row.original.chainId;

      // Get block explorer URL based on chain ID
      const getExplorerUrl = (chainId: number, address: string) => {
        const explorers: Record<number, string> = {
          1: "https://etherscan.io",
          10: "https://optimistic.etherscan.io",
          137: "https://polygonscan.com",
          8453: "https://basescan.org",
          42161: "https://arbiscan.io",
        };

        const baseUrl = explorers[chainId] || "https://etherscan.io";
        return `${baseUrl}/token/${address}`;
      };

      const explorerUrl = getExplorerUrl(chainId, address);
      const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

      return (
        <div className="flex items-center justify-end">
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {truncatedAddress}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      );
    },
  },
];
