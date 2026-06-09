'use client';

import { useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Ticket,
  Star,
  Lightbulb,
  Car,
  Compass,
  ChevronRight,
  Home,
  Camera,
  Timer,
  Navigation,
  ImageIcon,
} from 'lucide-react';
import { supabase, PONTO_CATEGORIA_LABELS } from '@/lib/supabase';
import type { PontoTuristico } from '@/lib/supabase';

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
// Star Rating component
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
      <span className="text-sm font-semibold text-[#0A2463]">{rating.toFixed(1)}</span>
      <span className="text-sm text-gray-500">({total} avaliações)</span>
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
          <MapPin className="w-12 h-12 text-gray-300" />
        </div>
        <h1 className="text-2xl font-bold text-[#0A2463] mb-3">
          Ponto turístico não encontrado
        </h1>
        <p className="text-gray-500 mb-8">
          O ponto que você está procurando não existe ou foi removido.
        </p>
        <button
          onClick={() => router.push('/turismo')}
          className="inline-flex items-center gap-2 bg-[#0A2463] hover:bg-[#0d2d73] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar para Turismo
        </button>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Gallery Modal
// ════════════════════════════════════════════════════════════

function GalleryModal({
  photos,
  initialIndex,
  onClose,
}: {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(c + 1, photos.length - 1));
      if (e.key === 'ArrowLeft') setCurrent((c) => Math.max(c - 1, 0));
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, photos.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors text-lg"
        >
          ✕
        </button>

        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[current]}
            alt={`Foto ${current + 1}`}
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
            disabled={current === 0}
            className="p-2 rounded-full bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-white/70 text-sm">
            {current + 1} / {photos.length}
          </span>
          <button
            onClick={() => setCurrent((c) => Math.min(c + 1, photos.length - 1))}
            disabled={current === photos.length - 1}
            className="p-2 rounded-full bg-white/10 text-white disabled:opacity-30 hover:bg-white/20 transition"
          >
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// Nearby Point Card
// ════════════════════════════════════════════════════════════

