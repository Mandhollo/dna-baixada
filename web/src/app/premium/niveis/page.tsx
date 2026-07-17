'use client';

import SeoMeta from '@/components/seo/SeoMeta';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  Award,
  Crown,
  Gem,
  Star,
  TrendingUp,
  CheckCircle2,
  Clock,
  Car,
  XCircle,
  Target,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { MotoristaNivel, MotoristaNivelAtual, MotoristaNivelSlug } from '@/lib/supabase';

const NIVEL_ICON_MAP: Record<string, typeof Shield> = {
  shield: Shield,
  'shield-check': ShieldCheck,
  award: Award,
  crown: Crown,
  gem: Gem,
};

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

export default function NiveisPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [niveis, setNiveis] = useState<MotoristaNivel[]>([]);
  const [meuNivel, setMeuNivel] = useState<MotoristaNivelAtual | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      supabase
        .from('motorista_niveis')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .then(({ data }) => {
          if (data) setNiveis(data as MotoristaNivel[]);
        }),
      user
        ? supabase
            .from('motorista_nivel_atual')
            .select('*')
            .eq('motorista_id', user.id)
            .maybeSingle()
            .then(({ data }) => data && setMeuNivel(data as MotoristaNivelAtual))
        : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [user]);

  // Fallback com dados estáticos se não houver dados no banco
  const niveisDisplay: MotoristaNivel[] =
    niveis.length > 0
      ? niveis
      : FALLBACK_NIVEIS;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SeoMeta title='Sistema de Níveis DNA' description='Evolua de Bronze a Elite no sistema de níveis DNA Mobilidade. Comissão reduzida, prioridade e benefícios exclusivos.' />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#0d2d73] py-20 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-secondary blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Premium
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block text-sm font-semibold tracking-widest uppercase text-accent mb-4"
            >
              Evolução e Reconhecimento
            </motion.span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
              Sistema de Níveis
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-white/70">
              Cinco níveis baseados em qualidade. Quanto melhor seu atendimento,
              maior sua visibilidade e seus benefícios.
            </p>
          </motion.div>

          {/* Progresso atual */}
          {user && !authLoading && !loading && meuNivel && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 max-w-lg mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Seu Nível</p>
                    <p className="text-2xl font-extrabold text-white">{meuNivel.nivel_atual}</p>
                  </div>
                  {meuNivel.nivel_destino && (
                    <div className="text-right">
                      <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Próximo</p>
                      <p className="text-lg font-bold text-accent">{meuNivel.nivel_destino}</p>
                    </div>
                  )}
                </div>
                {meuNivel.nivel_destino && (
                  <>
                    <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${meuNivel.progresso_percentual}%` }}
                        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-secondary to-accent"
                      />
                    </div>
                    <p className="text-white/60 text-xs mt-2 text-center">
                      {meuNivel.progresso_percentual}% para alcançar {meuNivel.nivel_destino}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Níveis em detalhe ────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">
              Níveis DNA
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              Conheça cada categoria e o que é preciso para evoluir.
            </p>
          </div>

          <div className="space-y-6">
            {niveisDisplay.map((nivel, i) => {
              const Icon = NIVEL_ICON_MAP[nivel.icone] || Shield;
              const isMeuNivel = meuNivel?.nivel_atual === nivel.nome;

              return (
                <motion.div
                  key={nivel.id || nivel.slug}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`relative rounded-2xl border-2 p-6 transition-all ${
                    isMeuNivel
                      ? 'border-accent shadow-lg bg-accent/5'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  {isMeuNivel && (
                    <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white shadow-md">
                      <Star className="w-3 h-3 fill-white" />
                      Seu nível atual
                    </span>
                  )}

                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Badge do nível */}
                    <div className="flex items-start gap-4 md:w-1/3">
                      <div
                        className={`shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${nivel.cor_gradiente} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold" style={{ color: nivel.cor_hex }}>
                            DNA {nivel.nome}
                          </h3>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ backgroundColor: `${nivel.cor_hex}15`, color: nivel.cor_hex }}
                          >
                            Nível {nivel.ordem}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{nivel.descricao}</p>
                        <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Comissão {nivel.comissao_percentual}%
                        </div>
                      </div>
                    </div>

                    {/* Critérios */}
                    <div className="md:w-1/3">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Requisitos
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2 text-gray-600">
                          <Star className="w-4 h-4 text-accent shrink-0" />
                          Avaliação ≥ {nivel.avaliacao_minima.toFixed(2)}
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                          {nivel.tempo_plataforma_meses} mês(es) na plataforma
                        </li>
                        <li className="flex items-center gap-2 text-gray-600">
                          <Car className="w-4 h-4 text-primary shrink-0" />
                          {nivel.corridas_minimas} corridas
                        </li>
                        {nivel.treinamentos_minimos > 0 && (
                          <li className="flex items-center gap-2 text-gray-600">
                            <GraduationCap className="w-4 h-4 text-secondary shrink-0" />
                            {nivel.treinamentos_minimos} treinamentos
                          </li>
                        )}
                        <li className="flex items-center gap-2 text-gray-600">
                          <XCircle className="w-4 h-4 text-accent2 shrink-0" />
                          Cancelamento ≤ {nivel.taxa_cancelamento_maxima}%
                        </li>
                      </ul>
                    </div>

                    {/* Benefícios */}
                    <div className="md:w-1/3">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Benefícios
                      </p>
                      <ul className="space-y-2 text-sm">
                        {nivel.beneficios.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Critérios de Evolução ────────────────────────── */}
      <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Como Evoluir
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Star, label: 'Avaliação', desc: 'Mantenha nota alta nos atendimentos' },
              { icon: Clock, label: 'Tempo', desc: 'Fidelidade e constância na plataforma' },
              { icon: Car, label: 'Corridas', desc: 'Volume de corridas realizadas' },
              { icon: XCircle, label: 'Cancelamento', desc: 'Baixa taxa de corridas canceladas' },
              { icon: Target, label: 'Pontualidade', desc: 'Chegue no horário aos pontos' },
              { icon: GraduationCap, label: 'Treinamentos', desc: 'Conclua cursos disponíveis' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-xl bg-white p-5 shadow-sm border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="font-bold text-primary text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Fallback se não houver dados no banco ─────────────────
const FALLBACK_NIVEIS: MotoristaNivel[] = [
  {
    id: 'bronze',
    nome: 'Bronze',
    slug: 'bronze' as MotoristaNivelSlug,
    ordem: 1,
    cor_hex: '#CD7F32',
    cor_gradiente: 'from-orange-700 to-amber-800',
    icone: 'shield',
    avaliacao_minima: 4.0,
    tempo_plataforma_meses: 0,
    corridas_minimas: 0,
    taxa_cancelamento_maxima: 100,
    treinamentos_minimos: 0,
    beneficios: ['Acesso à plataforma', 'Central de Benefícios básica', 'Suporte por chat'],
    comissao_percentual: 20,
    prioridade_corridas: 5,
    descricao: 'Todos os motoristas começam aqui. O primeiro passo da sua jornada DNA.',
    ativo: true,
  },
  {
    id: 'prata',
    nome: 'Prata',
    slug: 'prata' as MotoristaNivelSlug,
    ordem: 2,
    cor_hex: '#C0C0C0',
    cor_gradiente: 'from-gray-400 to-gray-600',
    icone: 'shield-check',
    avaliacao_minima: 4.3,
    tempo_plataforma_meses: 1,
    corridas_minimas: 50,
    taxa_cancelamento_maxima: 15,
    treinamentos_minimos: 1,
    beneficios: ['Comissão reduzida (18%)', 'Maior visibilidade no app', 'Acesso a cursos básicos', 'Metas personalizadas'],
    comissao_percentual: 18,
    prioridade_corridas: 4,
    descricao: 'Motorista em evolução, com boas avaliações e dedicação à plataforma.',
    ativo: true,
  },
  {
    id: 'ouro',
    nome: 'Ouro',
    slug: 'ouro' as MotoristaNivelSlug,
    ordem: 3,
    cor_hex: '#FFD700',
    cor_gradiente: 'from-yellow-400 to-amber-600',
    icone: 'award',
    avaliacao_minima: 4.6,
    tempo_plataforma_meses: 3,
    corridas_minimas: 200,
    taxa_cancelamento_maxima: 10,
    treinamentos_minimos: 3,
    beneficios: ['Comissão reduzida (16%)', 'Prioridade em corridas executivas', 'Selo DNA Ouro no perfil', 'Cursos avançados liberados', 'Suporte prioritário'],
    comissao_percentual: 16,
    prioridade_corridas: 3,
    descricao: 'Motorista de excelência, reconhecido pela qualidade e consistência.',
    ativo: true,
  },
  {
    id: 'platinum',
    nome: 'Platinum',
    slug: 'platinum' as MotoristaNivelSlug,
    ordem: 4,
    cor_hex: '#E5E4E2',
    cor_gradiente: 'from-slate-300 to-slate-500',
    icone: 'crown',
    avaliacao_minima: 4.8,
    tempo_plataforma_meses: 6,
    corridas_minimas: 500,
    taxa_cancelamento_maxima: 7,
    treinamentos_minimos: 5,
    beneficios: ['Comissão reduzida (14%)', 'Acesso a transfer de cruzeiros', 'Destaque na busca', 'Convênios premium', 'Motorista Guia liberado', 'Reuniões com a DNA'],
    comissao_percentual: 14,
    prioridade_corridas: 2,
    descricao: 'Elite dos motoristas DNA. Acesso a oportunidades exclusivas e alta visibilidade.',
    ativo: true,
  },
  {
    id: 'elite',
    nome: 'Elite',
    slug: 'elite' as MotoristaNivelSlug,
    ordem: 5,
    cor_hex: '#00CEC9',
    cor_gradiente: 'from-cyan-400 to-teal-600',
    icone: 'gem',
    avaliacao_minima: 4.9,
    tempo_plataforma_meses: 12,
    corridas_minimas: 1000,
    taxa_cancelamento_maxima: 5,
    treinamentos_minimos: 8,
    beneficios: ['Comissão mínima (12%)', 'Máxima prioridade', 'Selo DNA Elite exclusivo', 'Acesso a todos os convênios', 'Certificado de Excelência', 'Voto nas decisões', 'Eventos exclusivos Elite'],
    comissao_percentual: 12,
    prioridade_corridas: 1,
    descricao: 'O nível mais alto. Motoristas que representam o melhor da DNA Mobilidade.',
    ativo: true,
  },
];
