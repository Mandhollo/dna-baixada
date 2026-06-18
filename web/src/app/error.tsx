"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [reported, setReported] = useState(false);

  useEffect(() => {
    console.error("[App Error]", error);

    // Report error to Supabase (fire-and-forget, no blocking)
    const reportError = async () => {
      try {
        await supabase.from("mensagens_contato").insert({
          nome: "Sistema (Error Boundary)",
          email: "sistema@dnabaixada.com.br",
          mensagem: `[ERROR] ${error.message} | digest: ${error.digest ?? "n/a"} | stack: ${error.stack?.substring(0, 500) ?? "no stack"}`,
        });
        setReported(true);
      } catch {
        // Silent fail — don't block error page
      }
    };
    reportError();
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">😵</div>
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          Algo deu errado
        </h1>
        <p className="mb-2 text-sm text-foreground-muted">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        {reported && (
          <p className="mb-4 text-xs text-secondary">
            ✓ Erro reportado automaticamente
          </p>
        )}
        {error.digest && (
          <p className="mb-4 text-xs text-foreground-muted">
            Código: <code className="rounded bg-background-tertiary px-1.5 py-0.5">{error.digest}</code>
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="rounded-xl border border-border bg-surface-elevated px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-background-tertiary"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}
