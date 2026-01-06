import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
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
      <div className="container mx-auto p-6 max-w-6xl space-y-6 text-left">
        <div className="flex items-center gap-4">
          <Button variant="ghost">
            <Link to="/account" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Account
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Portfolio</CardTitle>
                <CardDescription>View and manage your assets.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4"></CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
