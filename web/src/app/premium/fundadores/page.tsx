'use client';

import SeoMeta from '@/components/seo/SeoMeta';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Crown,
  Star,
  Award,
  Gift,
  MessageCircle,
  Users,
  CheckCircle2,
  Shield,
  Sparkles,
  TrendingUp,
  Lightbulb,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { MotoristaFundador } from '@/lib/supabase';

const BENEFICIOS = [
  {
    icon: TrendingUp,
    title: 'Comissão Reduzida',
    description: 'Comissão especial durante o período inicial da plataforma.',
    color: 'text-secondary bg-secondary/10',
  },
  {
    icon: Lightbulb,
    title: 'Testes Exclusivos',
    description: 'Participação em testes de novas funcionalidades antes de todos.',
    color: 'text-accent-dark bg-accent/10',
  },
  {
    icon: MessageCircle,
    title: 'Canal Direto',
    description: 'Canal exclusivo para sugestões diretamente com a equipe DNA.',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: Calendar,
    title: 'Reuniões Periódicas',
    description: 'Encontros com a equipe da plataforma para alinhar o futuro.',
    color: 'text-purple-600 bg-purple-100',
  },
  {
    icon: Star,
    title: 'Destaque no App',
    description: 'Destaque visível no aplicativo durante toda a fase inicial.',
    color: 'text-accent-dark bg-accent/10',
  },
  {
    icon: Award,
    title: 'Certificado Digital',
    description: 'Certificado digital de Fundador, assinado e verificável.',
    color: 'text-secondary bg-secondary/10',
  },
  {
    icon: Users,
    title: 'Reconhecimento Público',
    description: 'Reconhecimento permanente dentro da comunidade DNA.',
    color: 'text-primary bg-primary/10',
  },
];

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

export default function FundadoresPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [fundador, setFundador] = useState<MotoristaFundador | null>(null);
  const [outrosFundadores, setOutrosFundadores] = useState<MotoristaFundador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      // Busca próprio registro de fundador
      user
        ? supabase
            .from('motoristas_fundadores')
            .select('*')
            .eq('motorista_id', user.id)
            .maybeSingle()
            .then(({ data }) => data && setFundador(data as MotoristaFundador))
        : Promise.resolve(),
      // Busca lista pública de fundadores (via view)
      supabase
        .from('vw_motoristas_fundadores')
        .select('*')
        .order('numero_fundador', { ascending: true })
        .limit(20)
        .then(({ data }) => {
          if (data) setOutrosFundadores(data as MotoristaFundador[]);
        }),
    ]).finally(() => setLoading(false));
  }, [user]);

  const isFundador = !!fundador;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <SeoMeta title='Motoristas Fundadores' description='Programa exclusivo para os primeiros motoristas da DNA Mobilidade. Selo permanente, comissão reduzida e certificado digital.' />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-orange-700 py-20 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-yellow-300 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-orange-400 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-8 transition-colors"
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
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, delay: 0.2, type: 'spring' }}
              className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-6"
            >
              <Crown className="w-10 h-10 text-yellow-300" />
            </motion.div>

            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="inline-block text-sm font-semibold tracking-widest uppercase text-yellow-200 mb-3"
            >
              DNA Mobilidade · Programa Exclusivo
            </motion.span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
              Motoristas Fundadores
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-lg text-white/80">
              Os primeiros a acreditar na DNA. Um selo permanente que reconhece
              quem construiu essa plataforma desde o início.
            </p>
          </motion.div>

          {/* Status do usuário */}
          {user && !authLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-10 max-w-md mx-auto"
            >
              {loading ? (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 animate-pulse">
                  <div className="h-16 w-16 rounded-full bg-white/20 mx-auto mb-3" />
                  <div className="h-5 w-32 rounded bg-white/20 mx-auto" />
                </div>
              ) : isFundador ? (
                <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-yellow-200 text-sm font-medium uppercase tracking-wider">
                    Você é um Fundador
                  </p>
                  <p className="text-3xl font-extrabold text-white mt-1">
                    #{fundador!.numero_fundador}
                  </p>
                  {fundador!.certificado_url && (
                    <a
                      href={fundador!.certificado_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-yellow-200 hover:text-white transition-colors"
                    >
                      <Award className="w-4 h-4" />
                      Ver Certificado
                    </a>
                  )}
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
                  <Shield className="w-12 h-12 text-white/50 mx-auto mb-3" />
                  <p className="text-white/70 text-sm">
                    {profile?.role === 'motorista'
                      ? 'Você ainda não faz parte do programa de Fundadores.'
                      : 'Programa exclusivo para motoristas cadastrados.'}
                  </p>
                  {profile?.role !== 'motorista' && (
                    <Link
                      href="/cadastro"
                      className="inline-flex items-center gap-2 mt-4 rounded-full bg-white text-orange-700 px-5 py-2.5 text-sm font-bold hover:bg-yellow-100 transition-colors"
                    >
                      <Crown className="w-4 h-4" />
                      Cadastre-se
                    </Link>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Benefícios ───────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
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
              Benefícios Permanentes
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mt-3 text-gray-500 max-w-xl mx-auto"
            >
              O selo de Fundador é vitalício. Os benefícios acompanham você por toda a jornada.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {BENEFICIOS.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className={`w-11 h-11 rounded-xl ${benefit.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-primary mb-1">{benefit.title}</h3>
                  <p className="text-sm text-gray-500">{benefit.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Galeria de Fundadores ────────────────────────── */}
      {!loading && outrosFundadores.length > 0 && (
        <section className="py-16 px-6 bg-gray-50 border-t border-gray-100">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-primary">
                Nossos Fundadores
              </h2>
              <p className="mt-3 text-gray-500">
                Os pioneiros que acreditaram na DNA desde o primeiro dia.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {outrosFundadores.map((f, i) => (
                <motion.div
                  key={f.id || i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="rounded-2xl bg-white p-5 text-center shadow-sm border border-gray-100"
                >
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto mb-3">
                    {f.foto_url ? (
                      <img
                        src={f.foto_url}
                        alt={f.nome || 'Fundador'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold text-white">
                        {(f.nome || '?').charAt(0)}
                      </span>
                    )}
                    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-[10px] font-bold text-white border-2 border-white">
                      {f.numero_fundador}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-primary truncate">
                    {f.nome || 'Fundador'}
                  </p>
                  {f.cidade_base && (
                    <p className="text-xs text-gray-400 mt-0.5">{f.cidade_base}</p>
                  )}
                  {f.veiculo_modelo && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{f.veiculo_modelo}</p>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA Final ────────────────────────────────────── */}
      {!user && (
        <section className="py-16 px-6">
          <div className="max-w-2xl mx-auto text-center rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-12 shadow-xl">
            <Crown className="w-12 h-12 text-white mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Seja um Motorista Fundador
            </h2>
            <p className="text-white/80 mb-6">
              Cadastre-se agora e garanta seu lugar entre os primeiros.
              O selo de Fundador é permanente.
            </p>
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 rounded-full bg-white text-orange-700 px-6 py-3 text-sm font-bold shadow-lg hover:bg-yellow-100 transition-colors"
            >
              <Crown className="w-4 h-4" />
              Quero ser Fundador
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
