'use client';
import PageTitle from '@/components/seo/PageTitle';

import { Suspense, useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Star,
  Check,
  X as XIcon,
  MessageSquare,
  Phone,
  User,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { supabase, type Roteiro, type PontoTuristico, ROTEIRO_TIPO_LABELS, formatarBRL } from '@/lib/supabase';

// ─── Animation variants ────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

// ─── Skeleton ──────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />;
}

function RoteiroCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <div className="mt-4 flex gap-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-28" />
      </div>
    </div>
  );
}

// ─── Icon helper ───────────────────────────────────────────
function TipoIcon({ tipo }: { tipo: string }) {
  const cfg = ROTEIRO_TIPO_LABELS[tipo as keyof typeof ROTEIRO_TIPO_LABELS];
  if (!cfg) return <Sparkles className="w-5 h-5 text-gray-400" />;
  const iconMap: Record<string, React.ReactNode> = {
    users: <Users className="w-5 h-5" style={{ color: cfg.color }} />,
    heart: <Star className="w-5 h-5" style={{ color: cfg.color }} />,
    compass: <MapPin className="w-5 h-5" style={{ color: cfg.color }} />,
    palette: <Sparkles className="w-5 h-5" style={{ color: cfg.color }} />,
    utensils: <MessageSquare className="w-5 h-5" style={{ color: cfg.color }} />,
    church: <MapPin className="w-5 h-5" style={{ color: cfg.color }} />,
    moon: <Clock className="w-5 h-5" style={{ color: cfg.color }} />,
  };
  return <>{iconMap[cfg.icon] ?? <Sparkles className="w-5 h-5" style={{ color: cfg.color }} />}</>;
}

