import { ActionButtons } from "@/components/account/action-buttons";
import { AddressCard } from "@/components/account/address-card";
import { AssetBreakdown } from "@/components/account/asset-breakdown";
import { BalanceCard } from "@/components/account/balance-card";
import { RecentTransactions } from "@/components/account/recent-transactions";
import { EncryptModal } from "@/components/encrypt/encrypt-modal";
import PageContainer from "@/components/page-container";
import { useAuth } from "@/lib/auth-context";
import { PAGE_METADATA } from "@/lib/seo-config";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const AccountPage = () => {
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(false);
  const [showEncryptModal, setShowEncryptModal] = useState(false);

  const { address, privateAddress, signingKey } = useAuth();

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

  const handleEncryptClick = () => {
    setShowEncryptModal(!showEncryptModal);
  };

  const handleReceiveClick = () => {
    // TODO: Navigate to receive modal/page
    console.log("Open receive modal");
  };

  return (
    <PageContainer {...PAGE_METADATA.account}>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Balance Section */}
        <div className="space-y-4">
          <BalanceCard
            balance={balanceData?.balance || "$0.00"}
            usdValue={balanceData?.usdValue || "USD"}
            isLoading={isLoadingBalance}
            isSwitched={showAssetBreakdown}
            onAssetBreakdownClick={() =>
              setShowAssetBreakdown(!showAssetBreakdown)
            }
          />

          <ActionButtons
            onEncryptClick={handleEncryptClick}
            onReceiveClick={handleReceiveClick}
          />
        </div>

        <EncryptModal
          open={showEncryptModal}
          onOpenChange={setShowEncryptModal}
        />

        {/* Asset Breakdown - conditionally shown */}
        {showAssetBreakdown && <AssetBreakdown />}

        {/* Address Card */}
        <AddressCard
          publicAddress={address}
          privateAddress={privateAddress}
          signingKey={signingKey}
        />

        {/* Recent Transactions */}
        <RecentTransactions />
      </div>
    </PageContainer>
  );
};
