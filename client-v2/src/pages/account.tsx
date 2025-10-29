import PageContainer from "@/components/page-container";
import { PAGE_METADATA } from "@/lib/seo-config";

export const AccountPage = () => {
  return (
    <PageContainer {...PAGE_METADATA.account}>
      <h1>Account</h1>
      {/* Your account content here */}
    </PageContainer>
  );
};
