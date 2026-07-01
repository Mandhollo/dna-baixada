'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Search,
  Star,
  MapPin,
  BadgeCheck,
  Tag,
  Copy,
  Check,
  Percent,
  Ticket,
  ChevronRight,
  Store,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type {
  Estabelecimento,
  EstabelecimentoCategoria,
  CampanhaPromocional,
} from '@/lib/supabase';
import {
  ESTABELECIMENTO_CATEGORIA_LABELS,
  CAMPANHA_TIPO_LABELS,
} from '@/lib/supabase';

/* ─── colour tokens ─── */
const P = '#0A2463';
const S = '#14A76C';
const A = '#F5A623';
const A2 = '#E84855';

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
   STAR RATING
   ══════════════════════════════════════════════════════════ */
function StarRating({ value, total }: { value: number; total: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < full
              ? 'fill-[#F5A623] text-[#F5A623]'
              : i === full && half
                ? 'fill-[#F5A623]/50 text-[#F5A623]'
                : 'text-gray-300'
          }
        />
      ))}
      <span className="ml-1 text-xs text-gray-500">
        {value.toFixed(1)} ({total})
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ESTABELECIMENTO CARD
   ══════════════════════════════════════════════════════════ */
function EstabelecimentoCard({
  est,
}: {
  est: Estabelecimento;
}) {
  const cat = ESTABELECIMENTO_CATEGORIA_LABELS[est.categoria];
  return (
    <Link href={`/parceiros/${est.slug}`}>
      <motion.div
        variants={fadeUp}
        className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
      >
        {/* Image / gradient */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary to-secondary">
          {est.foto_url ? (
            <Image
              src={est.foto_url}
              alt={est.nome}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Store size={48} className="text-white/30" />
            </div>
          )}
          {/* Category badge */}
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase text-white"
            style={{ backgroundColor: cat?.color ?? P }}
          >
            {cat?.label ?? est.categoria}
          </span>
          {/* Verified badge */}
          {est.verificado && (
            <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-secondary backdrop-blur">
              <BadgeCheck size={13} /> Verificado
            </span>
          )}
          {/* Destaque */}
          {est.destaque && (
            <span className="absolute bottom-3 left-3 rounded-full bg-[#F5A623] px-3 py-1 text-[11px] font-bold text-white">
              ⭐ Destaque
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="text-base font-bold text-primary line-clamp-1">
            {est.nome}
          </h3>
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
            <MapPin size={12} />
            {est.bairro ? `${est.bairro} · ` : ''}
            {est.cidade}
          </div>
          <div className="mt-2">
            <StarRating value={est.avaliacao_media} total={est.total_avaliacoes} />
          </div>
          {est.descricao && (
            <p className="mt-2 text-xs text-gray-400 line-clamp-2">{est.descricao}</p>
          )}
          <div className="mt-auto flex items-center justify-end pt-3 text-xs font-semibold text-secondary opacity-0 transition group-hover:opacity-100">
            Ver detalhes <ChevronRight size={14} />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

/* ══════════════════════════════════════════════════════════
   CAMPANHA CARD (Promoção)
   ══════════════════════════════════════════════════════════ */
function CampanhaCard({
  campanha,
  estabelecimentoNome,
}: {
  campanha: CampanhaPromocional & { estabelecimentos?: { nome: string } };
  estabelecimentoNome: string;
}) {
  const [copied, setCopied] = useState(false);
  const tipoInfo = CAMPANHA_TIPO_LABELS[campanha.tipo];

  const handleCopy = useCallback(() => {
    if (!campanha.codigo_cupom) return;
    navigator.clipboard.writeText(campanha.codigo_cupom).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [campanha.codigo_cupom]);

  return (
    <motion.div
      variants={fadeUp}
      className="relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-lg"
    >
      {/* Tipo badge */}
      <span
        className="absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase text-white"
        style={{ backgroundColor: tipoInfo?.color ?? S }}
      >
        {tipoInfo?.label ?? campanha.tipo}
      </span>

      {/* Discount */}
      {campanha.desconto_percentual && campanha.desconto_percentual > 0 && (
        <div className="mb-3 flex items-center gap-2">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ backgroundColor: S }}
          >
            <Percent size={18} />
          </div>
          <span className="text-2xl font-extrabold" style={{ color: S }}>
            {campanha.desconto_percentual}% OFF
          </span>
        </div>
      )}

      <h4 className="mt-1 text-sm font-bold text-primary">{campanha.titulo}</h4>
      <p className="mt-1 text-xs text-gray-500">{estabelecimentoNome}</p>
      {campanha.descricao && (
        <p className="mt-2 text-xs text-gray-400 line-clamp-2">{campanha.descricao}</p>
      )}

      {/* Cupom */}
      {campanha.codigo_cupom && (
        <button
          onClick={handleCopy}
          className="mt-4 flex items-center justify-between rounded-xl border-2 border-dashed border-[#F5A623]/40 bg-[#F5A623]/5 px-4 py-3 transition hover:border-[#F5A623] hover:bg-[#F5A623]/10"
        >
          <div className="flex items-center gap-2">
            <Ticket size={16} className="text-[#F5A623]" />
            <span className="text-sm font-extrabold tracking-widest text-[#F5A623]">
              {campanha.codigo_cupom}
            </span>
          </div>
          {copied ? (
            <Check size={16} className="text-secondary" />
          ) : (
            <Copy size={16} className="text-gray-400" />
          )}
        </button>
      )}

      {/* Validade */}
      <p className="mt-3 text-[10px] text-gray-400">
        Válido até{' '}
        {new Date(campanha.data_fim).toLocaleDateString('pt-BR')}
        {campanha.uso_maximo
          ? ` · ${campanha.usos_realizados}/${campanha.uso_maximo} usos`
          : ''}
      </p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   SKELETON LOADING
   ══════════════════════════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="h-48 animate-pulse bg-gray-200" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
      </div>
    </div>
  );
}

function SkeletonCampanha() {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5">
      <div className="mb-3 h-8 w-24 animate-pulse rounded bg-gray-200" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
      <div className="mt-4 h-12 animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   HERO
   ══════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative overflow-hidden pt-6 pb-16 sm:pb-20">
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-secondary" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(245,166,35,.15),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-12 text-center text-white">
        {/* Back link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur transition hover:bg-white/20 hover:text-white"
          >
            <ArrowLeft size={15} /> Voltar ao início
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-3 text-sm font-semibold uppercase tracking-[.25em] text-[#F5A623]"
        >
          Parceiros DNA Baixada
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl"
        >
          Onde Comer, Beber e Comprar
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="mx-auto mt-4 max-w-2xl text-base text-white/75 sm:text-lg"
        >
          Descubra os melhores estabelecimentos da Baixada Santista com descontos exclusivos para quem anda de DNA.
        </motion.p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */
export default function ParceirosPage() {
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [campanhas, setCampanhas] = useState<(CampanhaPromocional & { estabelecimentos?: { nome: string } })[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<EstabelecimentoCategoria | 'todos'>('todos');

  /* ── fetch data ── */
  useEffect(() => {
    async function load() {
      setLoading(true);
      const hoje = new Date().toISOString();

      const [estRes, campRes] = await Promise.all([
        supabase
          .from('estabelecimentos')
          .select('*')
          .eq('ativo', true)
          .order('destaque', { ascending: false })
          .order('avaliacao_media', { ascending: false }),
        supabase
          .from('campanhas_promocionais')
          .select('*, estabelecimentos(nome)')
          .eq('ativo', true)
          .lte('data_inicio', hoje)
          .gte('data_fim', hoje)
          .order('destaque', { ascending: false }),
      ]);

      if (estRes.data) setEstabelecimentos(estRes.data as Estabelecimento[]);
      if (campRes.data) setCampanhas(campRes.data as (CampanhaPromocional & { estabelecimentos?: { nome: string } })[]);
      setLoading(false);
    }
    load();
  }, []);

  /* ── filtered list ── */
  const filtered = useMemo(() => {
    let list = estabelecimentos;
    if (categoriaAtiva !== 'todos') {
      list = list.filter((e) => e.categoria === categoriaAtiva);
    }
    if (busca.trim()) {
      const q = busca.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.nome.toLowerCase().includes(q) ||
          e.bairro?.toLowerCase().includes(q) ||
          e.cidade.toLowerCase().includes(q),
      );
    }
    return list;
  }, [estabelecimentos, categoriaAtiva, busca]);

  /* ── categories in use ── */
  const categoriasUsadas = useMemo(() => {
    const cats = new Set(estabelecimentos.map((e) => e.categoria));
    return (Object.keys(ESTABELECIMENTO_CATEGORIA_LABELS) as EstabelecimentoCategoria[]).filter(
      (c) => cats.has(c),
    );
  }, [estabelecimentos]);

  /* ── map estabelecimento_id → nome for campanhas ── */
  const estMap = useMemo(() => {
    const m = new Map<string, string>();
    estabelecimentos.forEach((e) => m.set(e.id, e.nome));
    campanhas.forEach((c) => {
      if (c.estabelecimentos?.nome) m.set(c.estabelecimento_id, c.estabelecimentos.nome);
    });
    return m;
  }, [estabelecimentos, campanhas]);

  return (
    <>
      <PageTitle title='Parceiros' />
      <Hero />

      {/* ═══ SEARCH + FILTERS ═══ */}
      <section className="relative z-20 -mt-6 mx-auto max-w-6xl px-6">
        <div className="rounded-2xl bg-white p-5 shadow-lg">
          {/* Search input */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, bairro ou cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          {/* Category chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => setCategoriaAtiva('todos')}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                categoriaAtiva === 'todos'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {categoriasUsadas.map((cat) => {
              const info = ESTABELECIMENTO_CATEGORIA_LABELS[cat];
              const active = categoriaAtiva === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoriaAtiva(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={active ? { backgroundColor: info.color } : undefined}
                >
                  {info.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ PROMOÇÕES ATIVAS ═══ */}
      {campanhas.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-6 flex items-center gap-2"
          >
            <Tag size={20} className="text-[#F5A623]" />
            <h2 className="text-xl font-extrabold text-primary">Promoções Ativas</h2>
          </motion.div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCampanha key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {campanhas.map((c) => (
                <CampanhaCard
                  key={c.id}
                  campanha={c}
                  estabelecimentoNome={estMap.get(c.estabelecimento_id) ?? ''}
                />
              ))}
            </motion.div>
          )}
        </section>
      )}

      {/* ═══ ESTABELECIMENTOS GRID ═══ */}
      <section className="mx-auto mt-12 max-w-6xl px-6 pb-20">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-6 text-xl font-extrabold text-primary"
        >
          Nossos Parceiros{' '}
          {!loading && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </motion.h2>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
            <Store size={48} className="text-gray-300" />
            <p className="mt-4 text-base font-semibold text-gray-400">
              Nenhum estabelecimento encontrado
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Tente outra busca ou categoria
            </p>
            <button
              onClick={() => {
                setBusca('');
                setCategoriaAtiva('todos');
              }}
              className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-bold text-white transition hover:bg-primary-light"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={categoriaAtiva + busca}
              variants={stagger}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((est) => (
                <EstabelecimentoCard key={est.id} est={est} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>
    </>
  );
}
