'use client';

import { useEffect, useState, useCallback } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Star,
  Phone,
  Globe,
  ExternalLink,
  Navigation,
  Car,
  MessageCircle,
  Copy,
  Check,
  ChevronRight,
  Home,
  BadgeCheck,
  Gift,
  Percent,
  Tag,
  Users,
  Quote,
  Store,
  ImageIcon,
} from 'lucide-react';
import {
  supabase,
  ESTABELECIMENTO_CATEGORIA_LABELS,
  CAMPANHA_TIPO_LABELS,
  formatarBRL,
} from '@/lib/supabase';
import type {
  Estabelecimento,
  CampanhaPromocional,
  AvaliacaoParceiro,
} from '@/lib/supabase';

// ════════════════════════════════════════════════════════════
// Animation variants
// ════════════════════════════════════════════════════════════

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// ════════════════════════════════════════════════════════════
// Star Rating
// ════════════════════════════════════════════════════════════

function StarRating({ rating, total }: { rating: number; total: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-5 w-5 ${
              s <= fullStars
                ? 'fill-[#F5A623] text-[#F5A623]'
                : s === fullStars + 1 && hasHalf
                  ? 'fill-[#F5A623]/50 text-[#F5A623]'
                  : 'fill-gray-200 text-gray-200'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-[#0A2463]">
        {rating.toFixed(1)}
      </span>
      <span className="text-sm text-gray-500">({total} avaliações)</span>
    </div>
  );
}

function StarBadge({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${
            s <= fullStars
              ? 'fill-[#F5A623] text-[#F5A623]'
              : s === fullStars + 1 && hasHalf
                ? 'fill-[#F5A623]/50 text-[#F5A623]'
                : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Loading Skeleton
// ════════════════════════════════════════════════════════════

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Hero skeleton */}
      <div className="h-[400px] bg-gray-200" />

      {/* Content skeleton */}
      <div className="max-w-5xl mx-auto px-4 py-10 -mt-24 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="h-4 w-48 bg-gray-200 rounded" />
          <div className="h-8 w-3/4 bg-gray-200 rounded" />
          <div className="flex gap-3">
            <div className="h-6 w-24 bg-gray-200 rounded-full" />
            <div className="h-6 w-32 bg-gray-200 rounded-full" />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
            <div className="h-4 w-2/3 bg-gray-200 rounded" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <div className="h-20 bg-gray-100 rounded-xl" />
            <div className="h-20 bg-gray-100 rounded-xl" />
            <div className="h-20 bg-gray-100 rounded-xl" />
            <div className="h-20 bg-gray-100 rounded-xl" />
          </div>
          <div className="h-40 bg-gray-100 rounded-xl mt-6" />
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// 404 Not Found
// ════════════════════════════════════════════════════════════

function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <Store className="w-12 h-12 text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold text-[#0A2463] mb-3">
          Estabelecimento não encontrado
        </h1>
        <p className="text-gray-500 mb-8">
          O estabelecimento que você está procurando não existe ou foi removido.
        </p>
        <button
          onClick={() => router.push('/parceiros')}
          className="inline-flex items-center gap-2 bg-[#0A2463] hover:bg-[#0d2d73] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Parceiros
        </button>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Coupon Copy Button
// ════════════════════════════════════════════════════════════

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5A623]/10 text-[#F5A623] text-sm font-semibold hover:bg-[#F5A623]/20 transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Copiado!
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          {code}
        </>
      )}
    </button>
  );
}

// ════════════════════════════════════════════════════════════
// Schedule Table
// ════════════════════════════════════════════════════════════

