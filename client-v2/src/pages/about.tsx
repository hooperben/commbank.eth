import PageContainer from "@/components/page-container";
import { PAGE_METADATA } from "@/lib/seo-config";

export const AboutPage = () => {
  return (
    <PageContainer {...PAGE_METADATA.about}>
      <h1>About</h1>
      {/* Your about content here */}
    </PageContainer>
  );
};
