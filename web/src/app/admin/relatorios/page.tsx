'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Car,
  Receipt,
  Percent,
  CalendarDays,
  BarChart3,
  DollarSign,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  supabase,
  formatarBRL,
  CORRIDA_STATUS_LABELS,
  TRANSACAO_TIPO_LABELS,
} from '@/lib/supabase';
import type {
  RelatorioCorrida,
  RelatorioFinanceiro,
  CorridaStatus,
  TransacaoTipo,
} from '@/lib/supabase';

/* ─── animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

/* ─── Period filter ─── */
type Periodo = '7d' | '30d' | '90d' | 'tudo';
const PERIODO_OPTIONS: { value: Periodo; label: string }[] = [
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
  { value: '90d', label: '90 dias' },
  { value: 'tudo', label: 'Tudo' },
];

function periodoToDate(periodo: Periodo): string | null {
  if (periodo === 'tudo') return null;
  const d = new Date();
  const days = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90;
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

/* ════════════════════════════════════════════════════════════ */
/*  Page Component                                            */
/* ════════════════════════════════════════════════════════════ */
export default function AdminRelatoriosPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [corridas, setCorridas] = useState<RelatorioCorrida[]>([]);
  const [financeiro, setFinanceiro] = useState<RelatorioFinanceiro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>('30d');

  /* ── Auth guard ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== 'admin') {
      router.replace('/entrar');
    }
  }, [user, profile, authLoading, router]);

  /* ── Fetch data ── */
  const fetchData = useCallback(async () => {
    if (!user || profile?.role !== 'admin') return;
    setCarregando(true);

    const dataInicio = periodoToDate(periodo);

    let corridasQuery = supabase
      .from('relatorio_corridas')
      .select('*')
      .order('data', { ascending: false });
    if (dataInicio) corridasQuery = corridasQuery.gte('data', dataInicio);

    let finQuery = supabase
      .from('relatorio_financeiro')
      .select('*')
      .order('data', { ascending: false });
    if (dataInicio) finQuery = finQuery.gte('data', dataInicio);

    const [corridasRes, finRes] = await Promise.all([corridasQuery, finQuery]);

    if (corridasRes.data) setCorridas(corridasRes.data as RelatorioCorrida[]);
    if (finRes.data) setFinanceiro(finRes.data as RelatorioFinanceiro[]);

    setCarregando(false);
  }, [user, profile, periodo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Summary ── */
  const resumo = useMemo(() => {
    const faturamentoTotal = corridas.reduce((a, c) => a + Number(c.faturamento), 0);
    const corridasTotal = corridas.reduce((a, c) => a + Number(c.total), 0);
    const ticketMedio = corridasTotal > 0 ? faturamentoTotal / corridasTotal : 0;

    const taxaTotal = financeiro.reduce((a, f) => a + Number(f.taxas_total), 0);
    const brutoTotal = financeiro.reduce((a, f) => a + Number(f.valor_bruto_total), 0);
    const taxaMedia = brutoTotal > 0 ? (taxaTotal / brutoTotal) * 100 : 0;

    return { faturamentoTotal, corridasTotal, ticketMedio, taxaMedia };
  }, [corridas, financeiro]);

  /* ── Loading / auth ── */
  if (authLoading || !profile) {
    return <LoadingSkeleton />;
  }

  if (profile.role !== 'admin') return null;

  return (
    <div className="space-y-8">
      <PageTitle title='Relatorios' />
      {/* ═══ Header ═══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-primary" />
            Relatórios e Métricas
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Acompanhe faturamento, corridas e indicadores financeiros
          </p>
        </div>
      </motion.div>

      {/* ═══ Period filter ═══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-foreground-muted" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
            Período:
          </span>
          <div className="flex gap-2">
            {PERIODO_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  periodo === p.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-background-tertiary text-foreground-secondary hover:bg-border-strong/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══ Summary Cards ═══ */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={2}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <SummaryCard
          label="Faturamento Total"
          value={formatarBRL(resumo.faturamentoTotal)}
          icon={<DollarSign size={20} className="text-secondary" />}
          iconBg="bg-secondary/10"
        />
        <SummaryCard
          label="Corridas Total"
          value={resumo.corridasTotal.toLocaleString('pt-BR')}
          icon={<Car size={20} className="text-primary" />}
          iconBg="bg-primary/10"
        />
        <SummaryCard
          label="Ticket Médio"
          value={formatarBRL(resumo.ticketMedio)}
          icon={<TrendingUp size={20} className="text-accent-dark" />}
          iconBg="bg-accent/10"
        />
        <SummaryCard
          label="Taxa Média"
          value={`${resumo.taxaMedia.toFixed(1)}%`}
          icon={<Percent size={20} className="text-accent2" />}
          iconBg="bg-accent2/10"
        />
      </motion.div>

      {/* ═══ Corridas por dia ═══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground-muted">
          Corridas por Dia
        </h2>
        {carregando ? (
          <TableSkeleton cols={5} rows={5} />
        ) : corridas.length === 0 ? (
          <EmptyState icon={<Car size={40} />} message="Nenhuma corrida no período" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background-tertiary/50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-foreground-muted">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-foreground-muted">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-foreground-muted">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-foreground-muted">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-foreground-muted">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {corridas.map((c, i) => {
                  const statusInfo = CORRIDA_STATUS_LABELS[c.status as CorridaStatus];
                  return (
                    <motion.tr
                      key={`${c.data}-${c.tipo}-${c.status}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/50 last:border-0 transition hover:bg-primary/[0.02]"
                    >
                      <td className="px-4 py-3 text-foreground-secondary">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-foreground-muted" />
                          {new Date(c.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{c.tipo}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${statusInfo?.bg ?? 'bg-background-tertiary'} ${statusInfo?.color ?? 'text-foreground-muted'}`}>
                          {statusInfo?.label ?? c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">{Number(c.total)}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-secondary">{formatarBRL(Number(c.faturamento))}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ═══ Financeiro ═══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground-muted">
          Relatório Financeiro
        </h2>
        {carregando ? (
          <TableSkeleton cols={6} rows={5} />
        ) : financeiro.length === 0 ? (
          <EmptyState icon={<Receipt size={40} />} message="Nenhuma transação no período" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface-elevated shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background-tertiary/50">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-foreground-muted">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-foreground-muted">Tipo</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-foreground-muted">Transações</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-foreground-muted">Valor Bruto</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-foreground-muted">Taxas</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase text-foreground-muted">Líquido</th>
                </tr>
              </thead>
              <tbody>
                {financeiro.map((f, i) => {
                  const tipoInfo = TRANSACAO_TIPO_LABELS[f.tipo as TransacaoTipo];
                  return (
                    <motion.tr
                      key={`${f.data}-${f.tipo}-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/50 last:border-0 transition hover:bg-primary/[0.02]"
                    >
                      <td className="px-4 py-3 text-foreground-secondary">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={13} className="text-foreground-muted" />
                          {new Date(f.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="text-base">{tipoInfo?.icon ?? '📊'}</span>
                          {tipoInfo?.label ?? f.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-foreground">{Number(f.total_transacoes)}</td>
                      <td className="px-4 py-3 text-right text-foreground-secondary">{formatarBRL(Number(f.valor_bruto_total))}</td>
                      <td className="px-4 py-3 text-right text-accent2 font-semibold">{formatarBRL(Number(f.taxas_total))}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-secondary">{formatarBRL(Number(f.liquido_total))}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
/*  Sub-components                                            */
/* ════════════════════════════════════════════════════════════ */

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
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-extrabold text-foreground">{value}</p>
          <p className="text-[11px] font-medium text-foreground-muted">{label}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-8 text-center shadow-sm">
      <div className="mx-auto text-foreground-muted/40">{icon}</div>
      <p className="mt-3 font-semibold text-foreground-secondary">{message}</p>
    </div>
  );
}

function TableSkeleton({ cols, rows }: { cols: number; rows: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-5 flex-1 animate-pulse rounded bg-background-tertiary" />
          ))}
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-72 rounded-xl animate-pulse bg-surface-elevated" />
        <div className="h-4 w-48 rounded-lg animate-pulse bg-surface-elevated" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface-elevated" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-surface-elevated" />
      <div className="h-64 animate-pulse rounded-2xl bg-surface-elevated" />
    </div>
  );
}
