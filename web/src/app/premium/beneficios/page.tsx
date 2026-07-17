'use client';

import SeoMeta from '@/components/seo/SeoMeta';
import PremiumBreadcrumb from '@/components/premium/PremiumBreadcrumb';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Fuel,
  Wrench,
  Droplet,
  Droplets,
  CircleDot,
  Zap,
  Hammer,
  ShoppingBag,
  Utensils,
  Pill,
  Dumbbell,
  Scissors,
  Stethoscope,
  Store,
  MapPin,
  Phone,
  MessageCircle,
  BadgeCheck,
  Crown,
  CheckCircle2,
  Loader2,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { BeneficioParceiro, BeneficioCategoria } from '@/lib/supabase';
import { BENEFICIO_CATEGORIA_LABELS } from '@/lib/supabase';

// ─── Mapa de ícones por categoria ────────────────────────────
const CATEGORIA_ICON: Record<BeneficioCategoria, LucideIcon> = {
  combustivel: Fuel,
  oficina: Wrench,
  troca_oleo: Droplet,
  lavagem: Droplets,
  pneus: CircleDot,
  auto_eletrica: Zap,
  funilaria: Hammer,
  loja_auto: ShoppingBag,
  alimentacao: Utensils,
  farmacia: Pill,
  academia: Dumbbell,
  barbearia: Scissors,
  clinica: Stethoscope,
  outro: Store,
};

// ─── Animações ───────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

// ─── Filtro ──────────────────────────────────────────────────
type Filtro = 'todos' | BeneficioCategoria;

const FILTROS: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'combustivel', label: 'Combustível' },
  { id: 'oficina', label: 'Oficina' },
  { id: 'troca_oleo', label: 'Troca de Óleo' },
  { id: 'lavagem', label: 'Lavagem' },
  { id: 'pneus', label: 'Pneus' },
  { id: 'auto_eletrica', label: 'Auto Elétrica' },
  { id: 'funilaria', label: 'Funilaria' },
  { id: 'loja_auto', label: 'Loja Auto' },
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'farmacia', label: 'Farmácia' },
  { id: 'academia', label: 'Academia' },
  { id: 'barbearia', label: 'Barbearia' },
  { id: 'clinica', label: 'Clínica' },
];

// ─── Fallback data ───────────────────────────────────────────
const FALLBACK_BENEFICIOS: BeneficioParceiro[] = [
  {
    id: 'b1',
    nome: 'Auto Posto Santos',
    categoria: 'combustivel',
    desconto_descricao: 'R$ 0,20 de desconto por litro',
    desconto_percentual: null,
    condicoes: 'Válido para pagamento à vista ou PIX. Limite de 60 litros por abastecimento.',
    telefone: '13999990001',
    whatsapp: '5513999990001',
    endereco: null,
    cidade: 'Santos',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: true,
    desconto_dna_pass: 'R$ 0,35 por litro',
    ativo: true,
    destaque: true,
    verificado: true,
    ordem: 1,
  },
  {
    id: 'b2',
    nome: 'Oficina Central Motors',
    categoria: 'oficina',
    desconto_descricao: '15% em revisões',
    desconto_percentual: 15,
    condicoes: 'Aplicável em revisões completas. Peças não inclusas no desconto.',
    telefone: '13999990002',
    whatsapp: null,
    endereco: null,
    cidade: 'Santos',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: false,
    desconto_dna_pass: null,
    ativo: true,
    destaque: false,
    verificado: true,
    ordem: 2,
  },
  {
    id: 'b3',
    nome: 'Troca Óleo Express',
    categoria: 'troca_oleo',
    desconto_descricao: '20% em troca de óleo',
    desconto_percentual: 20,
    condicoes: null,
    telefone: '13999990003',
    whatsapp: '5513999990003',
    endereco: null,
    cidade: 'São Vicente',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: true,
    desconto_dna_pass: '15% + balanceamento grátis',
    ativo: true,
    destaque: true,
    verificado: false,
    ordem: 3,
  },
  {
    id: 'b4',
    nome: 'Lava Jato Aqua',
    categoria: 'lavagem',
    desconto_descricao: '25% em lavagem',
    desconto_percentual: 25,
    condicoes: 'Inclui lavagem simples e completa. Não inclui polimento.',
    telefone: '13999990004',
    whatsapp: null,
    endereco: null,
    cidade: 'Praia Grande',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: false,
    desconto_dna_pass: null,
    ativo: true,
    destaque: false,
    verificado: false,
    ordem: 4,
  },
  {
    id: 'b5',
    nome: 'Pneus & Cia',
    categoria: 'pneus',
    desconto_descricao: '10% em pneus novos',
    desconto_percentual: 10,
    condicoes: 'Válido para pneus das marcas Pirelli, Michelin e Goodyear.',
    telefone: '13999990005',
    whatsapp: '5513999990005',
    endereco: null,
    cidade: 'Santos',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: true,
    desconto_dna_pass: '15% + balanceamento grátis',
    ativo: true,
    destaque: false,
    verificado: false,
    ordem: 5,
  },
  {
    id: 'b6',
    nome: 'Auto Elétrica Silva',
    categoria: 'auto_eletrica',
    desconto_descricao: '15% em serviços',
    desconto_percentual: 15,
    condicoes: null,
    telefone: '13999990006',
    whatsapp: null,
    endereco: null,
    cidade: 'Santos',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: false,
    desconto_dna_pass: null,
    ativo: true,
    destaque: false,
    verificado: false,
    ordem: 6,
  },
  {
    id: 'b7',
    nome: 'Restaurante do Porto',
    categoria: 'alimentacao',
    desconto_descricao: 'Refeição a R$ 15,90',
    desconto_percentual: null,
    condicoes: 'Refeição completa (PF). Segunda a sábado, das 11h às 15h.',
    telefone: '13999990007',
    whatsapp: null,
    endereco: null,
    cidade: 'Santos',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: true,
    desconto_dna_pass: 'Refeição a R$ 12,90',
    ativo: true,
    destaque: true,
    verificado: false,
    ordem: 7,
  },
  {
    id: 'b8',
    nome: 'Farmácia Saúde Total',
    categoria: 'farmacia',
    desconto_descricao: '12% em medicamentos',
    desconto_percentual: 12,
    condicoes: 'Medicamentos de marca. Não cumulativo com outros convênios.',
    telefone: '13999990008',
    whatsapp: '5513999990008',
    endereco: null,
    cidade: 'São Vicente',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: false,
    desconto_dna_pass: null,
    ativo: true,
    destaque: false,
    verificado: false,
    ordem: 8,
  },
];

