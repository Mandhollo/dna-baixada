'use client';

import SeoMeta from '@/components/seo/SeoMeta';
import JsonLd from '@/components/seo/JsonLd';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Crown,
  Shield,
  CreditCard,
  TrendingUp,
  HeartPulse,
  GraduationCap,
  Users,
  Bot,
  MapPin,
  Target,
  ShieldCheck,
  BarChart3,
  Award,
  Check,
  ArrowRight,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';

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

const FEATURES = [
  { icon: Crown, title: 'Motoristas Fundadores', desc: 'Selo permanente e benefícios exclusivos para os pioneiros.', color: 'from-amber-500 to-orange-600' },
  { icon: Shield, title: 'Sistema de Níveis', desc: 'Evolua de Bronze a Elite e reduz sua comissão até 12%.', color: 'from-blue-600 to-indigo-700' },
  { icon: CreditCard, title: 'DNA Pass', desc: 'Assinatura com 7 dias grátis e até 33% de desconto.', color: 'from-emerald-500 to-green-600' },
  { icon: TrendingUp, title: 'Central de Benefícios', desc: 'Descontos em postos, oficinas, pneus, alimentação e mais.', color: 'from-cyan-500 to-blue-600' },
  { icon: HeartPulse, title: 'Saúde e Bem-estar', desc: 'Psicólogos, nutricionistas e academias com até 30% off.', color: 'from-red-500 to-rose-600' },
  { icon: GraduationCap, title: 'Educação Gratuita', desc: '7 cursos com certificado: direção defensiva, inglês, primeiros socorros.', color: 'from-indigo-500 to-purple-600' },
  { icon: Users, title: 'Comunidade Ativa', desc: 'Fórum, sugestões, votações e grupos por cidade.', color: 'from-teal-500 to-cyan-600' },
  { icon: Bot, title: 'IA para Motoristas', desc: 'Assistente que prevê demanda e melhores regiões.', color: 'from-violet-500 to-fuchsia-600' },
  { icon: MapPin, title: 'Previsão de Demanda', desc: 'Mapa de calor com cruzeiros, eventos e horários de pico.', color: 'from-orange-500 to-red-600' },
  { icon: Target, title: 'Metas Inteligentes', desc: 'Metas com IA que prevêem seu faturamento semanal.', color: 'from-lime-500 to-green-600' },
  { icon: ShieldCheck, title: 'Segurança Total', desc: 'Botão SOS, compartilhamento de corrida e monitoramento.', color: 'from-slate-600 to-gray-800' },
  { icon: BarChart3, title: 'Painel Financeiro Pro', desc: 'Dashboard com gráficos, exportação PDF/Excel e métricas.', color: 'from-green-600 to-emerald-700' },
];

const PASS_BENEFITS = [
  'Comissão reduzida de 20% para 15%',
  'Prioridade em todas as novidades',
  'Descontos ampliados em parceiros',
  'Atendimento prioritário (resposta em 2h)',
  'Painel Financeiro Pro completo',
  'Metas personalizadas com IA',
  'Relatórios mensais de performance',
  'Selo DNA Pass no seu perfil',
];

