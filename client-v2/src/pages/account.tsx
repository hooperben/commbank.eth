import { ActionButtons } from "@/components/account/action-buttons";
import { AssetBreakdown } from "@/components/account/asset-breakdown";
import { BalanceCard } from "@/components/account/balance-card";
import { RecentTransactions } from "@/components/account/recent-transactions";
import PageContainer from "@/components/page-container";
import { useAuth } from "@/lib/auth-context";
import { PAGE_METADATA } from "@/lib/seo-config";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const AccountPage = () => {
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const { address, privateAddress } = useAuth();

  // TODO: Replace with real balance query from blockchain
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ["account-balance"],
    queryFn: async () => {
      // Fake API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        balance: "$0.00",
        usdValue: "USD",
      };
    },
  });

  const handleSendClick = () => {
    setIsSendModalOpen(!isSendModalOpen);
    console.log("handle encrypt", isSendModalOpen);
  };

  const handleReceiveClick = () => {
    // TODO: Navigate to receive modal/page
    console.log("Open receive modal");
  };

  return (
    <PageContainer {...PAGE_METADATA.account}>
      <div className="space-y-1 max-w-2xl mx-auto">
        <BalanceCard
          balance={balanceData?.balance || "$0.00"}
          usdValue={balanceData?.usdValue || "USD"}
          isLoading={isLoadingBalance}
          isSwitched={showAssetBreakdown}
          onAssetBreakdownClick={() =>
            setShowAssetBreakdown(!showAssetBreakdown)
          }
        />

        {address && <div>Public Address: {address}</div>}
        {privateAddress && (
          <div>Private Address: 0x{BigInt(privateAddress).toString(16)}</div>
        )}

        <ActionButtons
          onSendClick={handleSendClick}
          onReceiveClick={handleReceiveClick}
        />

        {showAssetBreakdown && <AssetBreakdown />}

        <RecentTransactions />
      </div>
    </PageContainer>
  );
};
