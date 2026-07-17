'use client';

import SeoMeta from '@/components/seo/SeoMeta';
import PremiumBreadcrumb from '@/components/premium/PremiumBreadcrumb';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Target,
  TrendingUp,
  Trophy,
  Calendar,
  Clock,
  Flame,
  CheckCircle2,
  Gift,
  Zap,
  Ship,
  Music,
  MapPin,
  Sparkles,
  Award,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { Meta, MetaProgresso } from '@/lib/supabase';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Fallback ───────────────────────────────────────────────
interface MetaDisplay extends Meta {
  progresso_atual?: number;
  concluida?: boolean;
  dias_restantes?: number;
  bonus_previsto?: string;
  tipo_motorista?: string | null;
}

const FALLBACK_METAS: MetaDisplay[] = [
  {
    id: 'm1',
    nome: 'Corridas do Dia',
    descricao: 'Complete corridas hoje para ganhar bônus',
    tipo: 'corridas_dia',
    objetivo: 10,
    unidade: 'corridas',
    recompensa_tipo: 'bonus',
    recompensa_valor: 30,
    inicio_em: new Date().toISOString(),
    fim_em: null,
    ativa: true,
    recorrente: true,
    tipo_motorista: null,
    created_at: new Date().toISOString(),
    progresso_atual: 6,
    concluida: false,
    bonus_previsto: '+22% de faturamento',
  },
  {
    id: 'm2',
    nome: 'Faturamento da Semana',
    descricao: 'Atinja a meta semanal de faturamento',
    tipo: 'faturamento_semana',
    objetivo: 800,
    unidade: 'reais',
    recompensa_tipo: 'bonus',
    recompensa_valor: 50,
    inicio_em: new Date(Date.now() - 3 * 86400000).toISOString(),
    fim_em: new Date(Date.now() + 4 * 86400000).toISOString(),
    ativa: true,
    recorrente: true,
    tipo_motorista: null,
    created_at: new Date().toISOString(),
    progresso_atual: 520,
    concluida: false,
    dias_restantes: 4,
    bonus_previsto: '+18% de faturamento',
  },
  {
    id: 'm3',
    nome: 'Temporada de Cruzeiros',
    descricao: 'Aproveite a chegada de navios para maximizar ganhos',
    tipo: 'cruzeiro',
    objetivo: 5,
    unidade: 'corridas',
    recompensa_tipo: 'pontos',
    recompensa_valor: 100,
    inicio_em: new Date().toISOString(),
    fim_em: new Date(Date.now() + 7 * 86400000).toISOString(),
    ativa: true,
    recorrente: false,
    tipo_motorista: null,
    created_at: new Date().toISOString(),
    progresso_atual: 2,
    concluida: false,
    dias_restantes: 7,
    bonus_previsto: '+45% de demanda no Concais',
  },
  {
    id: 'm4',
    nome: 'Avaliação 5 Estrelas',
    descricao: 'Mantenha avaliação 5 estrelas por 7 dias seguidos',
    tipo: 'avaliacao',
    objetivo: 7,
    unidade: 'pontos',
    recompensa_tipo: 'badge',
    recompensa_valor: 1,
    inicio_em: new Date(Date.now() - 5 * 86400000).toISOString(),
    fim_em: new Date(Date.now() + 2 * 86400000).toISOString(),
    ativa: true,
    recorrente: false,
    tipo_motorista: null,
    created_at: new Date().toISOString(),
    progresso_atual: 5,
    concluida: false,
    dias_restantes: 2,
    bonus_previsto: 'Selo de Excelência DNA',
  },
];

