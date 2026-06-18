'use client';
import PageTitle from '@/components/seo/PageTitle';
import Link from 'next/link';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import OnboardingTutorial from '@/components/OnboardingTutorial';

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/entrar');
      return;
    }

    if (!profile) return; // still loading profile

    switch (profile.role) {
      case 'motorista':
        router.replace('/dashboard/motorista');
        break;
      case 'parceiro':
        router.replace('/dashboard/parceiro');
        break;
      case 'admin':
        router.replace('/admin');
        break;
      // 'passageiro' stays on this page — content rendered below
    }
  }, [user, profile, loading, router]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
      <PageTitle title='Painel do Passageiro' />
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-foreground-muted">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  /* ── Passageiro sees inline content; others are redirected ── */
  if (profile.role !== 'passageiro') {
    // Show loading while redirect happens
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-foreground-muted">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Re-export the passageiro dashboard inline to avoid extra navigation
  return <PassageiroDashboard />;
}

/* ═══════════════════════════════════════════════════════════
   Passageiro Dashboard — rendered directly for role=passageiro
   ═══════════════════════════════════════════════════════════ */
function PassageiroDashboard() {
  const { profile, signOut } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      const done = localStorage.getItem('dna_baixada_onboarding_done');
      if (!done) setShowOnboarding(true);
    } catch {
      // localStorage unavailable
    }
  }, []);

  if (!profile) return null;

  const firstName = profile.nome.split(' ')[0];

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Onboarding tutorial for first-time users */}
      {showOnboarding && (
        <OnboardingTutorial
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-extrabold tracking-tight text-accent">DNA</span>
            <span className="text-lg font-semibold text-white">Baixada</span>
          </Link>
          <div className="flex items-center gap-3">
            <p className="hidden sm:block text-sm text-white/70">
              Olá, <span className="font-semibold text-white">{firstName}</span>
            </p>
            <button
              onClick={signOut}
              className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* ── Stats cards ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Saldo de Pontos"
            value={String(profile.pontos ?? 0)}
            icon="🎯"
            color="primary"
          />
          <StatCard
            label="Corridas"
            value="0"
            icon="🚗"
            color="secondary"
          />
          <StatCard
            label="Avaliação"
            value={
              profile.avaliacao_media
                ? profile.avaliacao_media.toFixed(1)
                : '—'
            }
            icon="⭐"
            color="accent"
          />
        </div>

        {/* ── Quick actions ── */}
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground-muted">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ActionCard
              title="Solicitar Corrida"
              description="Peça uma corrida agora"
              icon="🚕"
              href="/corrida/solicitar"
              variant="primary"
            />
            <ActionCard
              title="City Tour"
              description="Conheça a Baixada"
              icon="🗺️"
              href="/corrida/solicitar"
              variant="secondary"
            />
            <ActionCard
              title="Transfer"
              description="Aeroporto, hotel, etc."
              icon="✈️"
              href="/corrida/solicitar"
              variant="accent"
            />
            <ActionCard
              title="Minhas Corridas"
              description="Histórico de corridas"
              icon="📋"
              href="/dashboard/corridas"
              variant="secondary"
            />
          </div>
        </section>

        {/* ── Recent rides ── */}
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground-muted">
            Últimas Corridas
          </h2>
          <div className="rounded-2xl border border-border bg-surface-elevated p-8 text-center shadow-sm">
            <p className="text-4xl">📭</p>
            <p className="mt-3 font-semibold text-foreground-secondary">
              Nenhuma corrida ainda
            </p>
            <p className="mt-1 text-sm text-foreground-muted">
              Solicite sua primeira corrida e ela aparecerá aqui.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Stat card component ── */
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: 'primary' | 'secondary' | 'accent';
}) {
  const bgMap = {
    primary: 'bg-primary/5 border-primary/10',
    secondary: 'bg-secondary/5 border-secondary/10',
    accent: 'bg-accent/5 border-accent/10',
  };
  const textMap = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    accent: 'text-accent-dark',
  };

  return (
    <div
      className={`rounded-2xl border ${bgMap[color]} p-5 transition hover:shadow-md`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className={`text-2xl font-extrabold ${textMap[color]}`}>
            {value}
          </p>
          <p className="text-xs font-medium text-foreground-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

/* ── Action card component ── */
function ActionCard({
  title,
  description,
  icon,
  href,
  variant,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
  variant: 'primary' | 'secondary' | 'accent';
}) {
  const bgMap = {
    primary: 'from-primary to-primary-light',
    secondary: 'from-secondary to-secondary-light',
    accent: 'from-accent-dark to-accent',
  };
  const shadowMap = {
    primary: 'shadow-primary/20',
    secondary: 'shadow-secondary/20',
    accent: 'shadow-accent/20',
  };

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${bgMap[variant]} p-5 text-white shadow-lg ${shadowMap[variant]} transition hover:-translate-y-1 hover:shadow-xl`}
    >
      <span className="absolute -right-4 -top-4 text-6xl opacity-20 transition group-hover:opacity-30">
        {icon}
      </span>
      <span className="text-2xl">{icon}</span>
      <h3 className="mt-3 font-bold">{title}</h3>
      <p className="mt-1 text-sm text-white/80">{description}</p>
    </Link>
  );
}
