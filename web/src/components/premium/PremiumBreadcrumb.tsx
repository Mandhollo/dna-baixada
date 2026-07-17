'use client';

import Link from 'next/link';
import { ChevronRight, Crown } from 'lucide-react';

interface PremiumBreadcrumbProps {
  current: string;
  parent?: string;
  parentHref?: string;
}

/**
 * Breadcrumb navigation for premium sub-pages.
 * Shows: Premium > [Parent] > Current
 */
export default function PremiumBreadcrumb({ current, parent, parentHref }: PremiumBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-sm font-medium text-gray-400 mb-6" aria-label="Breadcrumb">
      <Link href="/premium" className="flex items-center gap-1 transition-colors hover:text-primary">
        <Crown className="h-3.5 w-3.5" />
        <span>Premium</span>
      </Link>
      {parent && parentHref && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          <Link href={parentHref} className="transition-colors hover:text-primary">
            {parent}
          </Link>
        </>
      )}
      <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
      <span className="font-bold text-primary">{current}</span>
    </nav>
  );
}
