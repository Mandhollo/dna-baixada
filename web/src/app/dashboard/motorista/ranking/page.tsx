'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Medal,
  Star,
  LayoutDashboard,
  Car,
  Wallet,
  Users,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase, formatarBRL } from '@/lib/supabase';
import type { RankingMotorista } from '@/lib/supabase';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

/* ─── Podium color configs ─── */
const PODIUM_CONFIG: Record<number, { bg: string; border: string; badge: string; label: string; icon: React.ElementType; glow: string }> = {
  1: {
    bg: 'bg-gradient-to-br from-accent/10 to-accent/5',
    border: 'border-accent/30',
    badge: 'bg-accent text-white',
    label: '1o Lugar',
    icon: Trophy,
    glow: 'shadow-lg shadow-accent/10',
  },
  2: {
    bg: 'bg-gradient-to-br from-gray-200/60 to-gray-100/30',
    border: 'border-gray-300/50',
    badge: 'bg-gray-400 text-white',
    label: '2o Lugar',
    icon: Medal,
    glow: 'shadow-md shadow-gray-300/20',
  },
  3: {
    bg: 'bg-gradient-to-br from-amber-100/60 to-amber-50/30',
    border: 'border-amber-400/40',
    badge: 'bg-amber-600 text-white',
    label: '3o Lugar',
    icon: Medal,
    glow: 'shadow-md shadow-amber-300/20',
  },
};

