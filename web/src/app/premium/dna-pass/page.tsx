'use client';

import SeoMeta from '@/components/seo/SeoMeta';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  CreditCard,
  Check,
  Star,
  Percent,
  Sparkles,
  Headphones,
  BarChart3,
  Target,
  FileText,
  BadgeCheck,
  Crown,
  Clock,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase, formatarBRL } from '@/lib/supabase';
import type { DNAPassPlano, DNAPassBeneficio, DNAPassAssinatura } from '@/lib/supabase';

const BENEFICIO_ICON_MAP: Record<string, typeof Percent> = {
  percent: Percent,
  sparkles: Sparkles,
  tag: BadgeCheck,
  headphones: Headphones,
  'bar-chart-3': BarChart3,
  target: Target,
  'file-text': FileText,
  'badge-check': BadgeCheck,
};

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

// ─── Fallback data ──────────────────────────────────────────
const FALLBACK_PLANOS: DNAPassPlano[] = [
  {
    id: 'mensal',
    nome: 'Mensal',
    slug: 'mensal',
    preco_mensal: 29.9,
    preco_total: 29.9,
    desconto_percentual: 0,
    periodo_meses: 1,
    descricao: 'Comece sua jornada DNA Pass sem compromisso de longo prazo. Cancele quando quiser.',
    descricao_curta: 'Flexível, sem fidelidade',
    destaque: false,
    badge: null,
    cor_hex: '#0A2463',
    ativo: true,
    ordem: 1,
  },
  {
    id: 'trimestral',
    nome: 'Trimestral',
    slug: 'trimestral',
    preco_mensal: 24.9,
    preco_total: 74.7,
    desconto_percentual: 16.72,
    periodo_meses: 3,
    descricao: 'Economize 17% com o plano trimestral. Ideal para motoristas que já conhecem o valor da DNA.',
    descricao_curta: 'Economize 17%',
    destaque: true,
    badge: 'Mais Popular',
    cor_hex: '#14A76C',
    ativo: true,
    ordem: 2,
  },
  {
    id: 'anual',
    nome: 'Anual',
    slug: 'anual',
    preco_mensal: 19.9,
    preco_total: 238.8,
    desconto_percentual: 33.44,
    periodo_meses: 12,
    descricao: 'Máxima economia com o plano anual. 33% de desconto para motoristas comprometidos.',
    descricao_curta: 'Economize 33%',
    destaque: false,
    badge: 'Melhor Custo-Benefício',
    cor_hex: '#F5A623',
    ativo: true,
    ordem: 3,
  },
];

const FALLBACK_BENEFICIOS: DNAPassBeneficio[] = [
  { id: 'b1', titulo: 'Comissão Reduzida', descricao: 'Pague menos comissão em todas as corridas — de 20% para 15%', icone: 'percent', categoria: 'comissao', valor: '5%', ordem: 1, ativo: true },
  { id: 'b2', titulo: 'Prioridade em Novidades', descricao: 'Seja o primeiro a testar novos recursos e funcionalidades', icone: 'sparkles', categoria: 'prioridade', valor: null, ordem: 2, ativo: true },
  { id: 'b3', titulo: 'Descontos Ampliados', descricao: 'Descontos maiores nos parceiros da Central de Benefícios', icone: 'tag', categoria: 'desconto', valor: 'até 30%', ordem: 3, ativo: true },
  { id: 'b4', titulo: 'Atendimento Prioritário', descricao: 'Suporte dedicado com resposta em até 2 horas', icone: 'headphones', categoria: 'suporte', valor: '2h', ordem: 4, ativo: true },
  { id: 'b5', titulo: 'Painel Financeiro Pro', descricao: 'Dashboard avançado com gráficos, exportação e análises', icone: 'bar-chart-3', categoria: 'exclusivo', valor: null, ordem: 5, ativo: true },
  { id: 'b6', titulo: 'Metas Inteligentes', descricao: 'Metas personalizadas com previsões baseadas em IA', icone: 'target', categoria: 'exclusivo', valor: null, ordem: 6, ativo: true },
  { id: 'b7', titulo: 'Relatórios de Performance', descricao: 'Relatórios mensais detalhados de sua performance', icone: 'file-text', categoria: 'exclusivo', valor: null, ordem: 7, ativo: true },
  { id: 'b8', titulo: 'Selo DNA Pass', descricao: 'Selo exclusivo visível no seu perfil para passageiros', icone: 'badge-check', categoria: 'exclusivo', valor: null, ordem: 8, ativo: true },
];

