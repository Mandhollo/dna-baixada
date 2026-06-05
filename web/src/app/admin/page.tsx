'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Users,
  Car,
  DollarSign,
  Megaphone,
  ArrowRight,
  Store,
  BarChart3,
  Settings,
  Activity,
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  supabase,
  formatarBRL,
  type AdminStats,
  type Corrida,
  type LogAdmin,
  CORRIDA_STATUS_LABELS,
  CORRIDA_TIPOS,
  type CorridaStatus,
  type CorridaTipo,
} from '@/lib/supabase';

/* ─── animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ═══════════════════════════════════════════════════════════
   Admin Dashboard Page
   ═══════════════════════════════════════════════════════════ */
export default function AdminDashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [corridasRecentes, setCorridasRecentes] = useState<Corrida[]>([]);
  const [logsRecentes, setLogsRecentes] = useState<LogAdmin[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  /* ── Auth guard ── */
  useEffect(() => {
    if (loading) return;
    if (!user || profile?.role !== 'admin') {
      router.replace('/entrar');
    }
  }, [user, profile, loading, router]);

  /* ── Fetch data ── */
  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;

    const fetchData = async () => {
      setLoadingData(true);

      const [statsRes, corridasRes, logsRes] = await Promise.all([
        supabase.from('admin_stats').select('*').limit(1).single(),
        supabase
          .from('corridas')
          .select('id, tipo, status, preco_final, preco_estimado, passageiros, created_at, passageiro:profiles!corridas_passageiro_id_fkey(nome)')
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('logs_admin')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (statsRes.data) setStats(statsRes.data as AdminStats);
      if (corridasRes.data) setCorridasRecentes(corridasRes.data as unknown as Corrida[]);
      if (logsRes.data) setLogsRecentes(logsRes.data as LogAdmin[]);

      setLoadingData(false);
    };

    fetchData();
  }, [user, profile]);

  /* ── Loading skeleton ── */
  if (loading || loadingData) {
    return <LoadingSkeleton />;
  }

  if (!user || profile?.role !== 'admin') return null;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* ── Header ── */}
      <motion.div variants={fadeUp} custom={0} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
            Painel Administrativo
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Bem-vindo de volta, {profile?.nome?.split(' ')[0]} — DNA Baixada
          </p>
        </div>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20"
        >
          <ShieldCheck className="h-4 w-4" />
          Sair
        </button>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div variants={staggerContainer} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={1}
          icon={Users}
          label="Usuários"
          value={stats?.total_usuarios ?? 0}
          color="primary"
          subtitle={`${stats?.total_passageiros ?? 0} passageiros · ${stats?.total_motoristas ?? 0} motoristas`}
        />
        <StatCard
          index={2}
          icon={Car}
          label="Corridas"
          value={stats?.total_corridas ?? 0}
          color="secondary"
          subtitle={`${stats?.corridas_concluidas ?? 0} concluídas · ${stats?.corridas_ativas ?? 0} ativas`}
        />
        <StatCard
          index={3}
          icon={DollarSign}
          label="Faturamento"
          value={formatarBRL(stats?.faturamento_total ?? 0)}
          color="accent"
          subtitle="Receita total acumulada"
          isText
        />
        <StatCard
          index={4}
          icon={Megaphone}
          label="Campanhas Ativas"
          value={stats?.campanhas_ativas ?? 0}
          color="accent2"
          subtitle={`${stats?.total_participacoes ?? 0} participações · ${stats?.pontos_distribuidos ?? 0} pts`}
        />
      </motion.div>

      {/* ── Two-column: Corridas Recentes + Atividade Recente ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Corridas Recentes */}
        <motion.div variants={fadeUp} custom={4} className="rounded-2xl border border-border bg-surface-elevated shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Car className="h-5 w-5 text-secondary" />
              Corridas Recentes
            </h2>
            <Link href="/admin/relatorios" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {corridasRecentes.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-foreground-muted">
                Nenhuma corrida registrada
              </div>
            ) : (
              corridasRecentes.map((corrida) => (
                <CorridaRow key={corrida.id} corrida={corrida} />
              ))
            )}
          </div>
        </motion.div>

        {/* Atividade Recente (logs) */}
        <motion.div variants={fadeUp} custom={5} className="rounded-2xl border border-border bg-surface-elevated shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
              <Activity className="h-5 w-5 text-accent-dark" />
              Atividade Recente
            </h2>
            <span className="text-xs font-medium text-foreground-muted">Logs do sistema</span>
          </div>
          <div className="divide-y divide-border">
            {logsRecentes.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-foreground-muted">
                Nenhuma atividade registrada
              </div>
            ) : (
              logsRecentes.map((log) => (
                <LogRow key={log.id} log={log} />
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Quick Actions ── */}
      <motion.div variants={fadeUp} custom={6}>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground-muted">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/admin/usuarios"
            icon={Users}
            label="Gerenciar Usuários"
            description="Passageiros, motoristas e parceiros"
            color="primary"
          />
          <QuickAction
            href="/admin/parceiros"
            icon={Store}
            label="Estabelecimentos"
            description="Parceiros comerciais e campanhas"
            color="secondary"
          />
          <QuickAction
            href="/admin/relatorios"
            icon={BarChart3}
            label="Relatórios"
            description="Financeiro e operacional"
            color="accent"
          />
          <QuickAction
            href="/admin/config"
            icon={Settings}
            label="Configurações"
            description="Taxas, sistema e parâmetros"
            color="accent2"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Stat Card
   ═══════════════════════════════════════════════════════════ */
function StatCard({
  index,
  icon: Icon,
  label,
  value,
  color,
  subtitle,
  isText = false,
}: {
  index: number;
  icon: React.ElementType;
  label: string;
  value: number | string;
  color: 'primary' | 'secondary' | 'accent' | 'accent2';
  subtitle: string;
  isText?: boolean;
}) {
  const colorMap = {
    primary: {
      bg: 'bg-primary/8 border-primary/15',
      iconBg: 'bg-primary/12',
      iconText: 'text-primary',
      valueText: 'text-primary',
    },
    secondary: {
      bg: 'bg-secondary/8 border-secondary/15',
      iconBg: 'bg-secondary/12',
      iconText: 'text-secondary',
      valueText: 'text-secondary-dark',
    },
    accent: {
      bg: 'bg-accent/8 border-accent/15',
      iconBg: 'bg-accent/12',
      iconText: 'text-accent-dark',
      valueText: 'text-accent-dark',
    },
    accent2: {
      bg: 'bg-accent2/8 border-accent2/15',
      iconBg: 'bg-accent2/12',
      iconText: 'text-accent2',
      valueText: 'text-accent2',
    },
  };

  const c = colorMap[color];

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className={`rounded-2xl border ${c.bg} p-5 transition hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
            {label}
          </p>
          <p className={`mt-2 text-2xl font-extrabold ${c.valueText}`}>
            {isText ? value : (value as number).toLocaleString('pt-BR')}
          </p>
          <p className="mt-1 text-xs text-foreground-muted">{subtitle}</p>
        </div>
        <div className={`rounded-xl ${c.iconBg} p-3`}>
          <Icon className={`h-6 w-6 ${c.iconText}`} />
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Corrida Row
   ═══════════════════════════════════════════════════════════ */
function CorridaRow({ corrida }: { corrida: Corrida }) {
  const statusInfo = CORRIDA_STATUS_LABELS[corrida.status as CorridaStatus];
  const tipoInfo = CORRIDA_TIPOS.find((t) => t.value === corrida.tipo);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const passageiroNome = (corrida as any).passageiro
    ? ((corrida as any).passageiro as { nome?: string })?.nome ?? '—'
    : '—';

  return (
    <div className="flex items-center gap-4 px-6 py-3.5 hover:bg-background-secondary/50 transition">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/10 text-lg shrink-0">
        {tipoInfo?.icon ?? '🚗'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {passageiroNome}
        </p>
        <p className="text-xs text-foreground-muted">
          {tipoInfo?.label ?? corrida.tipo}
        </p>
      </div>
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo?.color ?? ''} ${statusInfo?.bg ?? 'bg-background-tertiary'}`}>
        {statusInfo?.label ?? corrida.status}
      </span>
      <span className="text-sm font-bold text-foreground-secondary whitespace-nowrap">
        {corrida.preco_final
          ? formatarBRL(corrida.preco_final)
          : corrida.preco_estimado
            ? formatarBRL(corrida.preco_estimado)
            : '—'}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Log Row
   ═══════════════════════════════════════════════════════════ */
function LogRow({ log }: { log: LogAdmin }) {
  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  return (
    <div className="flex items-start gap-3 px-6 py-3.5 hover:bg-background-secondary/50 transition">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/8">
        <AlertCircle className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          {log.acao}
          <span className="ml-2 text-xs text-foreground-muted">
            em <span className="font-semibold">{log.tabela}</span>
          </span>
        </p>
        {log.registro_id && (
          <p className="text-xs text-foreground-muted font-mono">
            ID: {log.registro_id.slice(0, 8)}…
          </p>
        )}
      </div>
      <span className="flex items-center gap-1 text-xs text-foreground-muted whitespace-nowrap">
        <Clock className="h-3 w-3" />
        {timeAgo(log.created_at)}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Quick Action
   ═══════════════════════════════════════════════════════════ */
function QuickAction({
  href,
  icon: Icon,
  label,
  description,
  color,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
  color: 'primary' | 'secondary' | 'accent' | 'accent2';
}) {
  const gradientMap = {
    primary: 'from-primary to-primary-light',
    secondary: 'from-secondary to-secondary-light',
    accent: 'from-accent-dark to-accent',
    accent2: 'from-accent2 to-accent2-light',
  };
  const shadowMap = {
    primary: 'shadow-primary/20',
    secondary: 'shadow-secondary/20',
    accent: 'shadow-accent/20',
    accent2: 'shadow-accent2/20',
  };

  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientMap[color]} p-5 text-white shadow-lg ${shadowMap[color]} transition-all hover:-translate-y-1 hover:shadow-xl`}
    >
      <Icon className="absolute -right-3 -top-3 h-16 w-16 opacity-10 transition group-hover:opacity-20" />
      <Icon className="h-6 w-6" />
      <h3 className="mt-3 font-bold">{label}</h3>
      <p className="mt-1 text-sm text-white/80">{description}</p>
      <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 opacity-0 transition group-hover:opacity-60" />
    </Link>
  );
}

/* ═══════════════════════════════════════════════════════════
   Loading Skeleton
   ═══════════════════════════════════════════════════════════ */
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-72 rounded-xl shimmer" />
          <div className="h-4 w-48 rounded-lg shimmer" />
        </div>
        <div className="h-10 w-24 rounded-xl shimmer" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface-elevated p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 rounded-lg shimmer" />
                <div className="h-8 w-28 rounded-xl shimmer" />
                <div className="h-3 w-36 rounded-lg shimmer" />
              </div>
              <div className="h-12 w-12 rounded-xl shimmer" />
            </div>
          </div>
        ))}
      </div>

      {/* Table skeletons */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface-elevated overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <div className="h-5 w-40 rounded-lg shimmer" />
            </div>
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex items-center gap-4 px-6 py-3.5">
                <div className="h-9 w-9 rounded-xl shimmer shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-32 rounded-lg shimmer" />
                  <div className="h-3 w-24 rounded-lg shimmer" />
                </div>
                <div className="h-6 w-20 rounded-full shimmer" />
                <div className="h-4 w-16 rounded-lg shimmer" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-surface-elevated p-5 border border-border">
            <div className="h-6 w-6 rounded-lg shimmer" />
            <div className="mt-3 h-5 w-32 rounded-lg shimmer" />
            <div className="mt-2 h-3 w-40 rounded-lg shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}
