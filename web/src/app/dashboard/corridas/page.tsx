'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Car,
  Plane,
  Ship,
  Hotel,
  Bus,
  Map,
  Camera,
  Star,
  ChevronDown,
  LayoutDashboard,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  Navigation,
  Inbox,
  Route,
  Leaf,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  supabase,
  formatarBRL,
  CORRIDA_STATUS_LABELS,
  CORRIDA_TIPOS,
} from '@/lib/supabase';
import type {
  Corrida,
  CorridaStatus,
  CorridaTipo,
} from '@/lib/supabase';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const },
  }),
};

/* ─── Icon map for CorridaTipo ─── */
const TIPO_ICON: Record<CorridaTipo, React.ElementType> = {
  urbana: Car,
  executivo: Star,
  eletrico_hibrido: Leaf,
  transfer_aeroporto: Plane,
  transfer_rodoviaria: Bus,
  transfer_hotel: Hotel,
  transfer_cruzeiro: Ship,
  city_tour: Map,
  passeio_turistico: Camera,
};

/* ─── Status icon map ─── */
const STATUS_ICON: Record<CorridaStatus, React.ElementType> = {
  aguardando: Clock,
  aceita: Navigation,
  motorista_chegou: MapPin,
  em_andamento: Loader2,
  finalizada: CheckCircle2,
  cancelada: XCircle,
};

/* ─── Status filter tabs ─── */
const STATUS_TABS: { value: CorridaStatus | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'finalizada', label: 'Finalizadas' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'aguardando', label: 'Pendentes' },
  { value: 'cancelada', label: 'Canceladas' },
];

/* ─── Pagination page size ─── */
const PAGE_SIZE = 15;

