'use client';

import SeoMeta from '@/components/seo/SeoMeta';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Car,
  Clock,
  FileText,
  Download,
  Calendar,
  Percent,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

/* ══════════════════════════════════════════════════════════
   TIPOS
   ══════════════════════════════════════════════════════════ */
type Periodo = 'hoje' | 'semana' | 'mes' | 'ano';

interface Metricas {
  faturamento: number;
  corridas: number;
  ticket: number;
  tempo_online: number;
  tendencia: number; // % up/down
}

interface CorridaRecente {
  id: string;
  data: string;
  tipo: string;
  valor: number;
  comissao: number;
  liquido: number;
  status: 'concluida' | 'cancelada' | 'em_andamento';
}

/* ══════════════════════════════════════════════════════════
   FALLBACK DATA
   ══════════════════════════════════════════════════════════ */
const FALLBACK_METRICAS: Metricas = {
  faturamento: 1280.5,
  corridas: 34,
  ticket: 37.66,
  tempo_online: 8.5,
  tendencia: 15,
};

const FALLBACK_GRAFICO: number[] = [180, 220, 150, 95, 240, 310, 85];

const FALLBACK_CORRIDAS: CorridaRecente[] = [
  {
    id: 'c1',
    data: new Date(Date.now() - 2 * 3600000).toISOString(),
    tipo: 'UberX',
    valor: 42.5,
    comissao: 8.5,
    liquido: 34.0,
    status: 'concluida',
  },
  {
    id: 'c2',
    data: new Date(Date.now() - 5 * 3600000).toISOString(),
    tipo: 'Comfort',
    valor: 78.9,
    comissao: 15.78,
    liquido: 63.12,
    status: 'concluida',
  },
  {
    id: 'c3',
    data: new Date(Date.now() - 8 * 3600000).toISOString(),
    tipo: 'UberX',
    valor: 27.3,
    comissao: 5.46,
    liquido: 21.84,
    status: 'concluida',
  },
  {
    id: 'c4',
    data: new Date(Date.now() - 11 * 3600000).toISOString(),
    tipo: 'Moto',
    valor: 15.0,
    comissao: 3.0,
    liquido: 12.0,
    status: 'concluida',
  },
  {
    id: 'c5',
    data: new Date(Date.now() - 14 * 3600000).toISOString(),
    tipo: 'Black',
    valor: 68.75,
    comissao: 13.75,
    liquido: 55.0,
    status: 'em_andamento',
  },
];

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mês' },
  { key: 'ano', label: 'Ano' },
];

const DIAS_LABEL = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/* ══════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════ */
function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ══════════════════════════════════════════════════════════
   CARD DE MÉTRICA
   ══════════════════════════════════════════════════════════ */
function MetricaCard({
  icon: Icon,
  label,
  valor,
  sub,
  accent = '#0A2463',
  index,
}: {
  icon: typeof DollarSign;
  label: string;
  valor: string;
  sub?: React.ReactNode;
  accent?: string;
  index: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-1 truncate text-2xl font-extrabold text-primary">
            {valor}
          </p>
          {sub && <div className="mt-1.5 text-xs">{sub}</div>}
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ backgroundColor: accent }}
        >
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   GRÁFICO DE BARRAS (CSS puro)
   ══════════════════════════════════════════════════════════ */
