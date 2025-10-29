import PageHead from "./page-head";
import type { PageMetadata } from "@/lib/seo-config";

interface PageContainerProps extends Partial<PageMetadata> {
  children: React.ReactNode;
  pageTitle?: string;
}

const PageContainer = ({
  children,
  pageTitle,
  title,
  description,
  path,
  keywords,
  type,
}: PageContainerProps) => {
  return (
    <>
      <PageHead
        pageTitle={pageTitle}
        title={title}
        description={description}
        path={path}
        keywords={keywords}
        type={type}
      />
      {children}
    </>
  );
};

export default PageContainer;
