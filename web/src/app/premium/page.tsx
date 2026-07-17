'use client';

import SeoMeta from '@/components/seo/SeoMeta';
import JsonLd from '@/components/seo/JsonLd';
import SocialShare from '@/components/premium/SocialShare';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Crown,
  Shield,
  Award,
  Gem,
  Star,
  Gift,
  CreditCard,
  Users,
  HeartPulse,
  GraduationCap,
  MapPin,
  Bot,
  BarChart3,
  Target,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { MotoristaFundador, MotoristaNivelAtual, DNAPassAssinatura } from '@/lib/supabase';

// ─── Module definitions ──────────────────────────────────────
interface PremiumModule {
  id: string;
  title: string;
  description: string;
  icon: typeof Crown;
  href: string;
  status: 'available' | 'soon';
  category: 'fase1' | 'fase2' | 'fase3' | 'fase4';
  gradient: string;
}

const MODULES: PremiumModule[] = [
  // Fase 1 — Disponível agora
  {
    id: 'fundadores',
    title: 'Motoristas Fundadores',
    description: 'Programa exclusivo para os primeiros motoristas da DNA.',
    icon: Crown,
    href: '/premium/fundadores',
    status: 'available',
    category: 'fase1',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'niveis',
    title: 'Sistema de Níveis',
    description: 'Evolua de Bronze a Elite e desbloqueie benefícios.',
    icon: Shield,
    href: '/premium/niveis',
    status: 'available',
    category: 'fase1',
    gradient: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'dna-pass',
    title: 'DNA Pass',
    description: 'Assinatura com comissão reduzida e benefícios exclusivos.',
    icon: CreditCard,
    href: '/premium/dna-pass',
    status: 'available',
    category: 'fase1',
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    id: 'recompensas',
    title: 'Recompensas',
    description: 'Troque seus pontos por benefícios reais.',
    icon: Gift,
    href: '/recompensas',
    status: 'available',
    category: 'fase1',
    gradient: 'from-purple-500 to-pink-600',
  },
  // Fase 2 — Disponível agora
  {
    id: 'beneficios',
    title: 'Central de Benefícios',
    description: 'Convênios com postos, oficinas, lavagens e mais.',
    icon: Sparkles,
    href: '/premium/beneficios',
    status: 'available',
    category: 'fase2',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'saude',
    title: 'Saúde e Bem-estar',
    description: 'Psicólogos, nutricionistas, academias e clínicas.',
    icon: HeartPulse,
    href: '/premium/saude',
    status: 'available',
    category: 'fase2',
    gradient: 'from-red-500 to-rose-600',
  },
  {
    id: 'educacao',
    title: 'Educação',
    description: 'Cursos, certificados e capacitação profissional.',
    icon: GraduationCap,
    href: '/premium/educacao',
    status: 'available',
    category: 'fase2',
    gradient: 'from-indigo-500 to-purple-600',
  },
  // Fase 3 — Disponível agora
  {
    id: 'comunidade',
    title: 'Área da Comunidade',
    description: 'Fórum, sugestões, votações e grupos por cidade.',
    icon: Users,
    href: '/premium/comunidade',
    status: 'available',
    category: 'fase3',
    gradient: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'ia',
    title: 'IA para Motoristas',
    description: 'Assistente inteligente de demanda e melhores regiões.',
    icon: Bot,
    href: '/premium/ia',
    status: 'available',
    category: 'fase3',
    gradient: 'from-violet-500 to-fuchsia-600',
  },
  {
    id: 'demanda',
    title: 'Previsão de Demanda',
    description: 'Mapa de calor com eventos, cruzeiros e clima.',
    icon: MapPin,
    href: '/premium/demanda',
    status: 'available',
    category: 'fase3',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    id: 'metas',
    title: 'Metas Inteligentes',
    description: 'Metas personalizadas com previsões baseadas em IA.',
    icon: Target,
    href: '/premium/metas',
    status: 'available',
    category: 'fase3',
    gradient: 'from-lime-500 to-green-600',
  },
  // Fase 4 — Disponível agora
  {
    id: 'seguranca',
    title: 'Sistema de Segurança',
    description: 'Botão SOS, compartilhamento de corrida e monitoramento.',
    icon: ShieldCheck,
    href: '/premium/seguranca',
    status: 'available',
    category: 'fase4',
    gradient: 'from-slate-600 to-gray-800',
  },
  {
    id: 'financeiro',
    title: 'Painel Financeiro Pro',
    description: 'Dashboard avançado com gráficos e exportação.',
    icon: BarChart3,
    href: '/premium/financeiro',
    status: 'available',
    category: 'fase4',
    gradient: 'from-green-600 to-emerald-700',
  },
  {
    id: 'guia',
    title: 'Motorista Guia',
    description: 'Categoria premium para passeios turísticos.',
    icon: Award,
    href: '/premium/guia',
    status: 'available',
    category: 'fase4',
    gradient: 'from-yellow-500 to-amber-600',
  },
];

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