const DIAS_SEMANA = [
  { key: 'seg', label: 'Segunda-feira' },
  { key: 'ter', label: 'Terça-feira' },
  { key: 'qua', label: 'Quarta-feira' },
  { key: 'qui', label: 'Quinta-feira' },
  { key: 'sex', label: 'Sexta-feira' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
];

function HorarioTable({ horarios }: { horarios: Record<string, string> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <tbody>
          {DIAS_SEMANA.map((dia, i) => {
            const valor = horarios[dia.key] || horarios[dia.key.toUpperCase()] || '—';
            const isToday =
              new Date().getDay() === (i === 6 ? 0 : i + 1);
            return (
              <tr
                key={dia.key}
                className={`${isToday ? 'bg-[#0A2463]/5' : ''} ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}
              >
                <td
                  className={`px-4 py-2.5 font-medium ${isToday ? 'text-[#0A2463] font-semibold' : 'text-gray-600'}`}
                >
                  {dia.label}
                  {isToday && (
                    <span className="ml-2 text-xs bg-[#0A2463] text-white px-1.5 py-0.5 rounded-full">
                      Hoje
                    </span>
                  )}
                </td>
                <td
                  className={`px-4 py-2.5 text-right ${isToday ? 'text-[#0A2463] font-semibold' : 'text-gray-700'}`}
                >
                  {valor === 'Fechado' || valor === '—' ? (
                    <span className="text-[#E84855]">Fechado</span>
                  ) : (
                    valor
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════

export default function ParceiroDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const [estab, setEstab] = useState<Estabelecimento | null>(null);
  const [campanhas, setCampanhas] = useState<CampanhaPromocional[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoParceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setNotFound(false);

      // Fetch estabelecimento by slug
      const { data: estabData, error: estabError } = await supabase
        .from('estabelecimentos')
        .select('*')
        .eq('slug', slug)
        .eq('ativo', true)
        .single();

      if (estabError || !estabData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const est = estabData as Estabelecimento;
      setEstab(est);

      // Fetch campanhas ativas
      const { data: campanhasData } = await supabase
        .from('campanhas_promocionais')
        .select('*')
        .eq('estabelecimento_id', est.id)
        .eq('ativo', true)
        .order('destaque', { ascending: false });

      if (campanhasData) {
        setCampanhas(campanhasData as CampanhaPromocional[]);
      }

      // Fetch avaliações com join em profiles
      const { data: avaliacoesData } = await supabase
        .from('avaliacoes_parceiro')
        .select('*, usuario:profiles(nome, foto_url)')
        .eq('estabelecimento_id', est.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (avaliacoesData) {
        setAvaliacoes(avaliacoesData as unknown as AvaliacaoParceiro[]);
      }

      setLoading(false);
    }

    if (slug) {
      fetchData();
    }
  }, [slug]);

  // ════════════════════════════════════════════════════════════
  // Render — Loading
  // ════════════════════════════════════════════════════════════
  if (loading) return <LoadingSkeleton />;

  // ════════════════════════════════════════════════════════════
  // Render — 404
  // ════════════════════════════════════════════════════════════
  if (notFound || !estab) return <NotFound />;

  const catInfo = ESTABELECIMENTO_CATEGORIA_LABELS[estab.categoria];
  const transportUrl =
    estab.latitude && estab.longitude
      ? `/corrida/solicitar?destino=${estab.latitude},${estab.longitude}&nome=${encodeURIComponent(estab.nome)}`
      : '/corrida/solicitar';

  const now = new Date();
  const campanhasAtivas = campanhas.filter((c) => {
    const inicio = new Date(c.data_inicio);
    const fim = new Date(c.data_fim);
    return now >= inicio && now <= fim;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* ═════════════════════════════════════════════════════════
          Breadcrumb
      ═════════════════════════════════════════════════════════ */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-gray-400 hover:text-[#0A2463] transition-colors flex items-center gap-1"
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <Link
              href="/parceiros"
              className="text-gray-400 hover:text-[#0A2463] transition-colors"
            >
              Parceiros
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-[#0A2463] font-medium truncate max-w-[200px] sm:max-w-none">
              {estab.nome}
            </span>
          </nav>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════
          Hero
      ═════════════════════════════════════════════════════════ */}
      <section className="relative h-[360px] sm:h-[440px] overflow-hidden">
        {estab.foto_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={estab.foto_url}
            alt={estab.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0A2463] via-[#0d2d73] to-[#14A76C]" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.push('/parceiros')}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-4 py-2 rounded-full hover:bg-white/25 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        {/* Logo badge */}
        {estab.logo_url && (
          <div className="absolute top-4 right-4 z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white shadow-lg overflow-hidden border-2 border-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={estab.logo_url}
              alt={`Logo ${estab.nome}`}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center flex-wrap gap-2 mb-3">
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${catInfo?.color ?? '#0A2463'}20`,
                    color: catInfo?.color ?? '#0A2463',
                  }}
                >
                  <Store className="w-3.5 h-3.5" />
                  {catInfo?.label ?? estab.categoria}
                </span>
                {estab.verificado && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full bg-[#14A76C]/20 text-[#14A76C]">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Verificado
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
                {estab.nome}
              </h1>
              {estab.cidade && (
                <p className="mt-2 text-white/70 text-sm sm:text-base flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {estab.cidade}
                  {estab.bairro ? ` — ${estab.bairro}` : ''}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          Main Content
      ═════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column — main info */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="lg:col-span-2 space-y-8"
          >
            {/* Rating */}
            <motion.div variants={fadeUp} custom={0}>
              <StarRating
                rating={estab.avaliacao_media}
                total={estab.total_avaliacoes}
              />
            </motion.div>

            {/* Description */}
            {estab.descricao && (
              <motion.div variants={fadeUp} custom={1}>
                <h2 className="text-xl font-bold text-[#0A2463] mb-3">
                  Sobre
                </h2>
                <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {estab.descricao}
                </div>
              </motion.div>
            )}

            {/* Contact info cards */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="grid sm:grid-cols-2 gap-4"
            >
              {estab.endereco && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#0A2463]/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#0A2463]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Endereço
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      {estab.endereco}
                    </p>
                  </div>
                </div>
              )}

              {estab.telefone && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#14A76C]/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-[#14A76C]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Telefone
                    </p>
                    <a
                      href={`tel:${estab.telefone}`}
                      className="text-sm text-[#0A2463] hover:underline mt-0.5 block"
                    >
                      {estab.telefone}
                    </a>
                  </div>
                </div>
              )}

              {estab.whatsapp && (
                <a
                  href={`https://wa.me/55${estab.whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 bg-[#14A76C]/5 rounded-xl hover:bg-[#14A76C]/10 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#14A76C]/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-[#14A76C]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      WhatsApp
                    </p>
                    <p className="text-sm text-[#14A76C] font-medium mt-0.5 group-hover:underline">
                      {estab.whatsapp}
                    </p>
                  </div>
                </a>
              )}

              {estab.site_url && (
                <a
                  href={estab.site_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#0A2463]/10 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-[#0A2463]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Site
                    </p>
                    <p className="text-sm text-[#0A2463] font-medium mt-0.5 group-hover:underline flex items-center gap-1">
                      {estab.site_url.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3" />
                    </p>
                  </div>
                </a>
              )}

              {estab.instagram && (
                <a
                  href={`https://instagram.com/${estab.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#E84855]/10 flex items-center justify-center shrink-0">
                    <svg
                      className="w-5 h-5 text-[#E84855]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Instagram
                    </p>
                    <p className="text-sm text-[#E84855] font-medium mt-0.5 group-hover:underline">
                      {estab.instagram}
                    </p>
                  </div>
                </a>
              )}

              {/* Placeholder when no contact info */}
              {!estab.endereco &&
                !estab.telefone &&
                !estab.whatsapp &&
                !estab.site_url &&
                !estab.instagram && (
                  <div className="sm:col-span-2 flex items-center gap-3 p-4 bg-gray-50 rounded-xl text-gray-400">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">
                      Informações de contato não disponíveis
                    </span>
                  </div>
                )}
            </motion.div>

            {/* Horário de Funcionamento */}
            {estab.horario_funcionamento &&
              Object.keys(estab.horario_funcionamento).length > 0 && (
                <motion.div variants={fadeUp} custom={3}>
                  <h2 className="text-xl font-bold text-[#0A2463] mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#14A76C]" />
                    Horário de Funcionamento
                  </h2>
                  <HorarioTable horarios={estab.horario_funcionamento} />
                </motion.div>
              )}

            {/* ═══ Promoções e Cupons ═══ */}
            {campanhasAtivas.length > 0 && (
              <motion.div variants={fadeUp} custom={4}>
                <h2 className="text-xl font-bold text-[#0A2463] mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#F5A623]" />
                  Promoções e Cupons
                </h2>
                <div className="space-y-4">
                  {campanhasAtivas.map((campanha) => {
                    const tipoInfo = CAMPANHA_TIPO_LABELS[campanha.tipo];
                    return (
                      <div
                        key={campanha.id}
                        className="relative overflow-hidden rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
                      >
                        {/* Ribbon de destaque */}
                        {campanha.destaque && (
                          <div className="absolute top-0 right-0 bg-[#E84855] text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                            Destaque
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${tipoInfo?.color ?? '#0A2463'}15`,
                                  color: tipoInfo?.color ?? '#0A2463',
                                }}
                              >
                                {tipoInfo?.label ?? campanha.tipo}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-[#0A2463]">
                              {campanha.titulo}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {campanha.descricao}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              {campanha.desconto_percentual && (
                                <span className="flex items-center gap-1 text-[#14A76C] font-semibold">
                                  <Percent className="w-3 h-3" />
                                  {campanha.desconto_percentual}% OFF
                                </span>
                              )}
                              {campanha.desconto_fixo && (
                                <span className="flex items-center gap-1 text-[#14A76C] font-semibold">
                                  {formatarBRL(campanha.desconto_fixo)} OFF
                                </span>
                              )}
                              {campanha.valor_minimo > 0 && (
                                <span>
                                  Mínimo: {formatarBRL(campanha.valor_minimo)}
                                </span>
                              )}
                              <span>
                                Válido até{' '}
                                {new Date(campanha.data_fim).toLocaleDateString(
                                  'pt-BR'
                                )}
                              </span>
                            </div>
                          </div>
                          {campanha.codigo_cupom && (
                            <CopyButton code={campanha.codigo_cupom} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ═══ Programa de Fidelidade ═══ */}
            {estab.programa_fidelidade_ativo && (
              <motion.div variants={fadeUp} custom={5}>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A2463] to-[#0d2d73] p-6 text-white">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="w-6 h-6 text-[#F5A623]" />
                      <h2 className="text-lg font-bold">Programa de Fidelidade</h2>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {estab.descricao_fidelidade ||
                        `Acumule ${estab.pontos_por_real} pontos para cada R$ 1,00 gasto e troque por benefícios exclusivos!`}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
                      <Star className="w-4 h-4 text-[#F5A623] fill-[#F5A623]" />
                      <span className="text-sm font-semibold">
                        {estab.pontos_por_real} pontos por real
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ Avaliações Recentes ═══ */}
            <motion.div variants={fadeUp} custom={6}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#0A2463] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#F5A623]" />
                  Avaliações Recentes
                </h2>
                {estab.total_avaliacoes > 0 && (
                  <span className="text-sm text-gray-400">
                    {estab.total_avaliacoes}{' '}
                    {estab.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'}
                  </span>
                )}
              </div>

              {avaliacoes.length > 0 ? (
                <div className="space-y-4">
                  {avaliacoes.map((av) => (
                    <div
                      key={av.id}
                      className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A2463] to-[#14A76C] flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {av.usuario?.nome
                            ? av.usuario.nome.charAt(0).toUpperCase()
                            : '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-[#0A2463]">
                              {av.usuario?.nome ?? 'Usuário'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(av.created_at).toLocaleDateString(
                                'pt-BR'
                              )}
                            </span>
                          </div>
                          <StarBadge rating={av.nota} />
                          {av.comentario && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                              {av.comentario}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                  <Quote className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    Nenhuma avaliação ainda. Seja o primeiro a avaliar!
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>

          {/* Right column — actions sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-4"
          >
            {/* Transport button */}
            <Link
              href={transportUrl}
              className="flex items-center justify-center gap-2 w-full bg-[#0A2463] hover:bg-[#0d2d73] text-white font-semibold px-6 py-4 rounded-xl transition-colors shadow-lg shadow-[#0A2463]/20"
            >
              <Car className="w-5 h-5" />
              Pedir Transporte
            </Link>

            {/* Map button */}
            <button
              onClick={() => {
                if (estab.latitude && estab.longitude) {
                  window.open(
                    `https://www.google.com/maps?q=${estab.latitude},${estab.longitude}`,
                    '_blank'
                  );
                }
              }}
              className="flex items-center justify-center gap-2 w-full bg-[#14A76C] hover:bg-[#0e8d58] text-white font-semibold px-6 py-4 rounded-xl transition-colors shadow-lg shadow-[#14A76C]/20"
            >
              <Navigation className="w-5 h-5" />
              Ver no Mapa
            </button>

            {/* Info card */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-[#0A2463] uppercase tracking-wider">
                Informações
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Categoria</span>
                  <span className="font-medium text-[#0A2463]">
                    {catInfo?.label ?? estab.categoria}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Cidade</span>
                  <span className="font-medium text-[#0A2463]">
                    {estab.cidade}
                  </span>
                </div>

                {estab.bairro && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Bairro</span>
                    <span className="font-medium text-[#0A2463]">
                      {estab.bairro}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Avaliação</span>
                  <span className="font-medium text-[#F5A623]">
                    ⭐ {estab.avaliacao_media.toFixed(1)}
                  </span>
                </div>

                {estab.verificado && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className="font-medium text-[#14A76C] flex items-center gap-1">
                      <BadgeCheck className="w-4 h-4" />
                      Verificado
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick WhatsApp */}
            {estab.whatsapp && (
              <a
                href={`https://wa.me/55${estab.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full border-2 border-[#14A76C] text-[#14A76C] hover:bg-[#14A76C] hover:text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Chamar no WhatsApp
              </a>
            )}

            {/* Galeria thumbnails */}
            {estab.galeria && estab.galeria.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-bold text-[#0A2463] uppercase tracking-wider mb-3">
                  Galeria
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {estab.galeria.slice(0, 6).map((foto, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={foto}
                        alt={`${estab.nome} foto ${i + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                  {estab.galeria.length > 6 && (
                    <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.aside>
        </div>
      </section>
    </div>
  );
}