/* ════════════════════════════════════════════════════════════ */
/*  Page Component                                            */
/* ════════════════════════════════════════════════════════════ */
export default function RankingMotoristasPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [ranking, setRanking] = useState<RankingMotorista[]>([]);
  const [carregando, setCarregando] = useState(true);

  /* ── Auth guard ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== 'motorista') {
      router.replace('/entrar');
    }
  }, [user, profile, authLoading, router]);

  /* ── Fetch ranking ── */
  useEffect(() => {
    if (!user) return;

    supabase
      .from('ranking_motoristas')
      .select('*')
      .order('score', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          setRanking(data as RankingMotorista[]);
        }
        setCarregando(false);
      });
  }, [user]);

  /* ── Split top 3 vs rest ── */
  const top3 = useMemo(() => ranking.slice(0, 3), [ranking]);
  const rest = useMemo(() => ranking.slice(3), [ranking]);

  /* ── Loading state ── */
  if (authLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary pb-24">
      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => router.push('/dashboard/motorista')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Motorista
            </p>
            <h1 className="text-lg font-bold sm:text-xl">Ranking</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard/motorista')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            aria-label="Dashboard"
          >
            <LayoutDashboard size={20} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {carregando ? (
          /* ═══ Loading ═══ */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="mt-4 text-sm text-foreground-muted">
              Carregando ranking...
            </p>
          </div>
        ) : ranking.length === 0 ? (
          /* ═══ Empty state ═══ */
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="rounded-2xl border border-border bg-surface-elevated p-8 text-center shadow-sm"
          >
            <Users size={48} className="mx-auto text-foreground-muted/30" />
            <p className="mt-4 text-lg font-bold text-foreground-secondary">
              Nenhum motorista no ranking
            </p>
            <p className="mt-2 text-sm text-foreground-muted">
              O ranking sera atualizado assim que os motoristas comecarem a realizar corridas.
            </p>
          </motion.div>
        ) : (
          <>
            {/* ═══ Podium Top 3 ═══ */}
            {top3.length > 0 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Trophy size={18} className="text-accent" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">
                    Top do Ranking
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Show in order 1,2,3 — but on mobile, position 1 is rendered first */}
                  {[0, 1, 2].map((idx) => {
                    const motorista = top3[idx];
                    if (!motorista) return null;
                    const pos = idx + 1;
                    const config = PODIUM_CONFIG[pos];
                    const PosIcon = config.icon;
                    const isMe = user?.id === motorista.id;

                    return (
                      <motion.div
                        key={motorista.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: idx * 0.15, duration: 0.5, ease: 'easeOut' }}
                        className={`relative overflow-hidden rounded-2xl border ${config.border} ${config.bg} p-5 ${config.glow} ${
                          pos === 1 ? 'sm:row-span-1' : ''
                        } ${isMe ? 'ring-2 ring-primary' : ''}`}
                      >
                        {/* Position badge */}
                        <div className="absolute top-3 right-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold ${config.badge}`}>
                            <PosIcon size={12} />
                            {pos}o
                          </span>
                        </div>

                        {/* Avatar */}
                        <div className="flex items-center gap-3">
                          <div className={`relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full ${
                            pos === 1 ? 'h-16 w-16 ring-2 ring-accent/50' : 'ring-1 ring-border'
                          } bg-primary/10`}>
                            {motorista.foto_url ? (
                              <img
                                src={motorista.foto_url}
                                alt={motorista.nome}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xl font-bold text-primary">
                                {motorista.nome.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-foreground">
                              {motorista.nome}
                            </p>
                            <p className="truncate text-xs text-foreground-muted">
                              {motorista.veiculo_modelo}
                            </p>
                            <p className="truncate text-[11px] text-foreground-muted/70">
                              {motorista.cidade_base}
                            </p>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <p className="text-base font-extrabold text-foreground">
                              {motorista.score.toFixed(0)}
                            </p>
                            <p className="text-[10px] font-medium text-foreground-muted">
                              Score
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-base font-extrabold text-foreground">
                              {motorista.corridas_mes}
                            </p>
                            <p className="text-[10px] font-medium text-foreground-muted">
                              Corridas
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-base font-extrabold text-secondary">
                              {formatarBRL(motorista.ganho_mes)}
                            </p>
                            <p className="text-[10px] font-medium text-foreground-muted">
                              Ganho mes
                            </p>
                          </div>
                        </div>

                        {/* "Voce" indicator */}
                        {isMe && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary/10 text-center">
                            <span className="text-[10px] font-bold text-primary">Voce</span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ═══ Rest of ranking ═══ */}
            {rest.length > 0 && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
                className="mt-8"
              >
                <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground-muted">
                  Classificacao Geral
                </h2>

                <div className="space-y-3">
                  {rest.map((motorista, i) => {
                    const pos = i + 4; // starts at 4
                    const isMe = user?.id === motorista.id;

                    return (
                      <motion.div
                        key={motorista.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.35, ease: 'easeOut' }}
                        className={`flex items-center gap-3 rounded-2xl border bg-surface-elevated p-3.5 shadow-sm transition hover:shadow-md ${
                          isMe
                            ? 'border-primary/40 ring-2 ring-primary/20'
                            : 'border-border'
                        }`}
                      >
                        {/* Position number */}
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                          isMe ? 'bg-primary text-white' : 'bg-primary/5 text-primary'
                        }`}>
                          {pos}
                        </div>

                        {/* Avatar */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                          {motorista.foto_url ? (
                            <img
                              src={motorista.foto_url}
                              alt={motorista.nome}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-bold text-primary">
                              {motorista.nome.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Name + info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-foreground">
                              {motorista.nome}
                            </p>
                            {isMe && (
                              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                Voce
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-foreground-muted">
                            {motorista.veiculo_modelo}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="flex shrink-0 items-center gap-4">
                          {/* Score */}
                          <div className="text-right">
                            <p className="text-sm font-extrabold text-foreground">
                              {motorista.score.toFixed(0)}
                            </p>
                            <p className="text-[10px] text-foreground-muted">score</p>
                          </div>

                          {/* Avaliacao */}
                          <div className="flex items-center gap-1">
                            <Star size={14} className="text-accent" fill="currentColor" />
                            <span className="text-sm font-bold text-foreground">
                              {motorista.avaliacao_media.toFixed(1)}
                            </span>
                          </div>

                          {/* Corridas mes */}
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground-secondary">
                              {motorista.corridas_mes}
                            </p>
                            <p className="text-[10px] text-foreground-muted">corridas</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* ═══ Bottom Nav ═══ */}
      <BottomNav />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
/*  Sub-components                                            */
/* ════════════════════════════════════════════════════════════ */

/* ─── Bottom Navigation ─── */
function BottomNav() {
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface-elevated shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-around py-2">
        <NavItem
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          onClick={() => router.push('/dashboard/motorista')}
        />
        <NavItem
          icon={<Car size={20} />}
          label="Corridas"
          onClick={() => router.push('/corridas-disponiveis')}
        />
        <NavItem
          icon={<Wallet size={20} />}
          label="Financeiro"
          onClick={() => router.push('/dashboard/motorista/financeiro')}
        />
      </div>
    </nav>
  );
}

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 px-4 py-1.5 transition ${
        active
          ? 'text-primary'
          : 'text-foreground-muted hover:text-foreground-secondary'
      }`}
    >
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
