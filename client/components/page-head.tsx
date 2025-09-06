"use client";

import { useEffect } from "react";

interface PageHeadProps {
  title: string;
  description: string;
}

export default function PageHead({ title, description }: PageHeadProps) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Set document title
    document.title = title;

    // Set meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Set basic Open Graph tags
    const setOrCreateMetaTag = (property: string, content: string) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (metaTag) {
        metaTag.setAttribute("content", content);
      } else {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("property", property);
        metaTag.setAttribute("content", content);
        document.head.appendChild(metaTag);
      }
    };

    // Set Open Graph tags
    setOrCreateMetaTag("og:title", title);
    setOrCreateMetaTag("og:description", description);
    setOrCreateMetaTag("og:type", "website");
    setOrCreateMetaTag("og:url", window.location.href);
    setOrCreateMetaTag("og:site_name", "commbank.eth");
    setOrCreateMetaTag(
      "og:image",
      "https://commbank.eth.limo/commbankdotethbanner.png",
    );

    // Set Twitter Card tags
    const setOrCreateTwitterTag = (name: string, content: string) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (metaTag) {
        metaTag.setAttribute("content", content);
      } else {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("name", name);
        metaTag.setAttribute("content", content);
        document.head.appendChild(metaTag);
      }
    };

    setOrCreateTwitterTag("twitter:card", "summary_large_image");
    setOrCreateTwitterTag("twitter:title", title);
    setOrCreateTwitterTag("twitter:description", description);
    setOrCreateTwitterTag(
      "twitter:image",
      "https://commbank.eth.limo/commbankdotethbanner.png",
    );
    setOrCreateTwitterTag("twitter:site", "@commbankdoteth");

    // Add keywords meta tag
    setOrCreateTwitterTag(
      "keywords",
      "applied cryptography buildspace and showcase",
    );
  }, [title, description]);

  return null;
}
