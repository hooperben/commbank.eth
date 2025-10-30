import PageContainer from "@/components/page-container";
import { PAGE_METADATA } from "@/lib/seo-config";

export const SettingsPage = () => {
  return (
    <PageContainer {...PAGE_METADATA.settings}>
      <h1>Settings</h1>
    </PageContainer>
  );
};