export default function DNAPassPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [planos, setPlanos] = useState<DNAPassPlano[]>([]);
  const [beneficios, setBeneficios] = useState<DNAPassBeneficio[]>([]);
  const [assinaturaAtual, setAssinaturaAtual] = useState<DNAPassAssinatura | null>(null);
  const [loading, setLoading] = useState(true);
  const [assinando, setAssinando] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      supabase
        .from('dna_pass_planos')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) setPlanos(data as DNAPassPlano[]);
        }),
      supabase
        .from('dna_pass_beneficios')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) setBeneficios(data as DNAPassBeneficio[]);
        }),
      user
        ? supabase
            .from('dna_pass_assinaturas')
            .select('*, plano:dna_pass_planos(*)')
            .eq('motorista_id', user.id)
            .in('status', ['trial', 'ativa'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data }) => data && setAssinaturaAtual(data as unknown as DNAPassAssinatura))
        : Promise.resolve(),
    ]).finally(() => setLoading(false));
  }, [user]);

  const planosDisplay = planos.length > 0 ? planos : FALLBACK_PLANOS;
  const beneficiosDisplay = beneficios.length > 0 ? beneficios : FALLBACK_BENEFICIOS;

  const handleAssinar = async (plano: DNAPassPlano) => {
    if (!user) return;
    setPlanoSelecionado(plano.id);
    setAssinando(true);

    try {
      const inicio = new Date();
      const fim = new Date();
      fim.setMonth(fim.getMonth() + plano.periodo_meses);
      const proximaCobranca = new Date(fim);

      const { error } = await supabase.from('dna_pass_assinaturas').insert({
        motorista_id: user.id,
        plano_id: plano.id,
        status: 'trial',
        inicio_em: inicio.toISOString(),
        fim_em: fim.toISOString(),
        proxima_cobranca: proximaCobranca.toISOString(),
        auto_renovar: true,
        valor_pago: plano.preco_total,
        metodo_pagamento: 'pix',
      });

      if (error) throw error;

      // Refresh
      const { data: novaAss } = await supabase
        .from('dna_pass_assinaturas')
        .select('*, plano:dna_pass_planos(*)')
        .eq('motorista_id', user.id)
        .eq('status', 'trial')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (novaAss) setAssinaturaAtual(novaAss as unknown as DNAPassAssinatura);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err) {
      console.error('Erro ao assinar:', err);
      alert('Erro ao processar assinatura. Tente novamente.');
    } finally {
      setAssinando(false);
      setPlanoSelecionado(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SeoMeta title='DNA Pass' description='Assinatura DNA Pass: comissão reduzida, prioridade em novidades, descontos ampliados e atendimento prioritário para motoristas.' />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary-dark to-primary py-20 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-secondary-light blur-3xl" />
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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-6"
            >
              <CreditCard className="w-8 h-8 text-white" />
            </motion.div>

            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-block text-sm font-semibold tracking-widest uppercase text-accent mb-3"
            >
              Assinatura Premium DNA
            </motion.span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
              DNA Pass
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-lg text-white/80">
              Comissão reduzida. Prioridade em tudo. Benefícios que pagam a assinatura.
            </p>
          </motion.div>

          {/* Assinatura ativa */}
          {user && !authLoading && assinaturaAtual && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10 max-w-md mx-auto"
            >
              <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary to-secondary-dark flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white/60 text-xs font-medium uppercase tracking-wider">DNA Pass</p>
                  <p className="text-xl font-extrabold text-white">
                    {assinaturaAtual.plano?.nome || 'Ativo'}
                  </p>
                  <p className="text-white/60 text-xs mt-0.5">
                    Renova em {new Date(assinaturaAtual.fim_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Planos ───────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">
              Escolha seu Plano
            </h2>
            <p className="mt-3 text-gray-500">
              Todos os planos incluem 7 dias grátis. Sem fidelidade.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {planosDisplay.map((plano, i) => {
              const isDestaque = plano.destaque;
              const isAssinado = assinaturaAtual?.plano_id === plano.id;

              return (
                <motion.div
                  key={plano.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`relative rounded-2xl p-8 transition-all ${
                    isDestaque
                      ? 'bg-gradient-to-br from-secondary to-secondary-dark text-white shadow-2xl scale-105 md:-mt-4 md:mb-4'
                      : 'bg-white border-2 border-gray-100 hover:border-gray-200 shadow-sm'
                  }`}
                >
                  {plano.badge && (
                    <span
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full px-4 py-1 text-xs font-bold shadow-md ${
                        isDestaque ? 'bg-accent text-primary' : 'bg-primary text-white'
                      }`}
                    >
                      <Star className="w-3 h-3 fill-current" />
                      {plano.badge}
                    </span>
                  )}

                  <h3 className={`text-xl font-extrabold ${isDestaque ? 'text-white' : 'text-primary'}`}>
                    {plano.nome}
                  </h3>
                  {plano.descricao_curta && (
                    <p className={`text-sm mt-1 ${isDestaque ? 'text-white/70' : 'text-gray-500'}`}>
                      {plano.descricao_curta}
                    </p>
                  )}

                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-sm font-medium ${isDestaque ? 'text-white/60' : 'text-gray-400'}`}>
                        R$
                      </span>
                      <span className={`text-4xl font-extrabold ${isDestaque ? 'text-white' : 'text-primary'}`}>
                        {plano.preco_mensal.toFixed(2).replace('.', ',')}
                      </span>
                      <span className={`text-sm ${isDestaque ? 'text-white/60' : 'text-gray-400'}`}>
                        /mês
                      </span>
                    </div>
                    {plano.desconto_percentual > 0 && (
                      <p className={`text-xs font-semibold mt-1 ${isDestaque ? 'text-accent-light' : 'text-secondary'}`}>
                        Economize {plano.desconto_percentual.toFixed(0)}%
                      </p>
                    )}
                    <p className={`text-xs mt-1 ${isDestaque ? 'text-white/50' : 'text-gray-400'}`}>
                      Cobrado {formatarBRL(plano.preco_total)} a cada {plano.periodo_meses}mês(es)
                    </p>
                  </div>

                  <p className={`text-sm mt-4 ${isDestaque ? 'text-white/70' : 'text-gray-500'}`}>
                    {plano.descricao}
                  </p>

                  {user ? (
                    isAssinado ? (
                      <div className={`mt-6 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold ${isDestaque ? 'bg-white/20 text-white' : 'bg-secondary/10 text-secondary'}`}>
                        <Check className="w-4 h-4" />
                        Plano Ativo
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAssinar(plano)}
                        disabled={assinando}
                        className={`mt-6 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all disabled:opacity-50 ${
                          isDestaque
                            ? 'bg-white text-secondary hover:bg-white/90 shadow-lg'
                            : `text-white shadow-lg hover:opacity-90`
                        }`}
                        style={!isDestaque ? { backgroundColor: plano.cor_hex } : undefined}
                      >
                        {assinando && planoSelecionado === plano.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processando…
                          </>
                        ) : (
                          <>
                            Começar Grátis
                            <Sparkles className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    )
                  ) : (
                    <Link
                      href="/cadastro"
                      className={`mt-6 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                        isDestaque
                          ? 'bg-white text-secondary hover:bg-white/90 shadow-lg'
                          : 'bg-primary text-white hover:bg-primary-dark shadow-lg'
                      }`}
                    >
                      Cadastre-se
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Benefícios ───────────────────────────────────── */}
      <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">
              O que você ganha
            </h2>
            <p className="mt-3 text-gray-500">
              Todos os benefícios incluídos em qualquer plano DNA Pass.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="grid sm:grid-cols-2 gap-4"
          >
            {beneficiosDisplay.map((benefit, i) => {
              const Icon = BENEFICIO_ICON_MAP[benefit.icone] || Check;
              return (
                <motion.div
                  key={benefit.id || i}
                  variants={fadeUp}
                  custom={i}
                  className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm border border-gray-100"
                >
                  <div className="shrink-0 w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-primary text-sm">{benefit.titulo}</h3>
                      {benefit.valor && (
                        <span className="text-xs bg-accent/10 text-accent-dark px-2 py-0.5 rounded-full font-semibold">
                          {benefit.valor}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{benefit.descricao}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Success Toast ────────────────────────────────── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm"
          >
            <BadgeCheck className="w-6 h-6 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">Bem-vindo ao DNA Pass!</p>
              <p className="text-white/80 text-xs mt-0.5">
                Seus 7 dias grátis começaram agora.
              </p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="text-white/70 hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
