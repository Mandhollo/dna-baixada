'use client';

import SeoMeta from '@/components/seo/SeoMeta';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  TrendingUp,
  Calendar,
  Ship,
  Trophy,
  ShoppingBag,
  Clock,
  Flame,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { DemandaRegiao, DemandaEvento, DemandaEventoTipo } from '@/lib/supabase';
import { DEMANDA_EVENTO_TIPO_LABELS } from '@/lib/supabase';

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

/* ─── ícone por tipo de evento ─── */
const ICON_BY_TIPO: Record<DemandaEventoTipo, typeof Ship> = {
  cruzeiro: Ship,
  jogo: Trophy,
  feira: ShoppingBag,
  show: Flame,
  congresso: AlertCircle,
  feriado: Calendar,
  clima: AlertCircle,
  transito: AlertCircle,
  outro: AlertCircle,
};

/* ══════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════ */

/** retorna dias/hoje (ISO) somando X dias */
function diasFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

/** cor da barra de nível de demanda (0-100) */
function getNivelCor(nivel: number): { bg: string; text: string; hex: string } {
  if (nivel > 70) return { bg: 'bg-[#E84855]', text: 'text-[#E84855]', hex: '#E84855' };
  if (nivel >= 40) return { bg: 'bg-[#F5A623]', text: 'text-[#F5A623]', hex: '#F5A623' };
  return { bg: 'bg-[#14A76C]', text: 'text-[#14A76C]', hex: '#14A76C' };
}