/* ════════════════════════════════════════════════════════════ */
/*  Page Component                                            */
/* ════════════════════════════════════════════════════════════ */
export default function CorridasPassageiroPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [corridas, setCorridas] = useState<Corrida[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<CorridaStatus | 'todas'>('todas');
  const [limite, setLimite] = useState(PAGE_SIZE);
  const [totalCorridas, setTotalCorridas] = useState(0);

  /* ── Auth guard ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== 'passageiro') {
      router.replace('/entrar');
    }
  }, [user, profile, authLoading, router]);

  /* ── Fetch corridas ── */
  const fetchCorridas = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const { data, error, count } = await supabase
      .from('corridas')
      .select('*, motorista:profiles!motorista_id(nome)', { count: 'exact' })
      .eq('passageiro_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCorridas(data as Corrida[]);
      setTotalCorridas(count ?? data.length);
    }
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    fetchCorridas();
  }, [fetchCorridas]);

  /* ── Filtered list ── */
  const filtradas = useMemo(() => {
    return corridas.filter((c) => {
      if (filtroStatus !== 'todas' && c.status !== filtroStatus) return false;
      return true;
    });
  }, [corridas, filtroStatus]);

  /* ── Paginated list ── */
  const paginadas = useMemo(() => filtradas.slice(0, limite), [filtradas, limite]);
  const temMais = limite < filtradas.length;

  /* ── Summary stats ── */
  const stats = useMemo(() => {
    const total = corridas.length;
    const finalizadas = corridas.filter((c) => c.status === 'finalizada').length;
    const canceladas = corridas.filter((c) => c.status === 'cancelada').length;
    const emAndamento = corridas.filter(
      (c) => c.status === 'em_andamento' || c.status === 'aceita' || c.status === 'aguardando'
    ).length;
    return { total, finalizadas, canceladas, emAndamento };
  }, [corridas]);

  /* ── Load more ── */
  const carregarMais = () => {
    setCarregandoMais(true);
    setTimeout(() => {
      setLimite((prev) => prev + PAGE_SIZE);
      setCarregandoMais(false);
    }, 400);
  };

  /* ── Loading state ── */
  if (authLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <PageTitle title='Minhas Corridas' />
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary pb-24">
      <PageTitle title='Minhas Corridas' />

      {/* ═══ Header ═══ */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Passageiro
            </p>
            <h1 className="text-lg font-bold sm:text-xl">Minhas Corridas</h1>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
            aria-label="Dashboard"
          >
            <LayoutDashboard size={20} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {/* ═══ Stats ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <StatCard
            label="Total"
            value={String(stats.total)}
            icon={<Route size={18} className="text-primary" />}
            iconBg="bg-primary/10"
          />
          <StatCard
            label="Em andamento"
            value={String(stats.emAndamento)}
            icon={<Loader2 size={18} className="text-secondary" />}
            iconBg="bg-secondary/10"
          />
          <StatCard
            label="Finalizadas"
            value={String(stats.finalizadas)}
            icon={<CheckCircle2 size={18} className="text-primary" />}
            iconBg="bg-primary/10"
          />
          <StatCard
            label="Canceladas"
            value={String(stats.canceladas)}
            icon={<XCircle size={18} className="text-accent2" />}
            iconBg="bg-accent2/10"
          />
        </motion.div>

        {/* ═══ Filters ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mt-6"
        >
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-2">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setFiltroStatus(tab.value);
                    setLimite(PAGE_SIZE);
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                    filtroStatus === tab.value
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-elevated text-foreground-secondary border border-border hover:border-border-strong'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ═══ Corrida List ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mt-4"
        >
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="mt-4 text-sm text-foreground-muted">
                Carregando corridas...
              </p>
            </div>
          ) : paginadas.length === 0 ? (
            /* ── Empty state ── */
            <div className="rounded-2xl border border-border bg-surface-elevated p-10 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
                <Inbox size={32} className="text-primary/40" />
              </div>
              <p className="mt-4 text-base font-bold text-foreground-secondary">
                Nenhuma corrida encontrada
              </p>
              <p className="mt-1 text-sm text-foreground-muted">
                {corridas.length === 0
                  ? 'Suas corridas aparecerão aqui conforme forem realizadas.'
                  : 'Tente ajustar os filtros acima.'}
              </p>
              {corridas.length === 0 && (
                <button
                  onClick={() => router.push('/corrida/solicitar')}
                  className="mt-5 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary-dark hover:shadow-lg"
                >
                  Solicitar Corrida
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paginadas.map((corrida, i) => (
                <CorridaCard
                  key={corrida.id}
                  corrida={corrida}
                  index={i}
                  onClick={() => router.push(`/corrida/${corrida.id}`)}
                />
              ))}

              {/* ── Load more ── */}
              {temMais && (
                <div className="pt-2">
                  <button
                    onClick={carregarMais}
                    disabled={carregandoMais}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface-elevated px-6 py-3 text-sm font-bold text-foreground-secondary transition hover:border-border-strong hover:shadow-sm disabled:opacity-50"
                  >
                    {carregandoMais ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        Carregar mais ({filtradas.length - limite} restantes)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
/*  Sub-components                                            */
/* ════════════════════════════════════════════════════════════ */

/* ─── Stat Card ─── */
function StatCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-3 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-foreground">{value}</p>
          <p className="text-[10px] font-medium text-foreground-muted">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Corrida Card ─── */
function CorridaCard({
  corrida,
  index,
  onClick,
}: {
  corrida: Corrida;
  index: number;
  onClick: () => void;
}) {
  const tipoConfig = CORRIDA_TIPOS.find((t) => t.value === corrida.tipo);
  const statusConfig = CORRIDA_STATUS_LABELS[corrida.status];
  const TipoIcon = TIPO_ICON[corrida.tipo];
  const StatusIcon = STATUS_ICON[corrida.status];

  const preco = corrida.preco_final ?? corrida.preco_estimado ?? 0;

  const dataFormatada = new Date(corrida.created_at).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: 'short', year: 'numeric' }
  );

  const horaFormatada = new Date(corrida.created_at).toLocaleTimeString(
    'pt-BR',
    { hour: '2-digit', minute: '2-digit' }
  );

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: 'easeOut' }}
      className="w-full rounded-2xl border border-border bg-surface-elevated p-4 text-left shadow-sm transition hover:border-border-strong hover:shadow-md active:scale-[0.99]"
    >
      {/* Top row: tipo + status + preco */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5">
            <TipoIcon size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">
              {tipoConfig?.label ?? 'Corrida'}
            </p>
            <span
              className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusConfig.bg} ${statusConfig.color}`}
            >
              <StatusIcon
                size={10}
                className={corrida.status === 'em_andamento' ? 'animate-spin' : ''}
              />
              {statusConfig.label}
            </span>
          </div>
        </div>
        <p className="shrink-0 text-base font-extrabold text-foreground">
          {formatarBRL(preco)}
        </p>
      </div>

      {/* Route: origem -> destino */}
      <div className="mt-3 space-y-1">
        <div className="flex items-start gap-2">
          <MapPin size={13} className="mt-0.5 shrink-0 text-secondary" />
          <p className="truncate text-xs text-foreground-secondary">
            {corrida.origem_endereco}
          </p>
        </div>
        {corrida.destino_endereco && (
          <div className="flex items-start gap-2">
            <MapPin size={13} className="mt-0.5 shrink-0 text-accent2" />
            <p className="truncate text-xs text-foreground-secondary">
              {corrida.destino_endereco}
            </p>
          </div>
        )}
      </div>

      {/* Bottom row: date + motorista */}
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2">
        <p className="text-[10px] font-medium text-foreground-muted">
          {dataFormatada} às {horaFormatada}
        </p>
        {corrida.motorista && (
          <p className="text-[10px] font-medium text-foreground-muted">
            Motorista: {(corrida.motorista as { nome: string })?.nome ?? '—'}
          </p>
        )}
      </div>
    </motion.button>
  );
}
