'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  Receipt,
  Wallet,
  Banknote,
  CircleDollarSign,
  Tag,
  Gift,
  ArrowRightLeft,
  Star,
  ChevronDown,
  LayoutDashboard,
  Car,
  ArrowDownToLine,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  RotateCcw,
  CalendarDays,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  supabase,
  formatarBRL,
  TRANSACAO_TIPO_LABELS,
  TRANSACAO_STATUS_LABELS,
} from '@/lib/supabase';
import type {
  Transacao,
  TransacaoTipo,
  TransacaoStatus,
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

/* ─── Icon map for TransacaoTipo (lucide-react, no emojis) ─── */
const TIPO_ICON: Record<TransacaoTipo, React.ElementType> = {
  pagamento_corrida: CreditCard,
  repasse_motorista: CircleDollarSign,
  taxa_plataforma: Receipt,
  bonus: Gift,
  ajuste: ArrowRightLeft,
  resgate_pontos: Star,
  cupom_desconto: Tag,
};

/* ─── Status icon ─── */
const STATUS_ICON: Record<TransacaoStatus, React.ElementType> = {
  pendente: Clock,
  processando: Loader2,
  concluido: CheckCircle2,
  falhou: XCircle,
  estornado: RotateCcw,
};

/* ─── Filter options ─── */
const TIPO_FILTROS: { value: TransacaoTipo | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'repasse_motorista', label: 'Repasses' },
  { value: 'taxa_plataforma', label: 'Taxas' },
  { value: 'bonus', label: 'Bônus' },
  { value: 'pagamento_corrida', label: 'Pagamentos' },
  { value: 'ajuste', label: 'Ajustes' },
  { value: 'resgate_pontos', label: 'Resgates' },
  { value: 'cupom_desconto', label: 'Cupons' },
];

const STATUS_FILTROS: { value: TransacaoStatus | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'concluido', label: 'Concluídos' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'processando', label: 'Processando' },
  { value: 'falhou', label: 'Falharam' },
  { value: 'estornado', label: 'Estornados' },
];

