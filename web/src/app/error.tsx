"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">😵</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Algo deu errado
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <button
          onClick={reset}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