export default function SobrePremiumPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SeoMeta
        title="DNA Premium — Plataforma Completa para Motoristas"
        description="14 módulos premium: fundadores, níveis, DNA Pass, benefícios, saúde, educação, comunidade, IA e mais. Comissão reduzida, cursos grátis e tecnologia de ponta."
        ogImage="/og-premium.png"
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'Preciso pagar para usar a DNA?', acceptedAnswer: { '@type': 'Answer', text: 'Não. O cadastro é gratuito. Motoristas podem usar a plataforma sem assinatura, com a comissão padrão de 20%.' } },
            { '@type': 'Question', name: 'O DNA Pass tem fidelidade?', acceptedAnswer: { '@type': 'Answer', text: 'Não. Você pode cancelar quando quiser, sem multa. Os 7 dias de teste são totalmente gratuitos.' } },
            { '@type': 'Question', name: 'Os cursos são realmente gratuitos?', acceptedAnswer: { '@type': 'Answer', text: 'Sim! Todos os 7 cursos são gratuitos para motoristas cadastrados, com certificado digital.' } },
            { '@type': 'Question', name: 'Como funcionam os níveis de motorista?', acceptedAnswer: { '@type': 'Answer', text: '5 níveis: Bronze, Prata, Ouro, Platinum e Elite. Cada nível reduz sua comissão de 20% até 12%.' } },
            { '@type': 'Question', name: 'A plataforma atende quais cidades?', acceptedAnswer: { '@type': 'Answer', text: 'Toda a Baixada Santista: Santos, São Vicente, Guarujá, Cubatão, Praia Grande, Mongaguá, Itanhaém e Peruíbe.' } },
          ],
        }}
      />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-[#0d2d73] py-24 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-secondary blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-accent mb-4"
          >
            <Sparkles className="w-4 h-4" /> DNA Mobilidade
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight"
          >
            Não é só um app de corridas.<br />
            <span className="text-accent">É uma plataforma que valoriza você.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-white/70"
          >
            14 módulos premium pensados por quem conhece a realidade dos motoristas.
            Renda, benefícios, capacitação, tecnologia e reconhecimento profissional.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/premium/dna-pass"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3.5 font-bold text-primary shadow-lg shadow-accent/30 transition hover:brightness-110"
            >
              <Crown className="w-5 h-5" /> Começar 7 Dias Grátis
            </Link>
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-3.5 font-bold text-white transition hover:bg-white/10"
            >
              Explorar Módulos <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── 14 Módulos ──────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">Tudo o que você ganha</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              Cada módulo foi criado para resolver uma dor real do motorista profissional.
            </p>
          </div>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={i} variants={fadeUp} custom={i}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:border-gray-200 hover:-translate-y-1"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── DNA Pass Destaque ────────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-br from-secondary via-secondary-dark to-primary">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-accent mb-3">
                  <Zap className="w-3 h-3" /> DNA Pass
                </span>
                <h2 className="text-3xl font-extrabold text-white mb-4">
                  Assine e economize mais do que paga.
                </h2>
                <ul className="space-y-2.5">
                  {PASS_BENEFITS.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-white/80 text-sm">
                      <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center md:w-64 shrink-0">
                <div className="rounded-2xl bg-white p-6 shadow-2xl">
                  <p className="text-sm text-gray-400">A partir de</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-gray-400">R$</span>
                    <span className="text-5xl font-extrabold text-primary">19,90</span>
                  </div>
                  <p className="text-sm text-gray-400">/mês no plano anual</p>
                  <p className="text-xs text-secondary font-bold mt-2">7 dias grátis · Sem fidelidade</p>
                  <Link
                    href="/premium/dna-pass"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-secondary-dark transition-colors w-full justify-center"
                  >
                    Assinar DNA Pass <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Filosofia ────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
            <Star className="w-8 h-8 text-white" />
          </div>
          <blockquote className="text-2xl md:text-3xl font-bold text-primary leading-snug">
            &ldquo;Uma plataforma feita por quem conhece a realidade dos motoristas e pensa primeiro nas pessoas.&rdquo;
          </blockquote>
          <p className="mt-6 text-gray-500 text-lg">
            O objetivo não é apenas transportar passageiros. É criar uma mobilidade mais justa,
            transparente e integrada ao turismo e ao comércio da Baixada Santista.
          </p>
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-12">
            Perguntas Frequentes
          </h2>
          <div className="space-y-4">
            <details className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-primary text-sm">
                Preciso pagar para usar a DNA?
                <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform">&#9662;</span>
              </summary>
              <p className="mt-3 text-sm text-gray-500">
                Não. O cadastro é gratuito. Motoristas podem usar a plataforma sem assinatura,
                com a comissão padrão de 20%. O DNA Pass é opcional e oferece benefícios extras.
              </p>
            </details>
            <details className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-primary text-sm">
                O DNA Pass tem fidelidade?
                <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform">&#9662;</span>
              </summary>
              <p className="mt-3 text-sm text-gray-500">
                Não. Você pode cancelar quando quiser, sem multa. Os 7 dias de teste são
                totalmente gratuitos e você só é cobrado se decidir continuar.
              </p>
            </details>
            <details className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-primary text-sm">
                Os cursos são realmente gratuitos?
                <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform">&#9662;</span>
              </summary>
              <p className="mt-3 text-sm text-gray-500">
                Sim! Todos os 7 cursos disponíveis na plataforma são gratuitos para motoristas
                cadastrados. Ao concluir, você recebe certificado digital e pontos de recompensa.
              </p>
            </details>
            <details className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-primary text-sm">
                Como funcionam os níveis de motorista?
                <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform">&#9662;</span>
              </summary>
              <p className="mt-3 text-sm text-gray-500">
                Existem 5 níveis: Bronze, Prata, Ouro, Platinum e Elite. Você evolui com base
                em avaliação, tempo de plataforma, quantidade de corridas e treinamentos.
                Cada nível reduz sua comissão (de 20% até 12%).
              </p>
            </details>
            <details className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-primary text-sm">
                A plataforma atende quais cidades?
                <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform">&#9662;</span>
              </summary>
              <p className="mt-3 text-sm text-gray-500">
                Toda a Baixada Santista: Santos, São Vicente, Guarujá, Cubatão, Praia Grande,
                Mongaguá, Itanhaém e Peruíbe. Same qualidade em todas as cidades.
              </p>
            </details>
            <details className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between font-bold text-primary text-sm">
                Como faço para me tornar Motorista Guia?
                <span className="ml-4 text-gray-400 group-open:rotate-180 transition-transform">&#9662;</span>
              </summary>
              <p className="mt-3 text-sm text-gray-500">
                É necessário ter nível Ouro ou superior, concluir o curso de Atendimento ao
                Turista e cadastrar seus idiomas. Após isso, basta aguardar a aprovação da equipe.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* ─── CTA Final ────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Pronto para começar?
          </h2>
          <p className="text-gray-500 mb-8">
            Cadastre-se como motorista e desbloqueie todos os módulos premium da DNA.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 font-bold text-white shadow-lg hover:bg-primary-dark transition-colors"
            >
              <Crown className="w-5 h-5" /> Cadastrar como Motorista
            </Link>
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 px-8 py-3.5 font-bold text-primary hover:bg-gray-100 transition-colors"
            >
              Ver Módulos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
