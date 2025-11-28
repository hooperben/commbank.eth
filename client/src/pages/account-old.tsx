import { ActionButtons } from "@/components/account/action-buttons";
import { AddressCard } from "@/components/account/address-card";
import { AssetBreakdown } from "@/components/account/asset-breakdown";
import { RecentTransactions } from "@/components/account/recent-transactions";
import { EncryptModal } from "@/components/encrypt/encrypt-modal";
import PageContainer from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { PAGE_METADATA } from "@/lib/seo-config";
import { useState } from "react";

export const AccountPage = () => {
  const [showAssetBreakdown, setShowAssetBreakdown] = useState(true);
  const [showEncryptModal, setShowEncryptModal] = useState(false);

  const { address, privateAddress, signingKey } = useAuth();

  const handleEncryptClick = () => {
    setShowEncryptModal(!showEncryptModal);
  };

  const handleReceiveClick = () => {
    // TODO: Navigate to receive modal/page
    console.log("Open receive modal");
  };

  return (
    <PageContainer {...PAGE_METADATA.account}>
      <div className="space-y-6">
        {/* Address Card */}
        <AddressCard
          publicAddress={address}
          privateAddress={privateAddress}
          signingKey={signingKey}
        />

        <div className="space-y-4">
          <ActionButtons
            onEncryptClick={handleEncryptClick}
            onReceiveClick={handleReceiveClick}
          />

          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => setShowAssetBreakdown(!showAssetBreakdown)}
          >
            {showAssetBreakdown ? "Hide" : "Show"} Asset Balances
          </Button>
        </div>
        <EncryptModal
          open={showEncryptModal}
          onOpenChange={setShowEncryptModal}
        />
        {/* Asset Breakdown - conditionally shown */}
        {showAssetBreakdown && <AssetBreakdown />}
        {/* Recent Transactions */}
        <RecentTransactions />
      </div>
    </PageContainer>
  );
};
