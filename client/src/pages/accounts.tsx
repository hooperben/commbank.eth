import { AccountsList } from "@/_components/account/accounts-list";
import { PortfolioChartWithTooltip } from "@/_components/account/portfolio-chart";
import { Button } from "@/_components/ui/button";
import { PAGE_METADATA } from "@/_constants/seo-config";
import PageContainer from "@/_providers/page-container";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function AccountsPage() {
  const handleSendClick = () => {
    console.log("Send button clicked");
  };

  const handleReceiveClick = () => {
    console.log("Receive button clicked");
  };

  const handleEncryptClick = () => {
    console.log("Encrypt button clicked");
  };

  const handleDecryptClick = () => {
    console.log("Decrypt button clicked");
  };

  return (
    <PageContainer
      {...PAGE_METADATA.accounts}
      header="Accounts"
      description="Manage your commbank.eth assets"
    >
      <div className="container mx-auto p-6 max-w-6xl space-y-6 text-left">
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

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSendClick}
            className="h-14 text-xl"
          >
            Send
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleReceiveClick}
            className="h-14 text-xl"
          >
            Receive
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleEncryptClick}
            className="h-14 text-xl"
          >
            Encrypt
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleDecryptClick}
            className="h-14 text-xl"
          >
            Decrypt
          </Button>
        </div>

        {/* Accounts List */}
        <AccountsList />
      </div>
    </PageContainer>
  );
}
