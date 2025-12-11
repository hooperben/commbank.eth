import { usePageTitle } from "@/_providers/page-title-context";
import type { PageMetadata } from "@/_constants/seo-config";
import { useEffect } from "react";
import PageHead from "../_providers/page-head";

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
  ogImage,
  ogImageAlt,
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
        ogImage={ogImage}
        ogImageAlt={ogImageAlt}
      />
      {children}
    </>
  );
};

export default PageContainer;
