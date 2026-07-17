'use client';

import Link from 'next/link';
import { AlertTriangle, RefreshCw, Crown } from 'lucide-react';

export default function PremiumError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-secondary px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent2/10">
          <AlertTriangle className="h-8 w-8 text-accent2" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2">
          Algo deu errado
        </h1>
        <p className="text-sm text-foreground-muted mb-6">
          Não foi possível carregar esta página do DNA Premium.
          Tente novamente em instantes.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-primary-dark"
          >
            <RefreshCw className="h-4 w-4" /> Tentar novamente
          </button>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-6 py-3 text-sm font-bold text-primary transition hover:bg-gray-100"
          >
            <Crown className="h-4 w-4" /> Voltar para Premium
          </Link>
        </div>
      </div>
    </div>
  );
}