function NearbyCard({ ponto }: { ponto: PontoTuristico }) {
  const catInfo = PONTO_CATEGORIA_LABELS[ponto.categoria];

  return (
    <Link href={`/turismo/${ponto.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 bg-white"
      >
        <div className="relative h-40 bg-gradient-to-br from-[#0A2463] to-[#14A76C] flex items-center justify-center">
          {ponto.foto_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={ponto.foto_url}
              alt={ponto.nome}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <MapPin className="w-12 h-12 text-white/40" />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>
        <div className="p-4">
          <span
            className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2"
            style={{ backgroundColor: '#14A76C15', color: '#14A76C' }}
          >
            {catInfo?.label ?? ponto.categoria}
          </span>
          <h4 className="text-sm font-bold text-[#0A2463] line-clamp-1">{ponto.nome}</h4>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ponto.descricao_curta}</p>
        </div>
      </motion.div>
    </Link>
  );
}

// ════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════

export default function PontoTuristicoDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const [ponto, setPonto] = useState<PontoTuristico | null>(null);
  const [nearby, setNearby] = useState<PontoTuristico[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setNotFound(false);

      // Fetch ponto by slug
      const { data, error } = await supabase
        .from('pontos_turisticos')
        .select('*')
        .eq('slug', params.slug)
        .eq('ativo', true)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPonto(data as PontoTuristico);

      // Fetch nearby points (same city, excluding current, limit 3)
      const { data: nearbyData } = await supabase
        .from('pontos_turisticos')
        .select('*')
        .eq('cidade', data.cidade)
        .eq('ativo', true)
        .neq('id', data.id)
        .order('destaque', { ascending: false })
        .limit(3);

      if (nearbyData) {
        setNearby(nearbyData as PontoTuristico[]);
      }

      setLoading(false);
    }

    if (params.slug) {
      fetchData();
    }
  }, [params.slug]);

  // ════════════════════════════════════════════════════════════
  // Render — Loading
  // ════════════════════════════════════════════════════════════
  if (loading) return <LoadingSkeleton />;

  // ════════════════════════════════════════════════════════════
  // Render — 404
  // ════════════════════════════════════════════════════════════
  if (notFound || !ponto) return <NotFound />;

  const catInfo = PONTO_CATEGORIA_LABELS[ponto.categoria];
  const allPhotos = [
    ...(ponto.foto_url ? [ponto.foto_url] : []),
    ...(ponto.galeria || []),
  ];

  const transportUrl =
    ponto.latitude && ponto.longitude
      ? `/corrida/solicitar?destino=${ponto.latitude},${ponto.longitude}&nome=${encodeURIComponent(ponto.nome)}`
      : '/corrida/solicitar';

  const cityTourUrl = `/turismo/booking?ponto=${ponto.slug}`;

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
              href="/turismo"
              className="text-gray-400 hover:text-[#0A2463] transition-colors"
            >
              Turismo
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
            <span className="text-[#0A2463] font-medium truncate max-w-[200px] sm:max-w-none">
              {ponto.nome}
            </span>
          </nav>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════
          Hero
      ═════════════════════════════════════════════════════════ */}
      <section className="relative h-[400px] sm:h-[480px] overflow-hidden">
        {ponto.foto_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={ponto.foto_url}
            alt={ponto.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0A2463] via-[#0d2d73] to-[#14A76C]" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.push('/turismo')}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-white/15 backdrop-blur-md text-white px-4 py-2 rounded-full hover:bg-white/25 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Voltar</span>
        </button>

        {/* Hero content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full mb-3"
                style={{ backgroundColor: '#14A76C20', color: '#14A76C' }}
              >
                <MapPin className="w-3.5 h-3.5" />
                {catInfo?.label ?? ponto.categoria}
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
                {ponto.nome}
              </h1>
              {ponto.descricao_curta && (
                <p className="mt-2 text-white/80 text-base sm:text-lg max-w-2xl">
                  {ponto.descricao_curta}
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
              <StarRating rating={ponto.avaliacao_media} total={ponto.total_avaliacoes} />
            </motion.div>

            {/* Description */}
            <motion.div variants={fadeUp} custom={1}>
              <h2 className="text-xl font-bold text-[#0A2463] mb-3">Sobre</h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                {ponto.descricao}
              </div>
            </motion.div>

            {/* Quick info cards */}
            <motion.div variants={fadeUp} custom={2} className="grid sm:grid-cols-2 gap-4">
              {ponto.endereco && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#0A2463]/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#0A2463]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Endereço
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5">{ponto.endereco}</p>
                  </div>
                </div>
              )}

              {ponto.horario_funcionamento && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#14A76C]/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#14A76C]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Horário
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5">{ponto.horario_funcionamento}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-[#F5A623]/10 flex items-center justify-center shrink-0">
                  <Ticket className="w-5 h-5 text-[#F5A623]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Ingresso
                  </p>
                  <p className="text-sm text-gray-700 mt-0.5">
                    {ponto.gratuito
                      ? 'Gratuito'
                      : ponto.preco_entrada > 0
                        ? `R$ ${ponto.preco_entrada.toFixed(2).replace('.', ',')}`
                        : 'Consultar'}
                  </p>
                </div>
              </div>

              {ponto.tempo_visita_minutos && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-[#E84855]/10 flex items-center justify-center shrink-0">
                    <Timer className="w-5 h-5 text-[#E84855]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Tempo de visita
                    </p>
                    <p className="text-sm text-gray-700 mt-0.5">
                      ~{ponto.tempo_visita_minutos} minutos
                    </p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Dicas do visitante */}
            {ponto.dicas && (
              <motion.div
                variants={fadeUp}
                custom={3}
                className="relative overflow-hidden rounded-2xl border-2 border-[#F5A623]/20 bg-gradient-to-br from-[#F5A623]/5 to-[#F5A623]/10 p-6"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5A623]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-5 h-5 text-[#F5A623]" />
                    <h3 className="text-lg font-bold text-[#0A2463]">Dicas do Visitante</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {ponto.dicas}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Galeria */}
            {allPhotos.length > 0 && (
              <motion.div variants={fadeUp} custom={4}>
                <h2 className="text-xl font-bold text-[#0A2463] mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#14A76C]" />
                  Galeria de Fotos
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {allPhotos.slice(0, 6).map((foto, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setGalleryIndex(i);
                        setGalleryOpen(true);
                      }}
                      className={`relative rounded-xl overflow-hidden group cursor-pointer ${
                        i === 0 ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={foto}
                        alt={`${ponto.nome} - Foto ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

                      {i === 5 && allPhotos.length > 6 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-white text-center">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                            <span className="text-sm font-semibold">
                              +{allPhotos.length - 6} fotos
                            </span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Map placeholder */}
            {ponto.latitude && ponto.longitude && (
              <motion.div variants={fadeUp} custom={5}>
                <h2 className="text-xl font-bold text-[#0A2463] mb-4 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-[#14A76C]" />
                  Localização
                </h2>
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gradient-to-br from-[#e8f4f0] to-[#d4ebe4] h-64 sm:h-80">
                  {/* Map placeholder with grid pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path
                            d="M 40 0 L 0 0 0 40"
                            fill="none"
                            stroke="#0A2463"
                            strokeWidth="0.5"
                          />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>

                  {/* Center pin */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-[#E84855] shadow-lg flex items-center justify-center animate-bounce">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div className="mt-2 bg-white rounded-lg shadow-md px-3 py-1.5 text-xs font-medium text-[#0A2463]">
                        {ponto.nome}
                      </div>
                    </div>
                  </div>

                  {/* Coordinates */}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-gray-500 font-mono">
                    {ponto.latitude.toFixed(6)}, {ponto.longitude.toFixed(6)}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Right column — sidebar */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-6"
          >
            {/* Action buttons */}
            <motion.div variants={fadeUp} custom={0} className="space-y-3">
              <Link
                href={transportUrl}
                className="flex items-center justify-center gap-2 w-full bg-[#0A2463] hover:bg-[#0d2d73] text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-lg"
              >
                <Car className="w-5 h-5" />
                Pedir Transporte
              </Link>

              <Link
                href={cityTourUrl}
                className="flex items-center justify-center gap-2 w-full bg-[#14A76C] hover:bg-[#0d8a56] text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-lg"
              >
                <Compass className="w-5 h-5" />
                Incluir no City Tour
              </Link>
            </motion.div>

            {/* Info summary card */}
            <motion.div
              variants={fadeUp}
              custom={1}
              className="bg-gray-50 rounded-2xl p-6 space-y-4"
            >
              <h3 className="font-bold text-[#0A2463]">Informações</h3>

              {ponto.cidade && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#14A76C] shrink-0" />
                  <span className="text-sm text-gray-600">{ponto.cidade}</span>
                </div>
              )}

              {ponto.horario_funcionamento && (
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#14A76C] shrink-0" />
                  <span className="text-sm text-gray-600">{ponto.horario_funcionamento}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Ticket className="w-4 h-4 text-[#14A76C] shrink-0" />
                <span className="text-sm text-gray-600">
                  {ponto.gratuito
                    ? 'Entrada gratuita'
                    : ponto.preco_entrada > 0
                      ? `R$ ${ponto.preco_entrada.toFixed(2).replace('.', ',')}`
                      : 'Consultar preço'}
                </span>
              </div>

              {ponto.tempo_visita_minutos && (
                <div className="flex items-center gap-3">
                  <Timer className="w-4 h-4 text-[#14A76C] shrink-0" />
                  <span className="text-sm text-gray-600">
                    ~{ponto.tempo_visita_minutos} min de visita
                  </span>
                </div>
              )}
            </motion.div>

            {/* Category badge */}
            <motion.div
              variants={fadeUp}
              custom={2}
              className="bg-white rounded-2xl border border-gray-200 p-6 text-center"
            >
              <div
                className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-3"
                style={{ backgroundColor: '#0A246315' }}
              >
                <MapPin className="w-7 h-7 text-[#0A2463]" />
              </div>
              <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold">
                Categoria
              </p>
              <p className="text-lg font-bold text-[#0A2463] mt-1">
                {catInfo?.label ?? ponto.categoria}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════
          Pontos Próximos
      ═════════════════════════════════════════════════════════ */}
      {nearby.length > 0 && (
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
              className="text-center mb-10"
            >
              <motion.h2
                variants={fadeUp}
                custom={0}
                className="text-2xl sm:text-3xl font-bold text-[#0A2463]"
              >
                Pontos Próximos
              </motion.h2>
              <motion.p variants={fadeUp} custom={1} className="mt-2 text-gray-500">
                Outros pontos turísticos em {ponto.cidade}
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {nearby.map((n, i) => (
                <motion.div key={n.id} variants={fadeUp} custom={i}>
                  <NearbyCard ponto={n} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* ═════════════════════════════════════════════════════════
          CTA Bottom
      ═════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-gradient-to-r from-[#0A2463] to-[#14A76C]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Quer visitar {ponto.nome}?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Solicite um transporte até aqui ou inclua no seu city tour personalizado pela Baixada
            Santista.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={transportUrl}
              className="flex items-center gap-2 bg-white hover:bg-gray-100 text-[#0A2463] font-bold px-8 py-4 rounded-full transition-colors shadow-lg"
            >
              <Car className="w-5 h-5" />
              Pedir Transporte
            </Link>
            <Link
              href={cityTourUrl}
              className="flex items-center gap-2 bg-[#F5A623] hover:bg-[#e6951c] text-[#0A2463] font-bold px-8 py-4 rounded-full transition-colors shadow-lg"
            >
              <Compass className="w-5 h-5" />
              Incluir no City Tour
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Gallery Modal */}
      <AnimatePresence>
        {galleryOpen && allPhotos.length > 0 && (
          <GalleryModal
            photos={allPhotos}
            initialIndex={galleryIndex}
            onClose={() => setGalleryOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
