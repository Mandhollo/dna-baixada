'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  Navigation,
  Filter,
  Sparkles,
  Loader2,
  Ticket,
  CircleDollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import type { Evento, EventoCategoria } from '@/lib/supabase';
import { EVENTO_CATEGORIA_LABELS } from '@/lib/supabase';

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
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(timeStr?: string | null): string | null {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':');
  return `${h}:${m}`;
}

function isUpcoming(dateStr: string): boolean {
  const d = new Date(dateStr + 'T23:59:59');
  return d >= new Date();
}

function isWithinDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr + 'T23:59:59');
  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  return d >= new Date() && d <= limit;
}

const categoriaKeys = Object.keys(EVENTO_CATEGORIA_LABELS) as EventoCategoria[];

const categoriaColors: Record<EventoCategoria, string> = {
  show: 'bg-purple-100 text-purple-700',
  feira: 'bg-amber-100 text-amber-700',
  festival: 'bg-pink-100 text-pink-700',
  exposicao: 'bg-blue-100 text-blue-700',
  esportivo: 'bg-green-100 text-green-700',
  religioso: 'bg-indigo-100 text-indigo-700',
  cultural: 'bg-teal-100 text-teal-700',
  gastronomico: 'bg-orange-100 text-orange-700',
  comunitario: 'bg-cyan-100 text-cyan-700',
};