/* ════════════════════════════════════════════════════════════ */
/*  Page Component                                            */
/* ════════════════════════════════════════════════════════════ */
export default function FinanceiroPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<TransacaoTipo | 'todos'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<TransacaoStatus | 'todos'>('todos');
  const [showFiltros, setShowFiltros] = useState(false);

  /* ── Auth guard ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== 'motorista') {
      router.replace('/entrar');
    }
  }, [user, profile, authLoading, router]);

  /* ── Fetch transacoes ── */
  const fetchTransacoes = useCallback(async () => {
    if (!user) return;
    setCarregando(true);
    const { data, error } = await supabase
      .from('transacoes')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTransacoes(data as Transacao[]);
    }
    setCarregando(false);
  }, [user]);

  useEffect(() => {
    fetchTransacoes();
  }, [fetchTransacoes]);

  /* ── Summary values ── */
  const resumo = useMemo(() => {
    const ganhoTotal = transacoes
      .filter((t) => t.tipo === 'repasse_motorista' && t.status === 'concluido')
      .reduce((acc, t) => acc + t.valor_liquido, 0);

    const pendente = transacoes
      .filter((t) => t.tipo === 'repasse_motorista' && t.status === 'pendente')
      .reduce((acc, t) => acc + t.valor_liquido, 0);

    const taxas = transacoes
      .filter((t) => t.tipo === 'taxa_plataforma' && t.status === 'concluido')
      .reduce((acc, t) => acc + t.valor_bruto, 0);

    return { ganhoTotal, pendente, taxas };
  }, [transacoes]);

  /* ── Filtered list ── */
  const filtradas = useMemo(() => {
    return transacoes.filter((t) => {
      if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false;
      if (filtroStatus !== 'todos' && t.status !== filtroStatus) return false;
      return true;
    });
  }, [transacoes, filtroTipo, filtroStatus]);

  /* ── Loading state ── */
  if (authLoading || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
      <PageTitle title='Financeiro' />
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
            <h1 className="text-lg font-bold sm:text-xl">Financeiro</h1>
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
        {/* ═══ Summary Cards ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {/* Ganho Total */}
          <SummaryCard
            label="Ganho Total"
            value={formatarBRL(resumo.ganhoTotal)}
            icon={<TrendingUp size={22} className="text-secondary" />}
            iconBg="bg-secondary/10"
          />
          {/* Pendente */}
          <SummaryCard
            label="Pendente"
            value={formatarBRL(resumo.pendente)}
            icon={<Clock size={22} className="text-accent-dark" />}
            iconBg="bg-accent/10"
          />
          {/* Taxas Pagas */}
          <SummaryCard
            label="Taxas Pagas"
            value={formatarBRL(resumo.taxas)}
            icon={<Receipt size={22} className="text-accent2" />}
            iconBg="bg-accent2/10"
          />
        </motion.div>

        {/* ═══ Solicitar Saque ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mt-6"
        >
          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-secondary to-secondary-light px-6 py-4 text-base font-bold text-white shadow-lg shadow-secondary/20 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
            onClick={() => {
              /* placeholder — futuramente abre modal de saque */
              alert('Solicitação de saque será implementada em breve.');
            }}
          >
            <Banknote size={22} />
            Solicitar Saque
          </button>
        </motion.div>

        {/* ═══ Filtros ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={2}
          className="mt-8"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">
              Transações
            </h2>
            <button
              onClick={() => setShowFiltros(!showFiltros)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                showFiltros
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-surface-elevated text-foreground-secondary hover:border-border-strong'
              }`}
            >
              <Filter size={14} />
              Filtros
              <ChevronDown
                size={14}
                className={`transition-transform ${showFiltros ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          <AnimatePresence>
            {showFiltros && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-4 rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
                  {/* Tipo filter */}
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                      Tipo
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {TIPO_FILTROS.map((f) => (
                        <FilterChip
                          key={f.value}
                          label={f.label}
                          active={filtroTipo === f.value}
                          onClick={() => setFiltroTipo(f.value)}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Status filter */}
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                      Status
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_FILTROS.map((f) => (
                        <FilterChip
                          key={f.value}
                          label={f.label}
                          active={filtroStatus === f.value}
                          onClick={() => setFiltroStatus(f.value)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ═══ Transaction List ═══ */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={3}
          className="mt-4"
        >
          {carregando ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="mt-4 text-sm text-foreground-muted">
                Carregando transações...
              </p>
            </div>
          ) : filtradas.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface-elevated p-8 text-center shadow-sm">
              <Wallet size={40} className="mx-auto text-foreground-muted/40" />
              <p className="mt-3 font-semibold text-foreground-secondary">
                Nenhuma transação encontrada
              </p>
              <p className="mt-1 text-sm text-foreground-muted">
                {transacoes.length === 0
                  ? 'Suas transações aparecerão aqui.'
                  : 'Tente ajustar os filtros acima.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtradas.map((t, i) => (
                <TransacaoCard key={t.id} transacao={t} index={i} />
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══ Bottom Nav ═══ */}
      <BottomNav />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
/*  Sub-components                                            */
/* ════════════════════════════════════════════════════════════ */

/* ─── Summary Card ─── */
function SummaryCard({
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
    <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold text-foreground">
            {value}
          </p>
          <p className="text-[11px] font-medium text-foreground-muted">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Filter Chip ─── */
function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'bg-primary text-white shadow-sm'
          : 'bg-background-tertiary text-foreground-secondary hover:bg-border-strong/30'
      }`}
    >
      {label}
    </button>
  );
}

/* ─── Transaction Card ─── */
function TransacaoCard({
  transacao,
  index,
}: {
  transacao: Transacao;
  index: number;
}) {
  const tipoConfig = TRANSACAO_TIPO_LABELS[transacao.tipo];
  const statusConfig = TRANSACAO_STATUS_LABELS[transacao.status];
  const TipoIcon = TIPO_ICON[transacao.tipo];
  const StatusIcon = STATUS_ICON[transacao.status];

  const isRepasse = transacao.tipo === 'repasse_motorista' || transacao.tipo === 'bonus';
  const valorClasse = isRepasse ? 'text-secondary' : 'text-accent2';

  const dataFormatada = new Date(transacao.created_at).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: 'short', year: 'numeric' }
  );

  const horaFormatada = new Date(transacao.created_at).toLocaleTimeString(
    'pt-BR',
    { hour: '2-digit', minute: '2-digit' }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: 'easeOut' }}
      className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5`}
        >
          <TipoIcon size={20} className={tipoConfig.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">
                {transacao.descricao || tipoConfig.label}
              </p>
              <p className="text-xs text-foreground-muted">{tipoConfig.label}</p>
            </div>
            <p className={`shrink-0 text-sm font-extrabold ${valorClasse}`}>
              {isRepasse ? '+' : '-'}
              {formatarBRL(transacao.valor_liquido)}
            </p>
          </div>

          {/* Status + Date row */}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusConfig.bg} ${statusConfig.color}`}
            >
              <StatusIcon
                size={10}
                className={transacao.status === 'processando' ? 'animate-spin' : ''}
              />
              {statusConfig.label}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-foreground-muted">
              <CalendarDays size={11} />
              {dataFormatada} {horaFormatada}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

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
          active
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
