import PageContainer from "@/components/page-container";
import { PAGE_METADATA } from "@/lib/seo-config";

export const HomePage = () => {
  return (
    <PageContainer {...PAGE_METADATA.home}>
      <div className="flex flex-col">Home Page Coming</div>
    </PageContainer>
  );
};