function GraficoBarras({ valores }: { valores: number[] }) {
  const max = Math.max(...valores, 1);

  return (
    <div className="flex h-48 items-end gap-2">
      {valores.map((v, i) => {
        const pct = Math.round((v / max) * 100);
        const isPeak = v === max;
        return (
          <div
            key={i}
            className="flex flex-1 flex-col items-center justify-end gap-1.5"
          >
            <span className="text-[10px] font-bold text-gray-500">
              {v > 0 ? `R$${v}` : ''}
            </span>
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: `${Math.max(pct, 4)}%` }}
              viewport={{ once: true }}
              transition={{
                duration: 0.7,
                delay: i * 0.06,
                ease: 'easeOut',
              }}
              className={`w-full rounded-t-md ${
                isPeak
                  ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                  : 'bg-gradient-to-t from-[#14A76C] to-[#3ed496]'
              }`}
              style={{ minHeight: 4 }}
            />
            <span className="text-[10px] font-semibold text-gray-400">
              {DIAS_LABEL[i] ?? `D${i + 1}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   BARRA DE BREAKDOWN HORIZONTAL
   ══════════════════════════════════════════════════════════ */
function BreakdownBar({
  label,
  valor,
  pct,
  cor,
  index,
}: {
  label: string;
  valor: string;
  pct: number;
  cor: string;
  index: number;
}) {
  return (
    <motion.div variants={fadeUp} custom={index}>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="font-extrabold text-primary">{valor}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.1 }}
          className="h-full rounded-full"
          style={{ backgroundColor: cor }}
        />
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   BADGE DE STATUS DA CORRIDA
   ══════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: CorridaRecente['status'] }) {
  const map = {
    concluida: {
      label: 'Concluída',
      cls: 'bg-[#14A76C]/10 text-[#0d7a4f]',
    },
    cancelada: {
      label: 'Cancelada',
      cls: 'bg-[#E84855]/10 text-[#E84855]',
    },
    em_andamento: {
      label: 'Em andamento',
      cls: 'bg-[#F5A623]/10 text-[#B97A1A]',
    },
  } as const;

  const info = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${info.cls}`}
    >
      {info.label}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════
   SKELETON
   ══════════════════════════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-7 w-28 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */
export default function FinanceiroPage() {
  const { user } = useAuth();
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [grafico, setGrafico] = useState<number[]>([]);
  const [corridas, setCorridas] = useState<CorridaRecente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        // Tenta buscar dados reais do Supabase; fallback se não houver dados
        const [metricasRes, corridasRes] = await Promise.allSettled([
          supabase
            .from('financeiro_metricas')
            .select('*')
            .eq('user_id', user?.id ?? '')
            .eq('periodo', periodo)
            .maybeSingle(),
          supabase
            .from('corridas')
            .select('*')
            .eq('user_id', user?.id ?? '')
            .order('created_at', { ascending: false })
            .limit(5),
        ]);

        if (!active) return;

        const metricaData =
          metricasRes.status === 'fulfilled' && metricasRes.value.data
            ? (metricasRes.value.data as Metricas)
            : null;

        setMetricas(metricaData ?? FALLBACK_METRICAS);
        setGrafico(FALLBACK_GRAFICO);

        const corridasData =
          corridasRes.status === 'fulfilled' && corridasRes.value.data?.length
            ? (corridasRes.value.data as CorridaRecente[])
            : FALLBACK_CORRIDAS;
        setCorridas(corridasData);
      } catch {
        if (!active) return;
        setMetricas(FALLBACK_METRICAS);
        setGrafico(FALLBACK_GRAFICO);
        setCorridas(FALLBACK_CORRIDAS);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [user?.id, periodo]);

  /* ─── breakdown de comissão (calculado das métricas) ─── */
  const breakdown = useMemo(() => {
    const faturamento = metricas?.faturamento ?? FALLBACK_METRICAS.faturamento;
    const valorPassageiro = faturamento;
    const comissao = faturamento * 0.2; // 20% comissão plataforma
    const liquido = faturamento - comissao;
    const total = valorPassageiro || 1;
    return {
      valorPassageiro,
      comissao,
      liquido,
      pctPassageiro: 100,
      pctComissao: (comissao / total) * 100,
      pctLiquido: (liquido / total) * 100,
    };
  }, [metricas]);

  const tendencia = metricas?.tendencia ?? FALLBACK_METRICAS.tendencia;
  const tendenciaPositiva = tendencia >= 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <SeoMeta title='Painel Financeiro Pro' description='Dashboard financeiro avançado para motoristas DNA: ganhos, gráficos, exportação PDF/Excel e breakdown de comissão.' />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 to-emerald-700 px-4 pb-10 pt-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/premium"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
                Painel Financeiro Pro
              </h1>
              <p className="mt-0.5 text-sm text-white/80">
                Controle total dos seus ganhos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CONTEÚDO ─── */}
      <main className="mx-auto -mt-4 max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* ─── Seletor de período ─── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm"
        >
          <div className="flex items-center gap-1.5 px-2 text-xs font-semibold text-gray-400">
            <Calendar size={14} />
            Período
          </div>
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                periodo === p.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </motion.div>

        {/* ─── Grid de métricas ─── */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {loading || !metricas ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <MetricaCard
                index={0}
                icon={DollarSign}
                label="Faturamento Bruto"
                valor={formatarMoeda(metricas.faturamento)}
                accent="#14A76C"
                sub={
                  <span
                    className={`inline-flex items-center gap-1 font-bold ${
                      tendenciaPositiva ? 'text-[#14A76C]' : 'text-[#E84855]'
                    }`}
                  >
                    {tendenciaPositiva ? (
                      <TrendingUp size={13} />
                    ) : (
                      <TrendingDown size={13} />
                    )}
                    {tendenciaPositiva ? '+' : ''}
                    {tendencia}%
                    <span className="font-normal text-gray-400">
                      vs período anterior
                    </span>
                  </span>
                }
              />
              <MetricaCard
                index={1}
                icon={Car}
                label="Corridas"
                valor={String(metricas.corridas)}
                accent="#0A2463"
                sub={
                  <span className="text-gray-500">
                    no período selecionado
                  </span>
                }
              />
              <MetricaCard
                index={2}
                icon={Percent}
                label="Ticket Médio"
                valor={formatarMoeda(metricas.ticket)}
                accent="#F5A623"
                sub={
                  <span className="text-gray-500">valor médio por corrida</span>
                }
              />
              <MetricaCard
                index={3}
                icon={Clock}
                label="Tempo Online"
                valor={`${metricas.tempo_online.toFixed(1)}h`}
                accent="#E84855"
                sub={
                  <span className="text-gray-500">horas ativas</span>
                }
              />
            </>
          )}
        </motion.div>

        {/* ─── Gráfico + Breakdown ─── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Gráfico de barras — últimos 7 dias */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-bold text-primary">
                  <BarChart3 size={18} />
                  Faturamento — últimos 7 dias
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Valores em reais por dia da semana
                </p>
              </div>
            </div>
            <GraficoBarras valores={grafico.length ? grafico : FALLBACK_GRAFICO} />
          </motion.div>

          {/* Breakdown de comissão */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-primary">
              <Percent size={18} />
              Breakdown de comissão
            </h2>
            <p className="mb-5 text-xs text-gray-500">
              Como seu faturamento é distribuído
            </p>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="space-y-4"
            >
              <BreakdownBar
                index={0}
                label="Valor do passageiro"
                valor={formatarMoeda(breakdown.valorPassageiro)}
                pct={breakdown.pctPassageiro}
                cor="#0A2463"
              />
              <BreakdownBar
                index={1}
                label="Comissão da plataforma (20%)"
                valor={formatarMoeda(breakdown.comissao)}
                pct={breakdown.pctComissao}
                cor="#E84855"
              />
              <BreakdownBar
                index={2}
                label="Seu ganho líquido"
                valor={formatarMoeda(breakdown.liquido)}
                pct={breakdown.pctLiquido}
                cor="#14A76C"
              />
            </motion.div>

            <div className="mt-5 rounded-xl bg-[#14A76C]/10 px-4 py-3">
              <p className="text-sm font-bold text-[#0d7a4f]">
                💰 Você fica com{' '}
                {(
                  (breakdown.liquido / (breakdown.valorPassageiro || 1)) *
                  100
                ).toFixed(0)}
                % do valor pago pelo passageiro
              </p>
            </div>
          </motion.div>
        </div>

        {/* ─── Botões de exportação ─── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="flex flex-wrap gap-3"
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#E84855] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <FileText size={16} />
            Exportar PDF
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#14A76C] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Download size={16} />
            Exportar Excel
          </button>
        </motion.div>

        {/* ─── Tabela de últimas corridas ─── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-bold text-primary">
              <Car size={18} />
              Últimas corridas
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              As 5 corridas mais recentes do período
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-bold">Data</th>
                  <th className="px-5 py-3 font-bold">Tipo</th>
                  <th className="px-5 py-3 text-right font-bold">Valor</th>
                  <th className="px-5 py-3 text-right font-bold">Comissão</th>
                  <th className="px-5 py-3 text-right font-bold">Líquido</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {corridas.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-50 transition last:border-0 hover:bg-gray-50/50"
                  >
                    <td className="px-5 py-3">
                      <div className="font-semibold text-gray-700">
                        {formatarData(c.data)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatarHora(c.data)}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-bold text-primary">
                        {c.tipo}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-700">
                      {formatarMoeda(c.valor)}
                    </td>
                    <td className="px-5 py-3 text-right text-[#E84855]">
                      −{formatarMoeda(c.comissao)}
                    </td>
                    <td className="px-5 py-3 text-right font-extrabold text-[#14A76C]">
                      {formatarMoeda(c.liquido)}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-4 sm:hidden">
            {corridas.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-100 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-bold text-primary">
                    {c.tipo}
                  </span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {formatarData(c.data)} · {formatarHora(c.data)}
                  </span>
                </div>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      Líquido
                    </p>
                    <p className="font-extrabold text-[#14A76C]">
                      {formatarMoeda(c.liquido)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      Valor · Comissão
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatarMoeda(c.valor)} ·{' '}
                      <span className="text-[#E84855]">
                        −{formatarMoeda(c.comissao)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Footer info ─── */}
        <p className="pt-2 text-center text-xs text-gray-400">
          💡 Dados ilustrativos. Conecte sua conta para ver valores reais.
        </p>
      </main>
    </div>
  );
}
