'use client';

import { useEffect } from 'react';

interface SeoMetaProps {
  title: string;
  description?: string;
}

/**
 * Sets document.title and meta description for client component pages.
 * Next.js layout metadata only works for server components.
 * This handles SEO for client-side premium pages.
 */
export default function SeoMeta({ title, description }: SeoMetaProps) {
  useEffect(() => {
    document.title = `${title} | DNA Baixada`;

    // Update meta description
    if (description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', description);
    }

    // Update og:title
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', `${title} | DNA Baixada`);

    // Update og:description
    if (description) {
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', description);
    }
  }, [title, description]);

  return null;
}
