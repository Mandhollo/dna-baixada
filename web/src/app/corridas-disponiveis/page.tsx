'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  RefreshCw,
  MapPin,
  Navigation,
  Clock,
  Users,
  CheckCircle2,
  Loader2,
  Radio,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase, CORRIDA_TIPOS, type Corrida, type Motorista } from '@/lib/supabase';

/* ─── helpers ─── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'agora mesmo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function getTipoConfig(tipo: string) {
  return CORRIDA_TIPOS.find((t) => t.value === tipo) ?? CORRIDA_TIPOS[0];
}

/* ─── type for ride with passenger join ─── */

type CorridaDisponivel = Omit<Corrida, 'passageiro'> & {
  passageiro?: { nome: string; foto_url: string | null } | null;
};

/* ─── animation variants ─── */

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' as const } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.25 } },
};

/* ════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════ */

export default function CorridasDisponiveisPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const [corridas, setCorridas] = useState<CorridaDisponivel[]>([]);
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aceitandoId, setAceitandoId] = useState<string | null>(null);
  const [disponivel, setDisponivel] = useState(false);

  /* ── redirect if not motorista ── */
  useEffect(() => {
    if (loading) return;
    if (!user || profile?.role !== 'motorista') {
      router.replace('/entrar');
    }
  }, [user, profile, loading, router]);

  /* ── fetch motorista disponibilidade ── */
  useEffect(() => {
    if (!user) return;
    supabase
      .from('motoristas')
      .select('disponivel')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setDisponivel((data as Motorista).disponivel);
      });
  }, [user]);

  /* ── fetch available rides ── */
  const fetchCorridas = useCallback(async () => {
    const { data } = await supabase
      .from('corridas')
      .select('*, passageiro:profiles!corridas_passageiro_id_fkey(nome, foto_url)')
      .eq('status', 'aguardando')
      .order('created_at', { ascending: false });

    if (data) setCorridas(data as CorridaDisponivel[]);
  }, []);

  useEffect(() => {
    fetchCorridas().finally(() => setFetching(false));
  }, [fetchCorridas]);

  /* ── realtime subscription ── */
  useEffect(() => {
    const channel = supabase
      .channel('corridas-disponiveis')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'corridas', filter: 'status=eq.aguardando' },
        async (payload) => {
          const nova = payload.new as Corrida;
          // fetch passenger info
          const { data: passageiro } = await supabase
            .from('profiles')
            .select('nome, foto_url')
            .eq('id', nova.passageiro_id)
            .single();
          setCorridas((prev) => [{ ...nova, passageiro: passageiro as CorridaDisponivel['passageiro'] }, ...prev]);
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'corridas' },
        (payload) => {
          const updated = payload.new as Corrida;
          if (updated.status !== 'aguardando') {
            setCorridas((prev) => prev.filter((c) => c.id !== updated.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* ── pull-to-refresh ── */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCorridas();
    setRefreshing(false);
  };

  /* ── accept ride ── */
  const handleAceitar = async (corridaId: string) => {
    if (!user || aceitandoId) return;
    setAceitandoId(corridaId);
    const { error } = await supabase
      .from('corridas')
      .update({
        motorista_id: user.id,
        status: 'aceita',
        aceita_em: new Date().toISOString(),
      })
      .eq('id', corridaId)
      .eq('status', 'aguardando');

    if (error) {
      // Corrida may have been taken by another driver
      setAceitandoId(null);
      alert('Esta corrida já foi aceita por outro motorista.');
      fetchCorridas();
      return;
    }

    router.push(`/corrida/${corridaId}`);
  };

  /* ── Loading guard ── */
  if (loading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  /* ══════════════ RENDER ══════════════ */
  return (
    <div className="min-h-screen bg-background-secondary">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => router.push('/dashboard/motorista')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="flex-1 text-lg font-bold sm:text-xl">Corridas Disponíveis</h1>

          {/* count badge */}
          {corridas.length > 0 && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-extrabold text-primary">
              {corridas.length}
            </span>
          )}

          {/* disponibilidade indicator */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${disponivel ? 'bg-secondary animate-pulse' : 'bg-accent2'}`}
            />
            <span className="text-[11px] font-semibold">
              {disponivel ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* refresh button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* ── Realtime indicator ── */}
        <div className="mb-4 flex items-center gap-2">
          <Radio size={14} className="text-secondary animate-pulse" />
          <span className="text-xs font-medium text-foreground-muted">
            Atualizações em tempo real
          </span>
        </div>

        {/* ── Loading state ── */}
        {fetching ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="mt-4 text-sm font-medium text-foreground-muted">
              Buscando corridas…
            </p>
          </div>
        ) : corridas.length === 0 ? (
          /* ── Empty state ── */
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center shadow-sm"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
              <MapPin size={40} className="text-primary/30" />
            </div>
            <h2 className="mt-5 text-lg font-bold text-foreground">
              Nenhuma corrida disponível no momento
            </h2>
            <p className="mt-2 max-w-xs text-sm text-foreground-muted">
              Fique atento, novas corridas aparecem em tempo real!
            </p>
            <button
              onClick={handleRefresh}
              className="mt-6 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-light"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </motion.div>
        ) : (
          /* ── Ride cards ── */
          <AnimatePresence mode="popLayout">
            <div className="flex flex-col gap-4">
              {corridas.map((corrida) => (
                <RideCard
                  key={corrida.id}
                  corrida={corrida}
                  onAccept={handleAceitar}
                  accepting={aceitandoId === corrida.id}
                  disabled={aceitandoId !== null}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   RIDE CARD
   ════════════════════════════════════════════════════════════ */

function RideCard({
  corrida,
  onAccept,
  accepting,
  disabled,
}: {
  corrida: CorridaDisponivel;
  onAccept: (id: string) => void;
  accepting: boolean;
  disabled: boolean;
}) {
  const tipo = getTipoConfig(corrida.tipo);

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      {/* Top: type + time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/5 text-lg">
            {tipo.icon}
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">{tipo.label}</p>
            <div className="flex items-center gap-1 text-[11px] text-foreground-muted">
              <Clock size={11} />
              <span>{timeAgo(corrida.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-right">
          <p className="text-lg font-extrabold text-secondary">
            {formatCurrency(corrida.preco_estimado)}
          </p>
          {corrida.distancia_km != null && (
            <p className="text-[11px] text-foreground-muted">
              {corrida.distancia_km.toFixed(1)} km
            </p>
          )}
        </div>
      </div>

      {/* Route */}
      <div className="mt-4 space-y-2">
        <div className="flex items-start gap-2.5">
          <MapPin size={15} className="mt-0.5 shrink-0 text-secondary" />
          <p className="text-sm text-foreground-secondary leading-snug">
            {corrida.origem_endereco}
          </p>
        </div>
        {corrida.destino_endereco && (
          <div className="flex items-start gap-2.5">
            <Navigation size={15} className="mt-0.5 shrink-0 text-accent2" />
            <p className="text-sm text-foreground-secondary leading-snug">
              {corrida.destino_endereco}
            </p>
          </div>
        )}
      </div>

      {/* Passenger + meta */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {corrida.passageiro?.foto_url ? (
            <img
              src={corrida.passageiro.foto_url}
              alt={corrida.passageiro.nome}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {corrida.passageiro?.nome?.charAt(0) ?? '?'}
            </div>
          )}
          <span className="text-sm font-medium text-foreground">
            {corrida.passageiro?.nome ?? 'Passageiro'}
          </span>
        </div>

        {corrida.passageiros > 1 && (
          <div className="flex items-center gap-1 text-xs text-foreground-muted">
            <Users size={13} />
            <span>{corrida.passageiros} passageiros</span>
          </div>
        )}
      </div>

      {/* Observações */}
      {corrida.observacoes && (
        <div className="mt-3 rounded-xl bg-background-secondary px-3 py-2">
          <p className="text-xs text-foreground-muted">{corrida.observacoes}</p>
        </div>
      )}

      {/* Accept button */}
      <button
        onClick={() => onAccept(corrida.id)}
        disabled={accepting || disabled}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-bold text-white shadow-md shadow-secondary/20 transition-all hover:bg-secondary/90 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {accepting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Aceitando…
          </>
        ) : (
          <>
            <CheckCircle2 size={18} />
            Aceitar Corrida
          </>
        )}
      </button>
    </motion.div>
  );
}
