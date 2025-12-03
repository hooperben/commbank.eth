import { AccountNavigation } from "@/components/account/account-navigation";
import { AssetBreakdown } from "@/components/account/asset-breakdown";
import { BalanceCard } from "@/components/account/balance-card";
import { Transactions } from "@/components/account/transactions";
import PageContainer from "@/components/page-container";
import { PAGE_METADATA } from "@/lib/seo-config";

export default function AccountPage() {
  return (
    <PageContainer {...PAGE_METADATA.account}>
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
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