// ─── Helper: formatar telefone ───────────────────────────────
function formatarTelefone(tel: string): string {
  const limpo = tel.replace(/\D/g, '');
  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  }
  if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }
  return tel;
}

// ════════════════════════════════════════════════════════════
// PÁGINA
// ════════════════════════════════════════════════════════════
export default function BeneficiosPage() {
  const { user } = useAuth();
  const [beneficios, setBeneficios] = useState<BeneficioParceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroAtivo, setFiltroAtivo] = useState<Filtro>('todos');

  useEffect(() => {
    let active = true;

    supabase
      .from('beneficios_parceiros')
      .select('*')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('ordem', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data && data.length > 0) {
          setBeneficios(data as BeneficioParceiro[]);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const beneficiosDisplay = beneficios.length > 0 ? beneficios : FALLBACK_BENEFICIOS;

  const beneficiosFiltrados = useMemo(() => {
    if (filtroAtivo === 'todos') return beneficiosDisplay;
    return beneficiosDisplay.filter((b) => b.categoria === filtroAtivo);
  }, [beneficiosDisplay, filtroAtivo]);

  const totalDNA = beneficiosDisplay.filter((b) => b.dna_pass_exclusivo).length;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SeoMeta title='Central de Benefícios' description='Convênios exclusivos para motoristas DNA: combustível, oficinas, lavagem, pneus, alimentação, farmácias e muito mais.' />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 py-20 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <PremiumBreadcrumb current="Benefícios" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-6"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>

            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-block text-sm font-semibold tracking-widest uppercase text-accent mb-3"
            >
              Convênios para Motoristas
            </motion.span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
              Central de Benefícios
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-lg text-white/80">
              Combustível, oficinas, lavagem, alimentação e muito mais.
              Descontos reais para quem dirige pela DNA.
            </p>

            {/* Contadores rápidos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-sm font-semibold text-white">
                <Store className="w-4 h-4" />
                {beneficiosDisplay.length} parceiros
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30 px-4 py-1.5 text-sm font-semibold text-white">
                <Crown className="w-4 h-4" />
                {totalDNA} exclusivos DNA Pass
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Filtros ──────────────────────────────────────── */}
      <section className="py-8 px-6 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-30">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {FILTROS.map((filtro) => {
              const isActive = filtroAtivo === filtro.id;
              return (
                <button
                  key={filtro.id}
                  onClick={() => setFiltroAtivo(filtro.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filtro.id !== 'todos' &&
                    (() => {
                      const Icon = CATEGORIA_ICON[filtro.id as BeneficioCategoria];
                      return <Icon className="w-3.5 h-3.5" />;
                    })()}
                  {filtro.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Grid de Benefícios ───────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm animate-pulse"
                >
                  <div className="w-12 h-12 rounded-xl bg-gray-200 mb-4" />
                  <div className="h-5 w-2/3 bg-gray-200 rounded mb-3" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded mb-6" />
                  <div className="h-3 w-full bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-3/4 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : beneficiosFiltrados.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-bold text-primary">Nenhum parceiro nesta categoria</p>
              <p className="text-sm text-gray-500 mt-2">
                Tente outro filtro ou confira todas as opções.
              </p>
              <button
                onClick={() => setFiltroAtivo('todos')}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark transition-colors"
              >
                Ver todos
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {beneficiosFiltrados.map((beneficio, i) => {
                  const Icon = CATEGORIA_ICON[beneficio.categoria] || Store;
                  const catInfo = BENEFICIO_CATEGORIA_LABELS[beneficio.categoria];
                  const cor = catInfo?.color || '#0A2463';

                  return (
                    <motion.div
                      key={beneficio.id}
                      layout
                      variants={fadeUp}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`relative rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 ${
                        beneficio.destaque
                          ? 'border-accent/40 ring-1 ring-accent/20'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      {/* Badges topo */}
                      <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                        {beneficio.dna_pass_exclusivo && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-bold text-accent-dark">
                            <Crown className="w-3 h-3" />
                            DNA Pass
                          </span>
                        )}
                        {beneficio.verificado && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-bold text-secondary">
                            <BadgeCheck className="w-3 h-3" />
                            Verificado
                          </span>
                        )}
                      </div>

                      {/* Ícone da categoria */}
                      <div
                        className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm"
                        style={{ backgroundColor: `${cor}15` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: cor }} />
                      </div>

                      {/* Categoria label */}
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        {catInfo?.label || beneficio.categoria}
                      </span>

                      {/* Nome do parceiro */}
                      <h3 className="text-lg font-extrabold text-primary mt-1">
                        {beneficio.nome}
                      </h3>

                      {/* Desconto em destaque */}
                      <p className="text-xl font-extrabold text-secondary mt-2">
                        {beneficio.desconto_descricao}
                      </p>

                      {/* DNA Pass desconto extra */}
                      {beneficio.dna_pass_exclusivo && beneficio.desconto_dna_pass && (
                        <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-accent/5 border border-accent/10 px-3 py-2">
                          <Crown className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-600">
                            <span className="font-bold text-accent-dark">DNA Pass:</span>{' '}
                            {beneficio.desconto_dna_pass}
                          </p>
                        </div>
                      )}

                      {/* Condições */}
                      {beneficio.condicoes && (
                        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                          {beneficio.condicoes}
                        </p>
                      )}

                      {/* Cidade */}
                      <div className="mt-4 flex items-center gap-1.5 text-sm text-gray-500">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {beneficio.cidade}
                      </div>

                      {/* Botões de contato */}
                      {(beneficio.telefone || beneficio.whatsapp) && (
                        <div className="mt-4 flex items-center gap-2 pt-4 border-t border-gray-100">
                          {beneficio.telefone && (
                            <a
                              href={`tel:${beneficio.telefone}`}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary/5 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors flex-1"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              Ligar
                            </a>
                          )}
                          {beneficio.whatsapp && (
                            <a
                              href={`https://wa.me/${beneficio.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-secondary/10 px-3 py-2 text-xs font-bold text-secondary hover:bg-secondary/20 transition-colors flex-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WhatsApp
                            </a>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Resultados da busca */}
          {!loading && beneficiosFiltrados.length > 0 && (
            <p className="text-center text-sm text-gray-400 mt-10">
              Mostrando {beneficiosFiltrados.length} de {beneficiosDisplay.length} parceiros
            </p>
          )}
        </div>
      </section>

      {/* ─── CTA DNA Pass ─────────────────────────────────── */}
      <section className="py-16 px-6 bg-gradient-to-br from-primary to-primary-dark">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Desbloqueie benefícios exclusivos
            </h2>
            <p className="text-white/70 text-lg mb-8">
              Assine o DNA Pass e tenha acesso a descontos ampliados em todos os parceiros,
              comissão reduzida e muito mais.
            </p>
            <Link
              href="/premium/dna-pass"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 text-base font-bold text-primary shadow-xl shadow-accent/30 transition-all hover:bg-accent-dark hover:scale-105"
            >
              <Crown className="w-5 h-5" />
              Conhecer DNA Pass
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
