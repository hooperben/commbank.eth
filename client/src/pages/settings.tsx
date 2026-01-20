import { AddressCard } from "@/_components/account/address-card";
import { BackupAccountModal } from "@/_components/settings/backup-account-modal";
import { DeleteAccountModal } from "@/_components/settings/delete-account-modal";
import { ResetAppModal } from "@/_components/settings/reset-app-modal";
import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { PAGE_METADATA } from "@/_constants/seo-config";
import { useAuth } from "@/_providers/auth-provider";
import PageContainer from "@/_providers/page-container";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export const SettingsPage = () => {
  const { address, privateAddress, signingKey } = useAuth();

  return (
    <PageContainer {...PAGE_METADATA.settings}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <AddressCard
          publicAddress={address}
          privateAddress={privateAddress}
          signingKey={signingKey}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-left">Account Backup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-left">
              Export your account secret so that if you change browser or device
              you can restore your commbank.eth account.
            </p>
            <div className="flex justify-start">
              <BackupAccountModal />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-left">Reset App Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-left">
              Clear your local cache and re-sync your account data. Your
              credentials and contacts will be preserved.
            </p>
            <div className="flex justify-start gap-2">
              <ResetAppModal />

              <Button
                variant="secondary"
                className="font-semibold flex gap-1"
                asChild
              >
                <Link to="/state">
                  View App State <ArrowRight />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-left text-destructive">
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-left">
                Permanently delete your account and all associated data. This
                action cannot be undone.
              </p>
              <div className="flex justify-start">
                <DeleteAccountModal />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
