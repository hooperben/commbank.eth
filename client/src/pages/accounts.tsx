import { AssetBreakdown } from "@/_components/account/asset-breakdown";
import { PortfolioChartWithTooltip } from "@/_components/account/portfolio-chart";
import { Button } from "@/_components/ui/button";
import { PAGE_METADATA } from "@/_constants/seo-config";
import PageContainer from "@/_providers/page-container";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AccountsPage() {
  return (
    <PageContainer
      {...PAGE_METADATA.accounts}
      header="Accounts"
      description="Manage your commbank.eth assets"
    >
      <div className="container mx-auto p-2 max-w-6xl space-y-6 text-left">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/account" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Account
            </Link>
          </Button>
        </div>

        {/* Portfolio Chart */}
        <PortfolioChartWithTooltip />

        {/* Accounts Section */}
        <AssetBreakdown isPortfolio />
      </div>
    </PageContainer>
  );
}
