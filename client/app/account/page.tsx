"use client";

import AccountManager from "@/components/account-manager";
import { TokenBalancesTable } from "@/components/token-balances-view";
import { Button } from "@/components/ui/button";
import { QrCodeIcon, SendIcon, WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function Account() {
  const { isConnected, address } = useAccount();
  const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);
  const isUp = false;

  useEffect(() => {
    if (isConnected) {
      setIsAccountManagerOpen(false);
    }
  }, [isConnected]);

  // If not connected, show connect wallet button
  if (!isConnected) {
    return (
      <div className="flex flex-1 flex-col gap-4 px-6 p-2 pt-0">
        <h1 className="text-3xl text-primary">Account</h1>

        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div className="text-center">
            <h2 className="text-xl mb-2">Sign In</h2>
            <p className="text-gray-600 mb-6">
              Sign in to view your account and manage your assets.
            </p>
          </div>

          <Button
            onClick={() => setIsAccountManagerOpen(true)}
            className="flex items-center gap-2"
            size="lg"
          >
            <WalletIcon className="w-4 h-4" />
            Login/Sign Up
          </Button>
        </div>

        <AccountManager
          open={isAccountManagerOpen}
          onOpenChange={setIsAccountManagerOpen}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-6 p-2 pt-0">
      <h1 className="text-3xl text-primary">Account</h1>

      <div className="flex flex-row w-full justify-between items-center">
        {/* PORTFOLIO TOTAL */}
        <div className="flex flex-row gap-1 items-baseline">
          <h1 className="text-4xl">$0.00</h1>
          <p className={`text-xs ${isUp ? "text-green-400" : "text-red-400"}`}>
            {isUp ? "+" : "-"}$0
          </p>
          <p className="text-xs text-gray-500">(24h)</p>
        </div>

        {/* DEPOSIT, SEND */}
        <div className="flex flex-row gap-2 ">
          <Button className="flex flex-col h-16 text-sm w-20 text-gray-700">
            <QrCodeIcon />
            Deposit
          </Button>
          <Button className="flex flex-col h-16 text-sm w-20 text-gray-700">
            <SendIcon />
            Send
          </Button>
        </div>
      </div>

      <div className="flex flex-col">
        <h1 className="text-2xl text-primary">Assets</h1>

        {address && <TokenBalancesTable walletAddress={address} />}
      </div>

      <AccountManager
        open={isAccountManagerOpen}
        onOpenChange={setIsAccountManagerOpen}
      />
    </div>
  );
}