export default function MetasPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [metas, setMetas] = useState<MetaDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      supabase
        .from('metas')
        .select('*')
        .eq('ativa', true)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setMetas(data as unknown as MetaDisplay[]);
          }
        }),
      user
        ? supabase
            .from('meta_progresso')
            .select('*, meta:metas(*)')
            .eq('motorista_id', user.id)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (data && data.length > 0) {
                // Merge progress into metas
                setMetas((prev) => {
                  const progressMap = new Map(
                    (data as MetaProgresso[]).map((p) => [p.meta_id, p])
                  );
                  return prev.map((m) => ({
                    ...m,
                    progresso_atual: progressMap.get(m.id)?.progresso ?? m.progresso_atual,
                    concluida: progressMap.get(m.id)?.concluida ?? false,
                  }));
                });
              }
            })
        : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [user]);

  const metasDisplay = metas.length > 0 ? metas : FALLBACK_METAS;

  const getProgressoPercentual = (m: MetaDisplay) => {
    if (!m.progresso_atual) return 0;
    return Math.min(100, Math.round((m.progresso_atual / m.objetivo) * 100));
  };

  const getCorBarra = (pct: number) => {
    if (pct >= 80) return 'from-secondary to-secondary-dark';
    if (pct >= 50) return 'from-accent to-accent-dark';
    return 'from-accent2 to-accent2-dark';
  };

  const META_TIPO_ICON: Record<string, typeof Target> = {
    corridas_dia: Target,
    corridas_semana: Calendar,
    corridas_mes: Calendar,
    faturamento_semana: TrendingUp,
    faturamento_mes: TrendingUp,
    avaliacao: Trophy,
    horario_pico: Clock,
    cruzeiro: Ship,
    evento: Music,
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SeoMeta title='Metas Inteligentes' description='Metas personalizadas para motoristas DNA Mobilidade com previsões de faturamento baseadas em IA e eventos da região.' />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-lime-500 via-green-600 to-green-700 py-20 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-secondary-light blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <PremiumBreadcrumb current="Metas" />

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
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-accent-light mb-4"
            >
              <Target className="w-4 h-4" />
              IA + Gamificação
            </motion.span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
              Metas Inteligentes
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-lg text-white/70">
              A plataforma cria metas personalizadas e prevê seu faturamento
              com base em eventos, cruzeiros e demanda da região.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── Metas Ativas ─────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
              Suas Metas
            </h2>
            <p className="text-gray-500">
              Complete metas para ganhar bônus, pontos e selos exclusivos.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="space-y-6"
          >
            {metasDisplay.map((meta, i) => {
              const Icon = META_TIPO_ICON[meta.tipo] || Target;
              const pct = getProgressoPercentual(meta);
              const isConcluida = meta.concluida;
              const faltam = Math.max(0, meta.objetivo - (meta.progresso_atual || 0));

              return (
                <motion.div
                  key={meta.id}
                  variants={fadeUp}
                  custom={i}
                  className={`rounded-2xl border-2 p-6 transition-all ${
                    isConcluida
                      ? 'border-secondary bg-secondary/5'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`shrink-0 w-12 h-12 rounded-xl ${isConcluida ? 'bg-secondary/10' : 'bg-primary/10'} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${isConcluida ? 'text-secondary' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-primary">{meta.nome}</h3>
                        {isConcluida && (
                          <span className="inline-flex items-center gap-1 text-xs bg-secondary text-white px-2 py-0.5 rounded-full font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Concluída!
                          </span>
                        )}
                        {meta.dias_restantes && !isConcluida && (
                          <span className="text-xs bg-accent/10 text-accent-dark px-2 py-0.5 rounded-full font-semibold">
                            {meta.dias_restantes} dias restantes
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{meta.descricao}</p>
                    </div>
                    {/* Recompensa */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-sm font-bold text-accent-dark">
                        <Gift className="w-4 h-4" />
                        {meta.recompensa_tipo === 'bonus' && `R$ ${meta.recompensa_valor}`}
                        {meta.recompensa_tipo === 'pontos' && `${meta.recompensa_valor} pts`}
                        {meta.recompensa_tipo === 'badge' && 'Selo'}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {meta.recompensa_tipo === 'bonus' && 'Bônus'}
                        {meta.recompensa_tipo === 'pontos' && 'Pontos'}
                        {meta.recompensa_tipo === 'badge' && 'Reconhecimento'}
                      </p>
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  {!isConcluida && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-bold text-primary">
                          {meta.progresso_atual?.toLocaleString('pt-BR') || 0}{' '}
                          <span className="text-gray-400 font-normal">/ {meta.objetivo.toLocaleString('pt-BR')} {meta.unidade}</span>
                        </span>
                        <span className="font-bold text-gray-600">{pct}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                          className={`h-full bg-gradient-to-r ${getCorBarra(pct)} rounded-full`}
                        />
                      </div>
                      {faltam > 0 && (
                        <p className="text-xs text-gray-400 mt-1.5">
                          Faltam apenas <span className="font-bold text-gray-600">{faltam.toLocaleString('pt-BR')}</span> {meta.unidade} para atingir sua meta.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Previsão de faturamento */}
                  {meta.bonus_previsto && (
                    <div className="flex items-center gap-2 rounded-xl bg-accent/5 border border-accent/20 px-4 py-2.5">
                      <Sparkles className="w-4 h-4 text-accent-dark shrink-0" />
                      <p className="text-sm text-accent-dark font-medium">
                        {meta.bonus_previsto}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Como funciona ────────────────────────────────── */}
      <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8">
            Como Funcionam as Metas Inteligentes
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-primary mb-2">Metas Personalizadas</h3>
              <p className="text-sm text-gray-500">
                A IA cria metas baseadas no seu perfil e histórico de corridas.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-bold text-primary mb-2">Previsão de Ganhos</h3>
              <p className="text-sm text-gray-500">
                Sabemos quando haverá eventos e cruzeiros para prever seu faturamento.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-accent-dark" />
              </div>
              <h3 className="font-bold text-primary mb-2">Recompensas Reais</h3>
              <p className="text-sm text-gray-500">
                Bônus em dinheiro, pontos e selos de reconhecimento.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