/** formata data: DD/MM/AAAA */
function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** retorna texto relativo (em X dias / hoje / amanhã) */
function dataRelativa(iso: string): string {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(iso);
  alvo.setHours(0, 0, 0, 0);
  const diff = Math.round((alvo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  return `Em ${diff} dias`;
}

/* ══════════════════════════════════════════════════════════
   FALLBACK DATA
   ══════════════════════════════════════════════════════════ */
const FALLBACK_REGIOES: DemandaRegiao[] = [
  {
    id: 'r1',
    nome: 'Centro de Santos',
    cidade: 'Santos',
    bairro: 'Centro',
    latitude: -23.9608,
    longitude: -46.3331,
    raio_km: 2,
    nivel_demanda: 75,
    demanda_por_hora: {},
    melhores_horarios: ['08h', '18h', '19h'],
    fatores: ['Porto', 'Shopping', 'Bancos'],
    evento_proximo: null,
    evento_fim: null,
    aumento_turismo_percentual: 0,
    cor_hex: '#E84855',
    ativo: true,
  },
  {
    id: 'r2',
    nome: 'Gonzaga',
    cidade: 'Santos',
    bairro: 'Gonzaga',
    latitude: -23.9696,
    longitude: -46.3254,
    raio_km: 1.5,
    nivel_demanda: 70,
    demanda_por_hora: {},
    melhores_horarios: ['18h', '19h'],
    fatores: ['Shopping', 'Hoteis', 'Restaurantes'],
    evento_proximo: null,
    evento_fim: null,
    aumento_turismo_percentual: 0,
    cor_hex: '#E84855',
    ativo: true,
  },
  {
    id: 'r3',
    nome: 'Praia Grande — Oriçanga',
    cidade: 'Praia Grande',
    bairro: 'Oriçanga',
    latitude: -24.0092,
    longitude: -46.4056,
    raio_km: 2,
    nivel_demanda: 65,
    demanda_por_hora: {},
    melhores_horarios: ['17h', '18h'],
    fatores: ['Shopping', 'Praia'],
    evento_proximo: null,
    evento_fim: null,
    aumento_turismo_percentual: 0,
    cor_hex: '#F5A623',
    ativo: true,
  },
  {
    id: 'r4',
    nome: 'Guarujá — Pitangueiras',
    cidade: 'Guarujá',
    bairro: 'Pitangueiras',
    latitude: -23.9819,
    longitude: -46.2543,
    raio_km: 2,
    nivel_demanda: 60,
    demanda_por_hora: {},
    melhores_horarios: ['17h', '18h', '19h'],
    fatores: ['Praia', 'Hoteis', 'Turismo'],
    evento_proximo: null,
    evento_fim: null,
    aumento_turismo_percentual: 0,
    cor_hex: '#F5A623',
    ativo: true,
  },
  {
    id: 'r5',
    nome: 'São Vicente Centro',
    cidade: 'São Vicente',
    bairro: 'Centro',
    latitude: -23.9629,
    longitude: -46.3922,
    raio_km: 1.5,
    nivel_demanda: 55,
    demanda_por_hora: {},
    melhores_horarios: ['17h', '18h'],
    fatores: ['Estação', 'Comércio'],
    evento_proximo: null,
    evento_fim: null,
    aumento_turismo_percentual: 0,
    cor_hex: '#F5A623',
    ativo: true,
  },
];

const FALLBACK_EVENTOS: DemandaEvento[] = [
  {
    id: 'e1',
    nome: 'Chegada de Cruzeiro — MSC',
    descricao: 'Navio MSC Seaview atraca no Concais com cerca de 4 mil passageiros.',
    cidade: 'Santos',
    local: 'Concais (Terminal de Cruzeiros)',
    latitude: null,
    longitude: null,
    data_inicio: diasFromNow(2),
    data_fim: null,
    tipo: 'cruzeiro',
    aumento_demanda_percentual: 45,
    corridas_estimadas: 350,
    recomendacao: 'Fique perto do Concais às 8h',
    ativo: true,
  },
  {
    id: 'e2',
    nome: 'Jogo no Estádio',
    descricao: 'Santos FC joga na Vila Belmiro — público esperado de 15 mil.',
    cidade: 'Santos',
    local: 'Vila Belmiro',
    latitude: null,
    longitude: null,
    data_inicio: diasFromNow(5),
    data_fim: null,
    tipo: 'jogo',
    aumento_demanda_percentual: 80,
    corridas_estimadas: 500,
    recomendacao: 'Posicione 1h antes do jogo',
    ativo: true,
  },
  {
    id: 'e3',
    nome: 'Feira de Santos',
    descricao: 'Feira de artesanato e gastronomia na orla de Santos.',
    cidade: 'Santos',
    local: 'Orla da Praia',
    latitude: null,
    longitude: null,
    data_inicio: diasFromNow(3),
    data_fim: null,
    tipo: 'feira',
    aumento_demanda_percentual: 25,
    corridas_estimadas: 120,
    recomendacao: 'Pico: sábado à tarde',
    ativo: true,
  },
];

/* ══════════════════════════════════════════════════════════
   CARD DE REGIÃO
   ══════════════════════════════════════════════════════════ */
function RegiaoCard({ regiao, index }: { regiao: DemandaRegiao; index: number }) {
  const nivel = regiao.nivel_demanda;
  const cor = getNivelCor(nivel);
  const altoNivel = nivel > 70;

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className={`relative overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
        altoNivel ? 'ring-2 ring-[#E84855]/30' : 'border border-gray-100'
      }`}
    >
      {/* faixa de cor no topo */}
      <div className={`h-1.5 w-full ${cor.bg}`} />

      <div className="p-5">
        {/* ─── Header ─── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: regiao.cor_hex || cor.hex }}
            >
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight text-primary">
                {regiao.nome}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} />
                {regiao.cidade}
                {regiao.bairro ? `/${regiao.bairro}` : ''}
              </p>
            </div>
          </div>

          {altoNivel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E84855]/10 px-2.5 py-1 text-[10px] font-bold text-[#E84855]">
              <Flame size={11} />
              ALTA
            </span>
          )}
        </div>

        {/* ─── Barra de nível de demanda ─── */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-600">Nível de demanda</span>
            <span className={`font-extrabold ${cor.text}`}>{nivel}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${nivel}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: index * 0.05 }}
              className={`h-full rounded-full ${cor.bg}`}
            />
          </div>
        </div>

        {/* ─── Melhores horários ─── */}
        {regiao.melhores_horarios && regiao.melhores_horarios.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <Clock size={12} />
              Melhores horários
            </p>
            <div className="flex flex-wrap gap-1.5">
              {regiao.melhores_horarios.map((h) => (
                <span
                  key={h}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary"
                >
                  <Clock size={11} />
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── Fatores ─── */}
        {regiao.fatores && regiao.fatores.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Fatores
            </p>
            <div className="flex flex-wrap gap-1.5">
              {regiao.fatores.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─── Evento próximo (badge) ─── */}
        {regiao.evento_proximo && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#F5A623]/10 px-3 py-2 text-xs">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-[#F5A623]" />
            <div>
              <span className="font-bold text-[#B97A1A]">Evento próximo: </span>
              <span className="text-gray-700">{regiao.evento_proximo}</span>
              {regiao.evento_fim && (
                <span className="text-gray-500"> · até {formatarData(regiao.evento_fim)}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   CARD DE EVENTO
   ══════════════════════════════════════════════════════════ */
function EventoCard({ evento, index }: { evento: DemandaEvento; index: number }) {
  const tipoInfo = DEMANDA_EVENTO_TIPO_LABELS[evento.tipo];
  const Icon = ICON_BY_TIPO[evento.tipo] ?? AlertCircle;
  const corTipo = tipoInfo?.color ?? '#0A2463';
  const aumento = evento.aumento_demanda_percentual;
  const aumentoAlto = aumento >= 50;

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl border border-gray-100"
    >
      {/* faixa de cor */}
      <div className="h-1.5 w-full" style={{ backgroundColor: corTipo }} />

      <div className="p-5">
        {/* ─── Header ─── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
              style={{ backgroundColor: corTipo }}
            >
              <Icon size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold leading-tight text-primary">
                {evento.nome}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} />
                {evento.cidade}
                {evento.local ? `/${evento.local}` : ''}
              </p>
            </div>
          </div>

          {/* badge do tipo */}
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: `${corTipo}15`, color: corTipo }}
          >
            <Icon size={11} />
            {tipoInfo?.label ?? evento.tipo}
          </span>
        </div>

        {/* ─── Data ─── */}
        <div className="mt-4 flex items-center gap-2 text-sm">
          <Calendar size={14} className="text-gray-400" />
          <span className="font-semibold text-gray-700">{formatarData(evento.data_inicio)}</span>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
            {dataRelativa(evento.data_inicio)}
          </span>
        </div>

        {/* ─── Aumento previsto + corridas estimadas ─── */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div
            className={`rounded-xl p-3 text-center ${
              aumentoAlto ? 'bg-[#E84855]/10' : 'bg-[#F5A623]/10'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Aumento previsto
            </p>
            <p
              className={`mt-0.5 text-2xl font-extrabold ${
                aumentoAlto ? 'text-[#E84855]' : 'text-[#F5A623]'
              }`}
            >
              +{aumento}%
            </p>
          </div>
          <div className="rounded-xl bg-primary/5 p-3 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Corridas estimadas
            </p>
            <p className="mt-0.5 text-2xl font-extrabold text-primary">
              {evento.corridas_estimadas ?? '—'}
            </p>
          </div>
        </div>

        {/* ─── Recomendação ─── */}
        {evento.recomendacao && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#14A76C]/10 px-3 py-2.5">
            <TrendingUp size={15} className="mt-0.5 shrink-0 text-[#14A76C]" />
            <p className="text-sm font-bold text-[#0d7a4f]">{evento.recomendacao}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   SKELETON
   ══════════════════════════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="h-1.5 w-full animate-pulse bg-gray-200" />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-gray-200" />
          <div className="flex-1">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
        <div className="mt-4 h-2.5 w-full animate-pulse rounded-full bg-gray-100" />
        <div className="mt-3 flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */
export default function DemandaPage() {
  const { user } = useAuth();
  const [regioes, setRegioes] = useState<DemandaRegiao[]>([]);
  const [eventos, setEventos] = useState<DemandaEvento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      supabase
        .from('demanda_regioes')
        .select('*')
        .eq('ativo', true)
        .order('nivel_demanda', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) setRegioes(data as DemandaRegiao[]);
        }),
      supabase
        .from('demanda_eventos')
        .select('*')
        .eq('ativo', true)
        .order('data_inicio', { ascending: true })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) setEventos(data as DemandaEvento[]);
        }),
    ]).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [user]);

  const listaRegioes = useMemo(
    () => (regioes.length > 0 ? regioes : FALLBACK_REGIOES),
    [regioes],
  );
  const listaEventos = useMemo(
    () => (eventos.length > 0 ? eventos : FALLBACK_EVENTOS),
    [eventos],
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SeoMeta title='Previsão de Demanda' description='Mapa de previsão de demanda para motoristas DNA: regiões com maior procura, eventos, cruzeiros e clima em tempo real.' />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 px-6 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 top-10 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-red-300 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Link
              href="/premium"
              className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur transition hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Premium
            </Link>

            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              DNA Inteligência
            </motion.span>

            <h1 className="mt-4 text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              Previsão de Demanda
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85">
              Saiba onde e quando os passageiros estão.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ REGIÕES COM MAIOR DEMANDA AGORA ═══ */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="mb-10"
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary md:text-3xl">
                  Regiões com Maior Demanda AGORA
                </h2>
                <p className="text-sm text-gray-500">
                  Atualizado em tempo real — posicione-se nas áreas quentes.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {listaRegioes.map((r, i) => (
                <RegiaoCard key={r.id} regiao={r} index={i} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══ EVENTOS PRÓXIMOS ═══ */}
      <section className="bg-gray-50 px-6 py-16 border-t border-gray-100">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="mb-10"
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-[#0d2d73] text-white shadow-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary md:text-3xl">
                  Eventos Próximos
                </h2>
                <p className="text-sm text-gray-500">
                  Oportunidades de pico de corridas nos próximos dias.
                </p>
              </div>
            </motion.div>
          </motion.div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {listaEventos.map((e, i) => (
                <EventoCard key={e.id} evento={e} index={i} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══ RODAPÉ INFORMATIVO ═══ */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl bg-primary/5 p-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-gray-600">
            Dados de demanda são estimativas baseadas em histórico de corridas, eventos
            confirmados, calendário de cruzeiros e tendências sazonais da Baixada Santista.
          </p>
        </div>
      </section>
    </div>
  );
}
