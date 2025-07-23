"use client";

import { useEffect } from "react";

interface PageHeadProps {
  title: string;
  description: string;
}

export default function PageHead({ title, description }: PageHeadProps) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    } else {
      const meta = document.createElement("meta");
      meta.name = "description";
      meta.content = description;
      document.head.appendChild(meta);
    }
  }, [title, description]);

  return null;
}
