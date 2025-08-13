"use client";

import AccountBalance from "@/components/account-balance";
import AccountManager from "@/components/account-manager";
import TransferDialog from "@/components/connected-wallet/dialog";
import DepositModal from "@/components/deposit-modal";
import SendModal from "@/components/send-modal";
import { TokenBalancesTable } from "@/components/token-balances-view";
import { Button } from "@/components/ui/button";

import { WarningBanner } from "@/components/warning-banner";
import { useAuth } from "@/lib/auth-context";
import { WalletIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export default function Account() {
  const { isConnected, address } = useAccount();
  const { isSignedIn, address: authAddress } = useAuth();
  const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setIsAccountManagerOpen(false);
    }
  }, [isConnected]);

  return (
    <div className="flex flex-1 flex-col gap-6 px-6 p-2 pt-12">
      <h1 className="text-3xl text-primary">Account</h1>

      {isSignedIn ? (
        <>
          <WarningBanner />

          {/* Wallets Section */}
          <AccountBalance
            setIsDepositModalOpen={setIsDepositModalOpen}
            setIsSendModalOpen={setIsSendModalOpen}
            setIsAccountManagerOpen={setIsAccountManagerOpen}
            setTransferModalOpen={setTransferModalOpen}
          />

          <div className="flex flex-col">
            <h1 className="text-2xl text-primary">Assets</h1>

            {(address || authAddress) && (
              <TokenBalancesTable walletAddress={address || authAddress!} />
            )}
          </div>

          <DepositModal
            open={isDepositModalOpen}
            onOpenChange={setIsDepositModalOpen}
          />

          <SendModal open={isSendModalOpen} onOpenChange={setIsSendModalOpen} />

          <TransferDialog
            transferModalOpen={transferModalOpen}
            setTransferModalOpen={setTransferModalOpen}
          />
        </>
      ) : (
        <div className="flex flex-1 flex-col gap-4 px-6 p-2 pt-12">
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
            <div className="text-center">
              <h1 className="text-3xl text-primary">Sign In</h1>
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
              Sign In
            </Button>
          </div>
        </div>
      )}

      <AccountManager
        open={isAccountManagerOpen}
        onOpenChange={setIsAccountManagerOpen}
      />
    </div>
  );
}