export default function HubPremiumPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [fundador, setFundador] = useState<MotoristaFundador | null>(null);
  const [nivelAtual, setNivelAtual] = useState<MotoristaNivelAtual | null>(null);
  const [assinatura, setAssinatura] = useState<DNAPassAssinatura | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoadingData(false);
      return;
    }
    Promise.allSettled([
      supabase
        .from('motoristas_fundadores')
        .select('*')
        .eq('motorista_id', user.id)
        .eq('selo_ativo', true)
        .maybeSingle()
        .then(({ data }) => data && setFundador(data as MotoristaFundador)),
      supabase
        .from('motorista_nivel_atual')
        .select('*')
        .eq('motorista_id', user.id)
        .maybeSingle()
        .then(({ data }) => data && setNivelAtual(data as MotoristaNivelAtual)),
      supabase
        .from('dna_pass_assinaturas')
        .select('*, plano:dna_pass_planos(*)')
        .eq('motorista_id', user.id)
        .in('status', ['trial', 'ativa'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => data && setAssinatura(data as unknown as DNAPassAssinatura)),
    ]).finally(() => setLoadingData(false));
  }, [user]);

  const pontosAtuais = profile?.pontos ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SeoMeta title="DNA Premium" description="Módulo Premium DNA Mobilidade: benefícios, níveis, educação, saúde, comunidade e tecnologia para motoristas da Baixada Santista." />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: 'DNA Premium — Módulos',
          description: '14 módulos premium para motoristas da DNA Mobilidade',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Motoristas Fundadores' },
            { '@type': 'ListItem', position: 2, name: 'Sistema de Níveis' },
            { '@type': 'ListItem', position: 3, name: 'DNA Pass' },
            { '@type': 'ListItem', position: 4, name: 'Recompensas' },
            { '@type': 'ListItem', position: 5, name: 'Central de Benefícios' },
            { '@type': 'ListItem', position: 6, name: 'Saúde e Bem-estar' },
            { '@type': 'ListItem', position: 7, name: 'Educação' },
            { '@type': 'ListItem', position: 8, name: 'Comunidade' },
            { '@type': 'ListItem', position: 9, name: 'IA para Motoristas' },
            { '@type': 'ListItem', position: 10, name: 'Previsão de Demanda' },
            { '@type': 'ListItem', position: 11, name: 'Metas Inteligentes' },
            { '@type': 'ListItem', position: 12, name: 'Sistema de Segurança' },
            { '@type': 'ListItem', position: 13, name: 'Painel Financeiro Pro' },
            { '@type': 'ListItem', position: 14, name: 'Motorista Guia' },
          ],
        }}
      />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#0d2d73] py-20 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-secondary blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o início
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
              className="inline-flex items-center gap-2 text-sm font-semibold tracking-widest uppercase text-accent mb-4"
            >
              <Sparkles className="w-4 h-4" />
              DNA Mobilidade
            </motion.span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
              Módulo Premium
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-white/70">
              Uma plataforma feita por quem conhece a realidade dos motoristas.
              Renda, benefícios, capacitação, tecnologia e reconhecimento profissional.
            </p>
          </motion.div>

          {/* Status Overview — apenas logado */}
          {user && !authLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-center">
                <Shield className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Nível</p>
                {loadingData ? (
                  <div className="h-6 w-20 rounded bg-white/20 animate-pulse mx-auto mt-1" />
                ) : (
                  <p className="text-white font-bold text-lg mt-0.5">
                    {nivelAtual?.nivel_atual || 'Bronze'}
                  </p>
                )}
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-center">
                <CreditCard className="w-6 h-6 text-secondary mx-auto mb-2" />
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">DNA Pass</p>
                {loadingData ? (
                  <div className="h-6 w-20 rounded bg-white/20 animate-pulse mx-auto mt-1" />
                ) : (
                  <p className="text-white font-bold text-lg mt-0.5">
                    {assinatura ? 'Ativo' : '—'}
                  </p>
                )}
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-center">
                <Crown className={`w-6 h-6 mx-auto mb-2 ${fundador ? 'text-accent' : 'text-white/30'}`} />
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Fundador</p>
                {loadingData ? (
                  <div className="h-6 w-20 rounded bg-white/20 animate-pulse mx-auto mt-1" />
                ) : (
                  <p className="text-white font-bold text-lg mt-0.5">
                    {fundador ? `#${fundador.numero_fundador}` : '—'}
                  </p>
                )}
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-center">
                <Star className="w-6 h-6 text-accent mx-auto mb-2" />
                <p className="text-white/50 text-xs font-medium uppercase tracking-wider">Pontos</p>
                <p className="text-white font-bold text-lg mt-0.5">
                  {pontosAtuais.toLocaleString('pt-BR')}
                </p>
              </div>
            </motion.div>
          )}

          {/* CTA: não-logado */}
          {!user && !authLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-10 text-center"
            >
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold text-primary shadow-lg shadow-accent/25 transition-all hover:bg-accent-dark"
              >
                <Crown className="w-4 h-4" />
                Seja um Motorista DNA
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Módulos ──────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-4xl font-bold text-primary"
            >
              Explore o Módulo Premium
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-3 text-gray-500 max-w-xl mx-auto"
            >
              Tudo o que a DNA oferece para valorizar quem está na estrada todos os dias.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {MODULES.map((mod, i) => {
              const Icon = mod.icon;
              const isAvailable = mod.status === 'available';

              return (
                <motion.div key={mod.id} variants={fadeUp} custom={i}>
                  {isAvailable ? (
                    <Link
                      href={mod.href}
                      className="group block h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-gray-200 hover:-translate-y-1"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-primary mb-1 flex items-center gap-2">
                        {mod.title}
                        {mod.id === 'fundadores' && fundador && (
                          <span className="text-xs bg-accent/10 text-accent-dark px-2 py-0.5 rounded-full font-semibold">
                            Ativo
                          </span>
                        )}
                        {mod.id === 'dna-pass' && assinatura && (
                          <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-semibold">
                            Ativo
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">{mod.description}</p>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-primary group-hover:text-accent transition-colors">
                        Acessar
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Link>
                  ) : (
                    <div className="block h-full rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 transition-all hover:bg-gray-50">
                      <div className="w-12 h-12 rounded-xl bg-gray-200/60 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-400 mb-1 flex items-center gap-2">
                        {mod.title}
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Em breve
                        </span>
                      </h3>
                      <p className="text-sm text-gray-400">{mod.description}</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Filosofia ────────────────────────────────────── */}
      <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <blockquote className="text-2xl md:text-3xl font-bold text-primary leading-snug">
              &ldquo;Uma plataforma feita por quem conhece a realidade dos motoristas
              e pensa primeiro nas pessoas.&rdquo;
            </blockquote>
            <p className="mt-6 text-gray-500 text-lg">
              O objetivo não é apenas transportar passageiros.
              É criar uma mobilidade mais justa, transparente e integrada
              ao turismo e ao comércio da Baixada Santista.
            </p>
            <div className="mt-8 flex justify-center">
              <SocialShare url="/premium" title="DNA Premium — Módulo Premium para Motoristas" />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
