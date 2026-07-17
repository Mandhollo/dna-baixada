'use client';

import SeoMeta from '@/components/seo/SeoMeta';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldAlert,
  Shield,
  ShieldCheck,
  Share2,
  UserCheck,
  PhoneCall,
  MapPin,
  Video,
  AlertTriangle,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

/* ─── feature card model ─── */
type Feature = {
  id: string;
  titulo: string;
  descricao: string;
  icon: LucideIcon;
  gradient: string; // tailwind gradient classes for card background
  iconBg: string; // tailwind classes for icon chip
};

const FEATURES: Feature[] = [
  {
    id: 'sos',
    titulo: 'Botão SOS',
    descricao: 'Acione ajuda emergencial a qualquer momento durante a corrida.',
    icon: ShieldAlert,
    gradient: 'from-red-50 to-rose-100',
    iconBg: 'from-red-500 to-rose-600',
  },
  {
    id: 'compartilhar',
    titulo: 'Compartilhamento de Corrida',
    descricao: 'Compartilhe sua localização em tempo real com um contato de confiança.',
    icon: Share2,
    gradient: 'from-blue-50 to-indigo-100',
    iconBg: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'verificacao',
    titulo: 'Verificação de Passageiros',
    descricao: 'Todos os passageiros são verificados por telefone e documento.',
    icon: UserCheck,
    gradient: 'from-emerald-50 to-green-100',
    iconBg: 'from-emerald-500 to-green-600',
  },
  {
    id: 'suporte',
    titulo: 'Suporte Emergencial',
    descricao: 'Atendimento 24h por telefone em caso de necessidade.',
    icon: PhoneCall,
    gradient: 'from-amber-50 to-yellow-100',
    iconBg: 'from-amber-500 to-orange-600',
  },
  {
    id: 'rotas',
    titulo: 'Monitoramento de Rotas',
    descricao: 'Rotas desviadas geram alertas automáticos no sistema.',
    icon: MapPin,
    gradient: 'from-violet-50 to-purple-100',
    iconBg: 'from-violet-500 to-purple-600',
  },
  {
    id: 'gravacao',
    titulo: 'Gravação de Viagem',
    descricao: 'Opção de gravar a viagem pelo app para sua segurança.',
    icon: Video,
    gradient: 'from-slate-50 to-gray-100',
    iconBg: 'from-slate-500 to-gray-600',
  },
];

/* ─── segurança checklist (reforço visual) ─── */
const SEGURANCAS: string[] = [
  'Verificação de identidade em todas as corridas',
  'Monitoramento ativo durante toda a viagem',
  'Central de apoio 24 horas por dia',
  'Compartilhamento de localização em tempo real',
];

/* ══════════════════════════════════════════════════════════
   FEATURE CARD
   ══════════════════════════════════════════════════════════ */
function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${feature.gradient} p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
    >
      {/* glow decorativo */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/40 blur-2xl" />

      {/* Ícone */}
      <div
        className={`relative mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.iconBg} text-white shadow-md`}
      >
        <Icon size={26} />
      </div>

      {/* Conteúdo */}
      <h3 className="relative text-lg font-extrabold leading-tight text-primary">
        {feature.titulo}
      </h3>
      <p className="relative mt-2 text-sm leading-relaxed text-gray-600">
        {feature.descricao}
      </p>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */
export default function SegurancaPage() {
  useAuth(); // adere ao padrão de páginas premium (sessão)

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SeoMeta title='Sistema de Segurança' description='Sistema de segurança DNA: botão SOS, compartilhamento de corrida, verificação de passageiros e monitoramento de rotas.' />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-600 to-gray-800 px-6 py-20">
        {/* decoração */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 top-10 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-slate-300 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <Link
              href="/premium"
              className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur transition hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft size={15} />
              Voltar para Premium
            </Link>
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm"
          >
            <Shield className="h-8 w-8 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl font-extrabold leading-tight text-white sm:text-5xl"
          >
            Sistema de Segurança
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mx-auto mt-4 max-w-xl text-lg text-white/80"
          >
            Sua proteção em cada corrida
          </motion.p>
        </div>
      </section>

      {/* ═══ INTRO: ícone + selo ─══ */}
      <section className="mx-auto -mt-6 max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 text-center shadow-lg sm:flex-row sm:text-left"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-gray-800 text-white shadow-md">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary">
              Proteção em primeiro lugar
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Recursos pensados para manter motoristas e passageiros seguros do início ao fim de cada viagem.
            </p>
          </div>
        </motion.div>
      </section>

      {/* ═══ GRID DE FUNCIONALIDADES ═══ */}
      <section className="mx-auto mt-16 w-full max-w-6xl px-6 pb-16">
        <div className="mb-8 flex items-center gap-2">
          <ShieldCheck size={22} className="text-[#0A2463]" />
          <h2 className="text-xl font-extrabold text-primary">
            Funcionalidades de Segurança
          </h2>
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </motion.div>
      </section>

      {/* ═══ SEÇÃO BOTÃO SOS ═══ */}
      <section className="bg-gradient-to-b from-white to-gray-50 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-lg sm:p-12"
          >
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
              <AlertTriangle className="h-7 w-7 text-red-500" />
            </div>

            <h2 className="text-2xl font-extrabold text-primary sm:text-3xl">
              Botão SOS
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-gray-600">
              Em caso de emergência, pressione o botão abaixo para acionar
              imediatamente a central de apoio e suas autoridades de confiança.
            </p>

            {/* Botão grande vermelho — apenas visual (estático) */}
            <div className="mt-10 flex justify-center">
              <motion.button
                type="button"
                aria-label="Acionar SOS (demonstração)"
                initial={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="group relative flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-2xl shadow-red-500/40 ring-4 ring-red-500/20 transition-all hover:shadow-red-500/60"
              >
                {/* halo pulsante */}
                <span className="absolute inset-0 animate-ping rounded-full bg-red-500/30" />
                <span className="relative flex flex-col items-center gap-1">
                  <ShieldAlert size={40} />
                  <span className="text-2xl font-black tracking-wider">SOS</span>
                </span>
              </motion.button>
            </div>

            <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-500">
              <CheckCircle2 size={14} className="text-[#14A76C]" />
              Demonstração visual — não aciona alerta real
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══ SEGURANÇAS INCLUSAS ─══ */}
      <section className="bg-gray-900 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold text-white">
              O que já está incluso
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Camadas de proteção ativas em toda a plataforma.
            </p>
          </div>

          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid gap-4 sm:grid-cols-2"
          >
            {SEGURANCAS.map((item, i) => (
              <motion.li
                key={item}
                variants={fadeUp}
                custom={i}
                className="flex items-start gap-3 rounded-2xl bg-white/5 p-4 backdrop-blur-sm"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#14A76C]" />
                <span className="text-sm font-medium text-gray-200">{item}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* ═══ FOOTER CTA ─══ */}
      <section className="bg-gray-900 px-6 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-gray-900 transition hover:bg-gray-100"
          >
            <ArrowLeft size={16} />
            Voltar para Premium
          </Link>
        </div>
      </section>
    </div>
  );
}
