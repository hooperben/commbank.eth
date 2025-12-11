import { AccountNavigation } from "@/_components/account/account-navigation";
import { AssetBreakdown } from "@/_components/account/asset-breakdown";
import { BalanceCard } from "@/_components/account/balance-card";
import { Transactions } from "@/_components/account/transactions";
import PageContainer from "@/_providers/page-container";
import { PAGE_METADATA } from "@/_constants/seo-config";

export default function AccountPage() {
  return (
    <PageContainer {...PAGE_METADATA.account}>
      <div className="container max-w-4xl space-y-6">
        {/* Balance Card */}
        <BalanceCard />

        {/* Navigation Buttons */}
        <AccountNavigation />

        {/* Accounts Section */}
        <AssetBreakdown />

        {/* Recent Transactions */}
        <Transactions />
      </div>
    </PageContainer>
  );
}
