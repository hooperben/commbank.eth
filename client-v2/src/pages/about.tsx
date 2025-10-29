import PageContainer from "@/components/page-container";
import { PAGE_METADATA } from "@/lib/seo-config";

export const AboutPage = () => {
  return (
    <PageContainer {...PAGE_METADATA.about}>
      <div className="flex flex-col">
        <h3>Interested in commbank.eth?</h3>
      </div>
      {/* Your about content here */}
    </PageContainer>
  );
};
