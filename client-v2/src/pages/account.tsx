import PageContainer from "@/components/page-container";
import { PAGE_METADATA } from "@/lib/seo-config";
import { BalanceCard } from "@/components/account/balance-card";
import { ActionButtons } from "@/components/account/action-buttons";
import { AssetBreakdown } from "@/components/account/asset-breakdown";
import { RecentTransactions } from "@/components/account/recent-transactions";
import { SendModal } from "@/components/send/send-modal";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const AccountPage = () => {
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

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
    setIsSendModalOpen(true);
  };

  const handleReceiveClick = () => {
    // TODO: Navigate to receive modal/page
    console.log("Open receive modal");
  };

  const handleAssetBreakdownClick = () => {
    setShowAssetBreakdown(!showAssetBreakdown);
  };

  return (
    <PageContainer {...PAGE_METADATA.account}>
      <div className="space-y-6 max-w-2xl mx-auto">
        <BalanceCard
          balance={balanceData?.balance || "$0.00"}
          usdValue={balanceData?.usdValue || "USD"}
          isLoading={isLoadingBalance}
          onAssetBreakdownClick={handleAssetBreakdownClick}
        />

        <ActionButtons
          onSendClick={handleSendClick}
          onReceiveClick={handleReceiveClick}
        />

        {showAssetBreakdown && <AssetBreakdown />}

        <RecentTransactions />

        <SendModal open={isSendModalOpen} onOpenChange={setIsSendModalOpen} />
      </div>
    </PageContainer>
  );
};
