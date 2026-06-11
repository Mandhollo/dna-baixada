'use client';

import { useEffect } from 'react';

/**
 * Sets document.title for client component pages.
 * Next.js layout uses template: "%s | DNA Baixada" but only for server-side metadata.
 * This component handles it for client pages.
 */
export default function PageTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = `${title} | DNA Baixada`;
  }, [title]);
  return null;
}
