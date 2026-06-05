'use client';

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const { error: supaError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/redefinir-senha` }
    );

    setLoading(false);

    if (supaError) {
      setError(supaError.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary-light to-secondary px-4 py-12">
      {/* Decorative radial glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(245,166,35,.12),transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' as const }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="rounded-3xl bg-surface-elevated p-8 shadow-xl sm:p-10">
          {/* ── Logo / brand ── */}
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light shadow-lg shadow-primary/25">
              <span className="text-2xl font-extrabold text-white">DB</span>
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-foreground">
              Recuperar Senha
            </h1>
            <p className="mt-2 text-sm text-foreground-muted">
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          {/* ── Success state ── */}
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' as const }}
              className="text-center"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10">
                <CheckCircle size={28} className="text-secondary" />
              </div>
              <h2 className="mt-4 text-lg font-bold text-foreground">
                E-mail enviado!
              </h2>
              <p className="mt-2 text-sm text-foreground-secondary">
                Enviamos um link para <strong>{email}</strong>. Verifique sua caixa
                de entrada e spam.
              </p>
              <Link
                href="/entrar"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:brightness-110"
              >
                <ArrowLeft size={16} /> Voltar ao Login
              </Link>
            </motion.div>
          ) : (
            <>
              {/* ── Error banner ── */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-5 flex items-center gap-2 rounded-xl border border-accent2/20 bg-accent2/5 px-4 py-3 text-sm text-accent2"
                >
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </motion.div>
              )}

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-semibold text-foreground"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted"
                    />
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-foreground-muted/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-dark to-accent py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Link'
                  )}
                </button>
              </form>

              {/* ── Back link ── */}
              <div className="mt-6 text-center">
                <Link
                  href="/entrar"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary-light"
                >
                  <ArrowLeft size={14} /> Voltar ao Login
                </Link>
              </div>
            </>
          )}
        </div>

        {/* ── Bottom tagline ── */}
        <p className="mt-6 text-center text-xs text-white/40">
          DNA Baixada — Mobilidade, Turismo e Impacto Social
        </p>
      </motion.div>
    </div>
  );
}