// ── Skeleton ───────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse rounded-2xl bg-gray-100 overflow-hidden">
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
export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<EventoCategoria | 'todos'>('todos');
  const [filtroMes, setFiltroMes] = useState<number | 'todos'>('todos');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('eventos')
        .select('*')
        .eq('ativo', true)
        .order('data_inicio', { ascending: true });
      setEventos((data ?? []) as Evento[]);
      setLoading(false);
    }
    load();
  }, []);

  // Available months from data
  const availableMonths = useMemo(() => {
    const meses = new Set<number>();
    eventos.forEach((e) => {
      const m = new Date(e.data_inicio + 'T12:00:00').getMonth();
      meses.add(m);
    });
    return Array.from(meses).sort();
  }, [eventos]);

  const filtered = useMemo(() => {
    return eventos.filter((e) => {
      if (filtroCategoria !== 'todos' && e.categoria !== filtroCategoria) return false;
      if (filtroMes !== 'todos') {
        const m = new Date(e.data_inicio + 'T12:00:00').getMonth();
        if (m !== filtroMes) return false;
      }
      return true;
    });
  }, [eventos, filtroCategoria, filtroMes]);

  const upcoming = filtered.filter((e) => isWithinDays(e.data_inicio, 7));
  const rest = filtered.filter((e) => !isWithinDays(e.data_inicio, 7));

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2463] via-[#0d2d73] to-[#14A76C] py-24 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-80 h-80 rounded-full bg-[#F5A623] blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#14A76C] blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <Link
            href="/turismo"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Voltar para Turismo</span>
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-sm font-semibold tracking-widest uppercase text-[#F5A623] mb-3">
              Agenda Cultural
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
              Eventos na{' '}
              <span className="bg-gradient-to-r from-[#F5A623] to-[#14A76C] bg-clip-text text-transparent">
                Baixada Santista
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/80">
              Shows, festivais, feiras e eventos culturais. Fique por dentro de tudo que acontece
              na região.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2 text-[#0A2463] font-semibold">
            <Filter className="w-5 h-5" />
            <span>Filtros:</span>
          </div>

          {/* Categoria */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroCategoria('todos')}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filtroCategoria === 'todos'
                  ? 'bg-[#0A2463] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {categoriaKeys.map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltroCategoria(cat)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  filtroCategoria === cat
                    ? 'bg-[#0A2463] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {EVENTO_CATEGORIA_LABELS[cat].label}
              </button>
            ))}
          </div>

          {/* Mês */}
          <select
            value={filtroMes}
            onChange={(e) =>
              setFiltroMes(e.target.value === 'todos' ? 'todos' : Number(e.target.value))
            }
            className="px-3 py-1.5 rounded-xl text-sm border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0A2463]/20"
          >
            <option value="todos">Todos os meses</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {MONTHS[m]}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-24"
            >
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-[#0A2463] mb-2">Em breve</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Nenhum evento encontrado com os filtros selecionados. Novos eventos estão chegando!
              </p>
              {(filtroCategoria !== 'todos' || filtroMes !== 'todos') && (
                <button
                  onClick={() => {
                    setFiltroCategoria('todos');
                    setFiltroMes('todos');
                  }}
                  className="mt-6 px-6 py-2 rounded-full bg-[#0A2463] text-white text-sm font-semibold hover:bg-[#0d2d73] transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </motion.div>
          ) : (
            <>
              {/* Próximos 7 dias */}
              {upcoming.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-6 h-6 text-[#F5A623]" />
                    <h2 className="text-2xl font-bold text-[#0A2463]">Acontecendo em breve</h2>
                    <span className="ml-2 px-2.5 py-0.5 rounded-full bg-[#F5A623]/10 text-[#F5A623] text-xs font-bold">
                      {upcoming.length}
                    </span>
                  </div>
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {upcoming.map((evento, i) => (
                      <EventoCard key={evento.id} evento={evento} index={i} highlight />
                    ))}
                  </motion.div>
                </div>
              )}

              {/* Demais eventos */}
              {rest.length > 0 && (
                <div>
                  {upcoming.length > 0 && (
                    <div className="flex items-center gap-2 mb-6">
                      <Calendar className="w-6 h-6 text-[#0A2463]" />
                      <h2 className="text-2xl font-bold text-[#0A2463]">Mais eventos</h2>
                    </div>
                  )}
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={stagger}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {rest.map((evento, i) => (
                      <EventoCard key={evento.id} evento={evento} index={i} />
                    ))}
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      {filtered.length > 0 && (
        <section className="py-16 px-6 bg-gradient-to-r from-[#0A2463] to-[#14A76C]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <Navigation className="w-12 h-12 text-[#F5A623] mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">Precisa de transporte?</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">
              Solicite uma corrida e chegue com conforto e segurança a qualquer evento da região.
            </p>
            <a
              href="/corrida/solicitar"
              className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#e6951c] text-[#0A2463] font-bold px-8 py-4 rounded-full transition-colors shadow-lg"
            >
              Como Chegar
              <Navigation className="w-5 h-5" />
            </a>
          </motion.div>
        </section>
      )}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────
function EventoCard({ evento, index, highlight = false }: { evento: Evento; index: number; highlight?: boolean }) {
  const isFuture = isUpcoming(evento.data_inicio);

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className={`group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white ${
        highlight ? 'ring-2 ring-[#F5A623]/40' : ''
      }`}
    >
      {/* Image / Placeholder */}
      <div className="relative h-44 bg-gradient-to-br from-[#0A2463] to-[#14A76C] flex items-center justify-center overflow-hidden">
        {evento.foto_url ? (
          <img
            src={evento.foto_url}
            alt={evento.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Calendar className="w-14 h-14 text-white/30 group-hover:scale-110 transition-transform" />
        )}
        {/* Category badge */}
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-xl text-xs font-bold ${
            categoriaColors[evento.categoria] ?? 'bg-gray-100 text-gray-700'
          }`}
        >
          {EVENTO_CATEGORIA_LABELS[evento.categoria]?.label ?? evento.categoria}
        </span>
        {/* Gratuito / Preço badge */}
        {evento.gratuito ? (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#14A76C] text-white flex items-center gap-1">
            <Ticket className="w-3 h-3" />
            Grátis
          </span>
        ) : evento.preco ? (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#F5A623] text-[#0A2463] flex items-center gap-1">
            <CircleDollarSign className="w-3 h-3" />
            {evento.preco}
          </span>
        ) : null}
        {/* Highlight upcoming */}
        {highlight && isFuture && (
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-xl text-xs font-bold bg-white/90 text-[#0A2463] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#F5A623]" />
            Em breve
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Date */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>
            {formatDate(evento.data_inicio)}
            {evento.data_fim && ` — ${formatDate(evento.data_fim)}`}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[#0A2463] mb-1 line-clamp-2">{evento.nome}</h3>

        {/* Time */}
        {(evento.horario_inicio || evento.horario_fim) && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {formatTime(evento.horario_inicio)}
              {evento.horario_fim && ` — ${formatTime(evento.horario_fim)}`}
            </span>
          </div>
        )}

        {/* Local */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="line-clamp-1">
            {evento.local}{evento.cidade ? ` — ${evento.cidade}` : ''}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href="/corrida/solicitar"
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#0A2463] hover:bg-[#0d2d73] text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Como Chegar
          </a>
          {evento.site_url && (
            <a
              href={evento.site_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Site
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
