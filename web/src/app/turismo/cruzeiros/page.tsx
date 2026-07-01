'use client';
import PageTitle from '@/components/seo/PageTitle';
import { useTranslation } from '@/components/i18n/LanguageProvider';

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Ship,
  Anchor,
  Clock,
  Users,
  MapPin,
  Navigation,
  CalendarDays,
  Route,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Cruzeiro } from '@/lib/supabase';

// ── Animation ──────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

// ── Helpers ────────────────────────────────────────────────
function formatDateTime(dateStr: string, timeStr: string, asWord: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  const [h, m] = timeStr.split(':');
  return `${date} ${asWord} ${h}:${m}`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function isWithinDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  return d >= now && d <= limit;
}

function isFuture(dateStr: string): boolean {
  return new Date(dateStr + 'T23:59:59') >= new Date();
}

// ── Status helpers ─────────────────────────────────────────
type CruzeiroStatus = Cruzeiro['status'];

const STATUS_CONFIG: Record<CruzeiroStatus, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  confirmado: { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  cancelado: { color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  atrasado: { color: 'text-amber-700', bg: 'bg-amber-100', icon: AlertTriangle },
};

const STATUS_LABEL_KEYS: Record<CruzeiroStatus, string> = {
  confirmado: 'cruzeiros.status_confirmado',
  cancelado: 'cruzeiros.status_cancelado',
  atrasado: 'cruzeiros.status_atrasado',
};

// ── Skeleton ───────────────────────────────────────────────
function Skeleton() {
  const { t } = useTranslation();
  return (
    <div className="animate-pulse rounded-2xl bg-gray-100 overflow-hidden">
        <PageTitle title={t('cruzeiros.page_title')} />
      <div className="h-44 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-10 bg-gray-200 rounded-xl w-full mt-4" />
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────
export default function CruzeirosPage() {
  const { t } = useTranslation();
  const [cruzeiros, setCruzeiros] = useState<Cruzeiro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('cruzeiros')
        .select('*')
        .eq('ativo', true)
        .order('data_chegada', { ascending: true });
      setCruzeiros((data ?? []) as Cruzeiro[]);
      setLoading(false);
    }
    load();
  }, []);

  const proximos = useMemo(
    () => cruzeiros.filter((c) => c.status !== 'cancelado' && isWithinDays(c.data_chegada, 7)),
    [cruzeiros],
  );

  const futuros = useMemo(
    () =>
      cruzeiros.filter(
        (c) => c.status !== 'cancelado' && isFuture(c.data_chegada) && !isWithinDays(c.data_chegada, 7),
      ),
    [cruzeiros],
  );

  const passados = useMemo(
    () => cruzeiros.filter((c) => !isFuture(c.data_chegada) && c.status !== 'cancelado'),
    [cruzeiros],
  );

  const cancelados = useMemo(
    () => cruzeiros.filter((c) => c.status === 'cancelado'),
    [cruzeiros],
  );

  // Total de passageiros esperados nos próximos 7 dias
  const totalPassageirosProximos = useMemo(
    () => proximos.reduce((acc, c) => acc + (c.passageiros ?? 0), 0),
    [proximos],
  );

  // Passageiros por dia (próximos 7 dias)
  const passageirosPorDia = useMemo(() => {
    const map = new Map<string, number>();
    proximos.forEach((c) => {
      const key = formatDateShort(c.data_chegada);
      map.set(key, (map.get(key) ?? 0) + (c.passageiros ?? 0));
    });
    return Array.from(map.entries()).map(([data, total]) => ({ data, total }));
  }, [proximos]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-primary py-24 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-secondary blur-3xl" />
          <div className="absolute bottom-0 left-10 w-96 h-96 rounded-full bg-[#F5A623] blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <Link
            href="/turismo"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('cruzeiros.voltar')}</span>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-semibold tracking-widest uppercase text-[#F5A623] mb-3">
              {t('cruzeiros.terminal_concais')}
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              {t('cruzeiros.hero_titulo_1')}{' '}
              <span className="bg-gradient-to-r from-[#F5A623] to-secondary bg-clip-text text-transparent">
                {t('cruzeiros.hero_titulo_2')}
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">
              {t('cruzeiros.hero_descricao')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats bar (próximos cruzeiros) */}
      {!loading && proximos.length > 0 && (
        <section className="bg-secondary/5 border-b border-secondary/10 py-6 px-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
                <Ship className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('cruzeiros.proximos_7_dias')}</p>
                <p className="text-xl font-bold text-primary">
                  {proximos.length} {proximos.length !== 1 ? t('cruzeiros.cruzeiro_plural') : t('cruzeiros.cruzeiro_singular')}
                  {totalPassageirosProximos > 0 && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      ≈ {totalPassageirosProximos.toLocaleString('pt-BR')} {t('cruzeiros.passageiros')}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {passageirosPorDia.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {passageirosPorDia.map(({ data, total }) => (
                  <div key={data} className="px-3 py-1.5 rounded-xl bg-white border border-gray-100 text-sm">
                    <span className="font-semibold text-primary">{data}</span>
                    <span className="text-gray-400 mx-1">·</span>
                    <span className="text-gray-600">{total.toLocaleString('pt-BR')} {t('cruzeiros.passageiros')}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Content */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : cruzeiros.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <Anchor className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-primary mb-2">{t('cruzeiros.em_breve')}</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {t('cruzeiros.em_breve_desc')}
              </p>
            </motion.div>
          ) : (
            <>
              {/* Próximos Cruzeiros (7 dias) */}
              {proximos.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <Ship className="w-6 h-6 text-secondary" />
                    <h2 className="text-2xl font-bold text-primary">{t('cruzeiros.proximos_cruzeiros')}</h2>
                    <span className="ml-2 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold">
                      {proximos.length}
                    </span>
                  </div>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {proximos.map((c, i) => (
                      <CruzeiroCard key={c.id} cruzeiro={c} index={i} highlight />
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Futuros */}
              {futuros.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <CalendarDays className="w-6 h-6 text-primary" />
                    <h2 className="text-2xl font-bold text-primary">{t('cruzeiros.calendario')}</h2>
                    <span className="ml-2 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {futuros.length}
                    </span>
                  </div>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {futuros.map((c, i) => (
                      <CruzeiroCard key={c.id} cruzeiro={c} index={i} />
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Passados */}
              {passados.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-6 h-6 text-gray-400" />
                    <h2 className="text-2xl font-bold text-gray-500">{t('cruzeiros.anteriores')}</h2>
                  </div>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {passados.map((c, i) => (
                      <CruzeiroCard key={c.id} cruzeiro={c} index={i} past />
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Cancelados */}
              {cancelados.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <XCircle className="w-6 h-6 text-[#E84855]" />
                    <h2 className="text-2xl font-bold text-[#E84855]">{t('cruzeiros.cancelados')}</h2>
                  </div>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {cancelados.map((c, i) => (
                      <CruzeiroCard key={c.id} cruzeiro={c} index={i} past />
                    ))}
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      {!loading && cruzeiros.length > 0 && (
        <section className="py-16 px-6 bg-gradient-to-r from-primary to-secondary">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Navigation className="w-12 h-12 text-[#F5A623] mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">{t('cruzeiros.cta_titulo')}</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              {t('cruzeiros.cta_desc')}
            </p>
            <a
              href="/corrida/solicitar?tipo=transfer_cruzeiro"
              className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-accent-dark text-primary font-bold px-8 py-4 rounded-full transition-colors shadow-lg"
            >
              {t('cruzeiros.reservar_transfer')}
              <ArrowRight className="w-5 h-5" />
            </a>
          </motion.div>
        </section>
      )}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────
function CruzeiroCard({
  cruzeiro,
  index,
  highlight = false,
  past = false,
}: {
  cruzeiro: Cruzeiro;
  index: number;
  highlight?: boolean;
  past?: boolean;
}) {
  const { t } = useTranslation();
  const statusCfg = STATUS_CONFIG[cruzeiro.status] ?? STATUS_CONFIG.confirmado;
  const StatusIcon = statusCfg.icon;

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className={`group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white ${
        highlight ? 'ring-2 ring-secondary/40' : ''
      } ${past ? 'opacity-70' : ''}`}
    >
      {/* Header gradient */}
      <div className="relative h-36 bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center overflow-hidden">
        <Ship className="w-14 h-14 text-white/20 group-hover:scale-110 transition-transform" />
        {/* Status badge */}
        <span
          className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${statusCfg.bg} ${statusCfg.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {t(STATUS_LABEL_KEYS[cruzeiro.status] ?? 'cruzeiros.status_confirmado')}
        </span>
        {/* Passageiros */}
        {cruzeiro.passageiros && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl text-xs font-bold bg-white/90 text-primary flex items-center gap-1">
            <Users className="w-3 h-3" />
            {cruzeiro.passageiros.toLocaleString('pt-BR')}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Navio */}
        <h3 className="text-lg font-bold text-primary mb-0.5">{cruzeiro.navio}</h3>
        <p className="text-sm text-gray-400 mb-3">{cruzeiro.companhia}</p>

        {/* Chegada */}
        <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
          <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 text-secondary" />
          <div>
            <span className="font-medium">{t('cruzeiros.chegada')}</span>{' '}
            {formatDateTime(cruzeiro.data_chegada, cruzeiro.hora_chegada, t('cruzeiros.as'))}
          </div>
        </div>

        {/* Saída */}
        <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
          <Clock className="w-4 h-4 shrink-0 mt-0.5 text-[#F5A623]" />
          <div>
            <span className="font-medium">{t('cruzeiros.saida')}</span>{' '}
            {formatDateTime(cruzeiro.data_saida, cruzeiro.hora_saida, t('cruzeiros.as'))}
          </div>
        </div>

        {/* Porto */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>{cruzeiro.porto}</span>
        </div>

        {/* Rota */}
        {cruzeiro.rota && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <Route className="w-4 h-4 shrink-0" />
            <span className="line-clamp-1">{cruzeiro.rota}</span>
          </div>
        )}

        {/* CTA */}
        {!past && cruzeiro.status !== 'cancelado' && (
          <a
            href="/corrida/solicitar?tipo=transfer_cruzeiro"
            className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-light text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors w-full"
          >
            <Navigation className="w-4 h-4" />
            {t('cruzeiros.reservar_transfer')}
          </a>
        )}
      </div>
    </motion.div>
  );
}
