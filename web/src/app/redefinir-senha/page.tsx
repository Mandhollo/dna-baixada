'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useState, useEffect, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type PageState = 'loading' | 'valid' | 'error' | 'success';

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Validate the recovery token from the URL hash ──
  useEffect(() => {
    const validateToken = async () => {
      try {
        // Supabase puts the access_token in the hash fragment
        // The Supabase JS client should automatically parse it on page load
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !data.session) {
          setPageState('error');
          setError('Link inválido ou expirado. Solicite um novo link de recuperação.');
          return;
        }

        // Check if this is actually a recovery session
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const tokenType = hashParams.get('type');

        if (tokenType !== 'recovery' && data.session?.user?.aud !== 'authenticated') {
          setPageState('error');
          setError('Link inválido ou expirado. Solicite um novo link de recuperação.');
          return;
        }

        setPageState('valid');
      } catch {
        setPageState('error');
        setError('Erro ao verificar o link. Tente novamente.');
      }
    };

    validateToken();
  }, []);

  // ── Handle password reset submission ──
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Preencha todos os campos.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setPageState('success');
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/entrar');
      }, 3000);
    }
  };

  // ── Shared wrapper (gradient bg, card, motion) ──
  const card = (inner: React.ReactNode) => (
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
          {/* Logo / brand */}
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-light shadow-lg shadow-primary/25">
              <span className="text-2xl font-extrabold text-white">DB</span>
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-foreground">
              Redefinir Senha
            </h1>
          </div>

          {inner}
        </div>

        {/* Bottom tagline */}
        <p className="mt-6 text-center text-xs text-white/40">
          DNA Baixada — Mobilidade, Turismo e Impacto Social
        </p>
      </motion.div>
    </div>
  );

  // ── Loading state ──
  if (pageState === 'loading') {
    return card(
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="mt-4 text-sm text-foreground-muted">Verificando link de recuperação...</p>
      </div>
    );
  }

  // ── Error state (invalid / expired token) ──
  if (pageState === 'error') {
    return card(
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' as const }}
        className="text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent2/10">
          <AlertCircle size={28} className="text-accent2" />
        </div>
        <h2 className="mt-4 text-lg font-bold text-foreground">
          Link inválido
        </h2>
        <p className="mt-2 text-sm text-foreground-secondary">
          {error || 'Este link de recuperação é inválido ou já expirou.'}
        </p>
        <Link
          href="/recuperar-senha"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:brightness-110"
        >
          <ArrowLeft size={16} /> Solicitar novo link
        </Link>
      </motion.div>
    );
  }

  // ── Success state ──
  if (pageState === 'success') {
    return card(
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
          Senha atualizada!
        </h2>
        <p className="mt-2 text-sm text-foreground-secondary">
          Sua senha foi redefinida com sucesso. Você será redirecionado para o
          login em alguns segundos...
        </p>
        <Link
          href="/entrar"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:brightness-110"
        >
          <ArrowLeft size={16} /> Ir para Login
        </Link>
      </motion.div>
    );
  }

  // ── Valid state: password reset form ──
  return card(
    <>
      <p className="mb-6 text-center text-sm text-foreground-muted">
        Digite sua nova senha abaixo.
      </p>

      {/* Error banner */}
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nova Senha */}
        <div>
          <label
            htmlFor="newPassword"
            className="mb-1.5 block text-sm font-semibold text-foreground"
          >
            Nova Senha
          </label>
          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted"
            />
            <input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              required
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-12 text-sm text-foreground outline-none transition placeholder:text-foreground-muted/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted transition hover:text-foreground"
              aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirmar Senha */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-semibold text-foreground"
          >
            Confirmar Senha
          </label>
          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted"
            />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-background py-3 pl-11 pr-12 text-sm text-foreground outline-none transition placeholder:text-foreground-muted/50 focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted transition hover:text-foreground"
              aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-dark to-accent py-3 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Redefinindo...
            </>
          ) : (
            'Redefinir Senha'
          )}
        </button>
      </form>

      {/* Back link */}
      <div className="mt-6 text-center">
        <Link
          href="/entrar"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary-light"
        >
          <ArrowLeft size={14} /> Voltar ao Login
        </Link>
      </div>
    </>
  );
}
