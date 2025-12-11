import { AddressCard } from "@/_components/account/address-card";
import { BackupAccountModal } from "@/_components/settings/backup-account-modal";
import { DeleteAccountModal } from "@/_components/settings/delete-account-modal";
import PageContainer from "@/_providers/page-container";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { useAuth } from "@/_providers/auth-provider";
import { PAGE_METADATA } from "@/_constants/seo-config";

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
