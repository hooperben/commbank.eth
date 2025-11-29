import { Helmet } from "react-helmet";
import {
  DEFAULT_SEO,
  mergeWithDefaults,
  type PageMetadata,
} from "@/lib/seo-config";

interface PageHeadProps extends Partial<PageMetadata> {
  pageTitle?: string;
}

export default function PageHead({
  pageTitle,
  title,
  description,
  path = "/",
  keywords,
  type,
  ogImage,
  ogImageAlt,
}: PageHeadProps) {
  const seoConfig = mergeWithDefaults({
    title:
      title || (pageTitle ? `commbank.eth | ${pageTitle}` : DEFAULT_SEO.title),
    description: description || DEFAULT_SEO.description,
    path,
    keywords,
    type,
    ogImage,
    ogImageAlt,
  });

  const canonicalUrl = seoConfig.url;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{seoConfig.title}</title>
      <meta name="title" content={seoConfig.title} />
      <meta name="description" content={seoConfig.description} />
      <meta name="keywords" content={seoConfig.keywords?.join(", ")} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={seoConfig.type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={seoConfig.title} />
      <meta property="og:description" content={seoConfig.description} />
      <meta
        property="og:image"
        content={seoConfig.ogImage || seoConfig.imageUrl}
      />
      <meta
        property="og:image:alt"
        content={seoConfig.ogImageAlt || seoConfig.imageAlt}
      />
      <meta property="og:site_name" content={seoConfig.siteName} />
      <meta property="og:locale" content={seoConfig.locale} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={seoConfig.title} />
      <meta name="twitter:description" content={seoConfig.description} />
      <meta
        name="twitter:image"
        content={seoConfig.ogImage || seoConfig.imageUrl}
      />
      <meta
        name="twitter:image:alt"
        content={seoConfig.ogImageAlt || seoConfig.imageAlt}
      />
      <meta name="twitter:site" content={seoConfig.twitterHandle} />
      <meta name="twitter:creator" content={seoConfig.twitterHandle} />

      {/* Additional Meta Tags */}
      <meta name="author" content="commbank.eth" />
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      <meta name="theme-color" content="#000000" />

      {/* Links */}
      <link
        rel="me"
        href={DEFAULT_SEO.twitterHandle.replace("@", "https://x.com/")}
      />
      <link rel="me" href={DEFAULT_SEO.githubUrl} />
    </Helmet>
  );
}