// ─── Main Component ────────────────────────────────────────
function BookingContent() {
  const searchParams = useSearchParams();
  const pontoSlug = searchParams.get('ponto');

  // Data state
  const [roteiros, setRoteiros] = useState<Roteiro[]>([]);
  const [pontos, setPontos] = useState<PontoTuristico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedRoteiro, setSelectedRoteiro] = useState<Roteiro | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [form, setForm] = useState({
    nome: '',
    whatsapp: '',
    data: '',
    horario: '',
    passageiros: 2,
    observacoes: '',
  });

  // ─── Fetch data ────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [roteirosRes, pontosRes] = await Promise.all([
          supabase.from('roteiros').select('*').eq('ativo', true).order('destaque', { ascending: false }),
          supabase.from('pontos_turisticos').select('*').eq('ativo', true),
        ]);
        if (roteirosRes.error) throw roteirosRes.error;
        if (pontosRes.error) throw pontosRes.error;
        setRoteiros(roteirosRes.data ?? []);
        setPontos(pontosRes.data ?? []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erro ao carregar dados';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ─── Pre-select roteiro if ?ponto=slug ────────────────
  useEffect(() => {
    if (!pontoSlug || roteiros.length === 0 || pontos.length === 0) return;
    const ponto = pontos.find((p) => p.slug === pontoSlug);
    if (!ponto) return;
    const match = roteiros.find((r) => r.pontos_ids?.includes(ponto.id));
    if (match) {
      setSelectedRoteiro(match);
      setExpandedId(match.id);
    }
  }, [pontoSlug, roteiros, pontos]);

  // ─── Helpers ───────────────────────────────────────────
  const pontosMap = useMemo(() => {
    const map = new Map<string, PontoTuristico>();
    for (const p of pontos) map.set(p.id, p);
    return map;
  }, [pontos]);

  const getPontoNames = useCallback(
    (ids: string[]) => ids.map((id) => pontosMap.get(id)?.nome ?? 'Ponto turístico').join(', '),
    [pontosMap],
  );

  const getPontoObjects = useCallback(
    (ids: string[]) => ids.map((id) => pontosMap.get(id)).filter(Boolean) as PontoTuristico[],
    [pontosMap],
  );

  const roteiroIncludesPonto = useCallback(
    (roteiro: Roteiro) => {
      if (!pontoSlug) return false;
      const ponto = pontos.find((p) => p.slug === pontoSlug);
      return ponto ? roteiro.pontos_ids?.includes(ponto.id) ?? false : false;
    },
    [pontoSlug, pontos],
  );

  // ─── Price calculation ─────────────────────────────────
  const precoFinal = useMemo(() => {
    if (!selectedRoteiro) return 0;
    if (form.passageiros > 4 && selectedRoteiro.preco_6lugares) {
      return selectedRoteiro.preco_6lugares;
    }
    return selectedRoteiro.preco_base;
  }, [selectedRoteiro, form.passageiros]);

  // ─── Handlers ──────────────────────────────────────────
  const handleToggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleSelectRoteiro = (roteiro: Roteiro) => {
    setSelectedRoteiro((prev) => (prev?.id === roteiro.id ? null : roteiro));
    setSubmitted(false);
  };

  const handleFormChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid =
    selectedRoteiro &&
    form.nome.trim().length >= 2 &&
    form.whatsapp.trim().length >= 10 &&
    form.data &&
    form.horario;

  const handleSubmit = () => {
    if (!isFormValid || !selectedRoteiro) return;
    setSubmitted(true);
  };

  // ─── WhatsApp link ─────────────────────────────────────
  const whatsappLink = useMemo(() => {
    if (!selectedRoteiro) return '';
    const msg = [
      `🏖️ *Reserva City Tour — DNA Baixada*`,
      ``,
      `📋 Roteiro: ${selectedRoteiro.nome}`,
      `📅 Data: ${form.data}`,
      `🕐 Horário: ${form.horario}`,
      `👥 Passageiros: ${form.passageiros}`,
      `💰 Valor: ${formatarBRL(precoFinal)}`,
      ``,
      `👤 Nome: ${form.nome}`,
      `📱 WhatsApp: ${form.whatsapp}`,
      form.observacoes ? `📝 Observações: ${form.observacoes}` : '',
    ]
      .filter(Boolean)
      .join('\n');
    return `https://wa.me/5513997042065?text=${encodeURIComponent(msg)}`;
    // WhatsApp oficial DNA Baixada
  }, [selectedRoteiro, form, precoFinal]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 py-3">
          <a
            href="/turismo"
            className="flex items-center gap-1 text-sm font-medium text-[#0A2463] hover:text-[#14A76C] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </a>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-[#0A2463]">Reservar City Tour</h1>
          </div>
          <div className="w-20" /> {/* spacer */}
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-6">
        {/* ── Highlight banner when ?ponto=slug ── */}
        {pontoSlug && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-r from-[#14A76C]/10 to-[#F5A623]/10 border border-[#14A76C]/20 p-4 flex items-center gap-3"
          >
            <MapPin className="w-6 h-6 text-[#14A76C] shrink-0" />
            <p className="text-sm text-[#0A2463]">
              Mostrando roteiros que incluem{' '}
              <span className="font-bold">
                {pontos.find((p) => p.slug === pontoSlug)?.nome ?? pontoSlug}
              </span>
            </p>
          </motion.div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="rounded-2xl bg-[#E84855]/10 border border-[#E84855]/20 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#E84855] shrink-0 mt-0.5" />
            <p className="text-sm text-[#E84855]">{error}</p>
          </div>
        )}

        {/* ════════════ Step 1: Escolher Roteiro ════════════ */}
        <section>
          <h2 className="text-xl font-bold text-[#0A2463] mb-1">Escolha seu roteiro</h2>
          <p className="text-sm text-gray-500 mb-4">Selecione o passeio ideal para você</p>

          {loading ? (
            <div className="space-y-4">
              <RoteiroCardSkeleton />
              <RoteiroCardSkeleton />
              <RoteiroCardSkeleton />
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-4"
            >
              {roteiros.map((roteiro, i) => {
                const isExpanded = expandedId === roteiro.id;
                const isSelected = selectedRoteiro?.id === roteiro.id;
                const highlights = roteiroIncludesPonto(roteiro);
                const tipoLabel = ROTEIRO_TIPO_LABELS[roteiro.tipo];
                const roteiroPontos = getPontoObjects(roteiro.pontos_ids ?? []);

                return (
                  <motion.div
                    key={roteiro.id}
                    variants={fadeUp}
                    custom={i}
                    className={`rounded-2xl border-2 bg-white shadow-sm transition-all duration-200 ${
                      isSelected
                        ? 'border-[#14A76C] shadow-md'
                        : highlights
                          ? 'border-[#F5A623] shadow-md'
                          : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {/* Card header */}
                    <button
                      type="button"
                      onClick={() => {
                        handleToggleExpand(roteiro.id);
                      }}
                      className="w-full text-left p-5 flex items-start gap-4"
                    >
                      {/* Icon */}
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${tipoLabel?.color ?? '#0A2463'}15` }}
                      >
                        <TipoIcon tipo={roteiro.tipo} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[#0A2463] text-base">{roteiro.nome}</h3>
                          {highlights && (
                            <span className="text-xs font-semibold bg-[#F5A623]/15 text-[#F5A623] px-2 py-0.5 rounded-full">
                              Inclui seu ponto
                            </span>
                          )}
                          {roteiro.destaque && (
                            <span className="text-xs font-semibold bg-[#14A76C]/15 text-[#14A76C] px-2 py-0.5 rounded-full">
                              Destaque
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{roteiro.descricao}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {roteiro.duracao_horas}h
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {roteiroPontos.length} pontos
                          </span>
                          <span className="font-bold text-[#14A76C]">
                            {formatarBRL(roteiro.preco_base)}
                          </span>
                          {tipoLabel && (
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${tipoLabel.color}15`,
                                color: tipoLabel.color,
                              }}
                            >
                              {tipoLabel.label}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expand icon */}
                      <div className="shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
                            {/* Pontos turísticos */}
                            <div>
                              <h4 className="text-sm font-semibold text-[#0A2463] mb-2">
                                Pontos incluídos
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {roteiroPontos.map((ponto) => (
                                  <div
                                    key={ponto.id}
                                    className={`flex items-center gap-2 rounded-xl p-2 text-sm ${
                                      pontoSlug && ponto.slug === pontoSlug
                                        ? 'bg-[#F5A623]/10 border border-[#F5A623]/30'
                                        : 'bg-gray-50'
                                    }`}
                                  >
                                    {ponto.foto_url ? (
                                      <img
                                        src={ponto.foto_url}
                                        alt={ponto.nome}
                                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0A2463] to-[#14A76C] flex items-center justify-center shrink-0">
                                        <MapPin className="w-5 h-5 text-white/60" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="font-medium text-[#0A2463] truncate">
                                        {ponto.nome}
                                      </p>
                                      <p className="text-xs text-gray-400 truncate">
                                        {ponto.descricao_curta}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* O que inclui / não inclui */}
                            <div className="grid sm:grid-cols-2 gap-4">
                              {roteiro.inclui?.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-[#14A76C] mb-2">
                                    Inclui
                                  </h4>
                                  <ul className="space-y-1">
                                    {roteiro.inclui.map((item) => (
                                      <li
                                        key={item}
                                        className="flex items-start gap-2 text-sm text-gray-600"
                                      >
                                        <Check className="w-4 h-4 text-[#14A76C] shrink-0 mt-0.5" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {roteiro.nao_inclui?.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-[#E84855] mb-2">
                                    Não inclui
                                  </h4>
                                  <ul className="space-y-1">
                                    {roteiro.nao_inclui.map((item) => (
                                      <li
                                        key={item}
                                        className="flex items-start gap-2 text-sm text-gray-500"
                                      >
                                        <XIcon className="w-4 h-4 text-[#E84855] shrink-0 mt-0.5" />
                                        {item}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            {/* Observações */}
                            {roteiro.observacoes && (
                              <div className="rounded-xl bg-[#0A2463]/5 p-3 text-sm text-gray-600">
                                <strong className="text-[#0A2463]">Observações:</strong>{' '}
                                {roteiro.observacoes}
                              </div>
                            )}

                            {/* Price info */}
                            <div className="rounded-xl bg-gradient-to-r from-[#0A2463]/5 to-[#14A76C]/5 p-4 flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-500">A partir de</p>
                                <p className="text-2xl font-bold text-[#0A2463]">
                                  {formatarBRL(roteiro.preco_base)}
                                </p>
                                {roteiro.preco_6lugares && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    Grupo (+4 passageiros): {formatarBRL(roteiro.preco_6lugares)}
                                  </p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSelectRoteiro(roteiro)}
                                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                                  isSelected
                                    ? 'bg-[#14A76C] text-white shadow-lg'
                                    : 'bg-[#0A2463] text-white hover:bg-[#0d2d73] shadow-md'
                                }`}
                              >
                                {isSelected ? '✓ Selecionado' : 'Selecionar'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>

        {/* ════════════ Step 2: Booking Form ════════════ */}
        <AnimatePresence>
          {selectedRoteiro && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' as const }}
              className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden"
            >
              {/* Form header */}
              <div className="bg-gradient-to-r from-[#0A2463] to-[#14A76C] p-5">
                <h2 className="text-lg font-bold text-white">Dados da reserva</h2>
                <p className="text-sm text-white/70 mt-1">
                  Roteiro: <strong>{selectedRoteiro.nome}</strong> · {selectedRoteiro.duracao_horas}h
                </p>
              </div>

              <div className="p-5 space-y-4">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-[#0A2463] mb-1.5">
                    <User className="w-4 h-4 inline mr-1" />
                    Nome completo
                  </label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => handleFormChange('nome', e.target.value)}
                    placeholder="Seu nome"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#14A76C]/40 focus:border-[#14A76C] transition-colors"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium text-[#0A2463] mb-1.5">
                    <Phone className="w-4 h-4 inline mr-1" />
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => handleFormChange('whatsapp', e.target.value)}
                    placeholder="(13) 99999-9999"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#14A76C]/40 focus:border-[#14A76C] transition-colors"
                  />
                </div>

                {/* Data + Horário */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0A2463] mb-1.5">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Data
                    </label>
                    <input
                      type="date"
                      value={form.data}
                      onChange={(e) => handleFormChange('data', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#14A76C]/40 focus:border-[#14A76C] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0A2463] mb-1.5">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Horário
                    </label>
                    <input
                      type="time"
                      value={form.horario}
                      onChange={(e) => handleFormChange('horario', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#14A76C]/40 focus:border-[#14A76C] transition-colors"
                    />
                  </div>
                </div>

                {/* Passageiros */}
                <div>
                  <label className="block text-sm font-medium text-[#0A2463] mb-1.5">
                    <Users className="w-4 h-4 inline mr-1" />
                    Número de passageiros
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleFormChange('passageiros', Math.max(1, form.passageiros - 1))}
                      className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      −
                    </button>
                    <span className="text-xl font-bold text-[#0A2463] w-8 text-center">
                      {form.passageiros}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleFormChange('passageiros', Math.min(10, form.passageiros + 1))}
                      className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-lg font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                    {form.passageiros > 4 && selectedRoteiro.preco_6lugares && (
                      <span className="text-xs text-[#F5A623] font-medium ml-2">
                        Preço grupo aplicado
                      </span>
                    )}
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-[#0A2463] mb-1.5">
                    <MessageSquare className="w-4 h-4 inline mr-1" />
                    Observações (opcional)
                  </label>
                  <textarea
                    value={form.observacoes}
                    onChange={(e) => handleFormChange('observacoes', e.target.value)}
                    placeholder="Alguma solicitação especial?"
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#14A76C]/40 focus:border-[#14A76C] transition-colors resize-none"
                  />
                </div>

                {/* Price summary */}
                <div className="rounded-2xl bg-gradient-to-r from-[#0A2463] to-[#14A76C] p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">Valor total</p>
                      <p className="text-3xl font-extrabold">{formatarBRL(precoFinal)}</p>
                      {form.passageiros > 4 && selectedRoteiro.preco_6lugares && (
                        <p className="text-xs text-white/60 mt-1">
                          Tarifa grupo (até 6 lugares) · {form.passageiros} passageiros
                        </p>
                      )}
                      {form.passageiros <= 4 && (
                        <p className="text-xs text-white/60 mt-1">
                          Tarifa base · {form.passageiros} passageiro{form.passageiros > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <Clock className="w-10 h-10 text-white/20" />
                  </div>
                </div>

                {/* Submit */}
                {!submitted ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                      isFormValid
                        ? 'bg-[#14A76C] text-white hover:bg-[#0d8a56] shadow-lg hover:shadow-xl'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Calendar className="w-5 h-5" />
                    Confirmar Reserva
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    {/* Success */}
                    <div className="rounded-xl bg-[#14A76C]/10 border border-[#14A76C]/20 p-4 text-center">
                      <Check className="w-8 h-8 text-[#14A76C] mx-auto mb-2" />
                      <p className="font-bold text-[#0A2463]">Reserva confirmada!</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Finalize pelo WhatsApp para garantir seu horário.
                      </p>
                    </div>

                    {/* WhatsApp button */}
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 rounded-xl font-bold text-base bg-[#25D366] text-white hover:bg-[#1fb855] transition-colors shadow-lg flex items-center justify-center gap-2"
                    >
                      <Phone className="w-5 h-5" />
                      Enviar pelo WhatsApp
                    </a>

                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="w-full py-3 rounded-xl text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Voltar e editar
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Bottom spacer */}
        <div className="h-8" />
      </main>
    </div>
  );
}

// ─── Default export with Suspense boundary for useSearchParams ──
export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-gray-50">
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-4xl mx-auto flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-32 mx-auto" />
              <div className="w-20" />
            </div>
          </header>
          <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 space-y-4">
            <RoteiroCardSkeleton />
            <RoteiroCardSkeleton />
          </main>
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
