import { usePageTitle } from "@/lib/page-title-context";
import type { PageMetadata } from "@/lib/seo-config";
import { useEffect } from "react";
import PageHead from "./page-head";

interface PageContainerProps extends Partial<PageMetadata> {
  children: React.ReactNode;
  pageTitle?: string;
}

const PageContainer = ({
  header,
  children,
  pageTitle,
  title,
  description,
  path,
  keywords,
  type,
}: PageContainerProps) => {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle(header);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- just on load
  }, []);

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
