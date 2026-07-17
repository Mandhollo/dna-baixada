'use client';

import { useEffect } from 'react';

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Injects JSON-LD structured data into the page <head> for SEO.
 * Helps Google understand the page content (rich results).
 */
export default function JsonLd({ data }: JsonLdProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    script.setAttribute('data-hermes-jsonld', 'true');

    // Remove existing JSON-LD injected by THIS component only (avoid duplicates)
    const existing = document.querySelector('script[data-hermes-jsonld="true"]');
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [data]);

  return null;
}
