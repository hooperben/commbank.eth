import PageContainer from "@/components/page-container";
import { PAGE_METADATA } from "@/lib/seo-config";

export const HomePage = () => {
  return (
    <PageContainer {...PAGE_METADATA.home}>
      <h1>Home</h1>
    </PageContainer>
  );
};
