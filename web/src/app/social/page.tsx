'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Heart,
  Droplets,
  Apple,
  Leaf,
  BookOpen,
  Snowflake,
  HeartPulse,
  PawPrint,
  Palette,
  BarChart3,
  HandHeart,
  ArrowRight,
  ArrowLeft,
  Users,
  Megaphone,
  ShieldCheck,
  Trophy,
  Star,
  MapPin,
  Gift,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import type { CampanhaSocial } from '@/lib/supabase';
import {
  CAMPANHA_SOCIAL_CATEGORIA_LABELS,
  PONTOS_CONFIG,
} from '@/lib/supabase';

// ─── Animations ─────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Icon map ───────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  droplets: Droplets,
  apple: Apple,
  leaf: Leaf,
  'book-open': BookOpen,
  snowflake: Snowflake,
  'heart-pulse': HeartPulse,
  'paw-print': PawPrint,
  palette: Palette,
  heart: Heart,
};

function getCategoryIcon(iconName: string) {
  return ICON_MAP[iconName] ?? Heart;
}

// ─── Animated Counter ───────────────────────────────────────

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString('pt-BR')}
      {suffix}
    </span>
  );
}

// ─── Skeleton ───────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-7 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200" />
        <div className="w-16 h-6 rounded-full bg-gray-200" />
      </div>
      <div className="h-5 w-3/4 bg-gray-200 rounded mb-3" />
      <div className="h-4 w-full bg-gray-200 rounded mb-2" />
      <div className="h-4 w-2/3 bg-gray-200 rounded mb-4" />
      <div className="h-3 w-full bg-gray-100 rounded-full mb-3" />
      <div className="h-10 w-full bg-gray-200 rounded-xl" />
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function SocialPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();

  const [campanhas, setCampanhas] = useState<CampanhaSocial[]>([]);
  const [loading, setLoading] = useState(true);
  const [participando, setParticipando] = useState<Record<string, boolean>>({});
  const [participadas, setParticipadas] = useState<Record<string, boolean>>({});

  // Impact stats (from DB)
  const [totalParticipacoes, setTotalParticipacoes] = useState(0);
  const [totalCampanhas, setTotalCampanhas] = useState(0);
  const [totalVoluntarios, setTotalVoluntarios] = useState(0);
  const [totalPontosDistribuidos, setTotalPontosDistribuidos] = useState(0);

  // ── Fetch campanhas ativas ──
  const fetchCampanhas = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('campanhas_sociais')
      .select('*')
      .eq('status', 'ativa')
      .order('destaque', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCampanhas(data as CampanhaSocial[]);
    }
    setLoading(false);
  }, []);

  // ── Fetch impact stats ──
  const fetchStats = useCallback(async () => {
    // Total participações
    const { count: pCount } = await supabase
      .from('participacoes_sociais')
      .select('*', { count: 'exact', head: true });

    // Total campanhas (all statuses)
    const { count: cCount } = await supabase
      .from('campanhas_sociais')
      .select('*', { count: 'exact', head: true });

    // Unique volunteers
    const { data: volData } = await supabase
      .from('participacoes_sociais')
      .select('usuario_id');
    const uniqueVol = volData ? new Set(volData.map((v) => v.usuario_id)).size : 0;

    // Total pontos distribuídos
    const { data: hpData } = await supabase
      .from('historico_pontos')
      .select('pontos')
      .eq('tipo', 'campanha_social');
    const totalPts = hpData ? hpData.reduce((s, h) => s + (h.pontos > 0 ? h.pontos : 0), 0) : 0;

    setTotalParticipacoes(pCount ?? 0);
    setTotalCampanhas(cCount ?? 0);
    setTotalVoluntarios(uniqueVol);
    setTotalPontosDistribuidos(totalPts);
  }, []);

  // ── Fetch user's participations ──
  const fetchMinhasParticipacoes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('participacoes_sociais')
      .select('campanha_id')
      .eq('usuario_id', user.id);
    if (data) {
      const map: Record<string, boolean> = {};
      data.forEach((p) => { map[p.campanha_id] = true; });
      setParticipadas(map);
    }
  }, [user]);

  useEffect(() => {
    fetchCampanhas();
    fetchStats();
    fetchMinhasParticipacoes();
  }, [fetchCampanhas, fetchStats, fetchMinhasParticipacoes]);

  // ── Participar ──
  async function handleParticipar(campanha: CampanhaSocial) {
    if (!user) return;
    setParticipando((prev) => ({ ...prev, [campanha.id]: true }));

    const pontos = campanha.pontos_participacao || PONTOS_CONFIG.campanha_social;

    // Insert participation
    const { error: pErr } = await supabase.from('participacoes_sociais').insert({
      campanha_id: campanha.id,
      usuario_id: user.id,
      tipo: 'participacao',
      pontos_ganhos: pontos,
    });

    if (pErr) {
      console.error('Erro ao participar:', pErr.message);
      setParticipando((prev) => ({ ...prev, [campanha.id]: false }));
      return;
    }

    // Insert historico_pontos
    await supabase.from('historico_pontos').insert({
      usuario_id: user.id,
      tipo: 'campanha_social',
      pontos: pontos,
      descricao: `Participação na campanha: ${campanha.titulo}`,
      referencia_id: campanha.id,
    });

    // Update campanha meta_alcancada
    await supabase
      .from('campanhas_sociais')
      .update({ meta_alcancada: (campanha.meta_alcancada || 0) + 1 })
      .eq('id', campanha.id);

    // Refresh UI
    setParticipadas((prev) => ({ ...prev, [campanha.id]: true }));
    setParticipando((prev) => ({ ...prev, [campanha.id]: false }));
    refreshProfile();
    fetchCampanhas();
    fetchStats();
  }

  const stats = [
    { icon: HandHeart, label: 'Participações', value: totalParticipacoes, suffix: '+' },
    { icon: Megaphone, label: 'Campanhas', value: totalCampanhas, suffix: '' },
    { icon: Users, label: 'Voluntários', value: totalVoluntarios, suffix: '+' },
    { icon: Star, label: 'Pontos Distribuídos', value: totalPontosDistribuidos, suffix: '' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Back link */}
      <div className="max-w-6xl mx-auto w-full px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0A2463]/70 hover:text-[#0A2463] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Home
        </Link>
      </div>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2463] via-[#0d2d73] to-[#14A76C] py-28 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#F5A623] blur-3xl" />
          <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-[#14A76C] blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block text-sm font-semibold tracking-widest uppercase text-[#F5A623] mb-4"
          >
            Impacto social
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight"
          >
            DNA{' '}
            <span className="bg-gradient-to-r from-[#F5A623] to-[#14A76C] bg-clip-text text-transparent">
              Social
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 max-w-2xl mx-auto text-lg text-white/80"
          >
            Parte da arrecadação é destinada a projetos sociais permanentes. Cada corrida, cada
            passeio, cada serviço contribui para transformar vidas na Baixada Santista.
          </motion.p>
        </div>
      </section>

      {/* ─── Meus Pontos (logged in) ─── */}
      {!authLoading && user && profile && (
        <section className="py-10 px-6 bg-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <div className="bg-gradient-to-r from-[#0A2463]/5 to-[#14A76C]/5 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#14A76C]/10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#F5A623]/10 flex items-center justify-center">
                  <Star className="w-7 h-7 text-[#F5A623]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Meu saldo de pontos</p>
                  <p className="text-3xl font-extrabold text-[#0A2463]">
                    {profile.pontos.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <Link
                href="/recompensas"
                className="inline-flex items-center gap-2 bg-[#14A76C] hover:bg-[#11915e] text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
              >
                <Gift className="w-5 h-5" />
                Ver Recompensas
              </Link>
            </div>
          </motion.div>
        </section>
      )}

      {/* ─── Campanhas Ativas ─── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-4xl font-bold text-[#0A2463]"
            >
              Campanhas Ativas
            </motion.h2>
            <motion.div
              variants={fadeUp}
              custom={1}
              className="mt-3 w-16 h-1 bg-gradient-to-r from-[#14A76C] to-[#F5A623] mx-auto rounded-full"
            />
          </motion.div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : campanhas.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-500 text-lg py-12"
            >
              Nenhuma campanha ativa no momento. Volte em breve!
            </motion.p>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={stagger}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {campanhas.map((c, i) => {
                const catInfo = CAMPANHA_SOCIAL_CATEGORIA_LABELS[c.categoria] ?? CAMPANHA_SOCIAL_CATEGORIA_LABELS.outro;
                const Icon = getCategoryIcon(catInfo.icon);
                const catColor = catInfo.color;
                const metaValor = c.meta_valor ?? 0;
                const metaAlcancada = c.meta_alcancada ?? 0;
                const progresso = metaValor > 0 ? Math.min((metaAlcancada / metaValor) * 100, 100) : 0;
                const jaParticipou = participadas[c.id];
                const isParticipando = participando[c.id];
                const pontosGanha = c.pontos_participacao || PONTOS_CONFIG.campanha_social;

                return (
                  <motion.div
                    key={c.id}
                    variants={fadeUp}
                    custom={i}
                    className="bg-white rounded-2xl p-7 shadow-sm hover:shadow-lg transition-shadow group flex flex-col"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${catColor}15`, color: catColor }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      {c.destaque && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F5A623]/10 text-[#F5A623]">
                          ⭐ Destaque
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <h3 className="text-lg font-bold text-[#0A2463] mb-2">{c.titulo}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">{c.descricao}</p>

                    {/* Location */}
                    {c.local && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                        <MapPin className="w-3.5 h-3.5" />
                        {c.local} · {c.cidade}
                      </div>
                    )}

                    {/* Progress bar */}
                    {metaValor > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">
                            {metaAlcancada.toLocaleString('pt-BR')} / {metaValor.toLocaleString('pt-BR')} {c.meta_unidade ?? ''}
                          </span>
                          <span className="font-semibold" style={{ color: catColor }}>
                            {Math.round(progresso)}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${progresso}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.2, ease: 'easeOut' as const }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: catColor }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Points badge */}
                    <div className="flex items-center gap-1.5 text-xs text-[#F5A623] font-semibold mb-4">
                      <Star className="w-3.5 h-3.5" />
                      +{pontosGanha} pontos ao participar
                    </div>

                    {/* Spacer */}
                    <div className="mt-auto">
                      {!user ? (
                        <Link
                          href="/login"
                          className="w-full inline-flex items-center justify-center gap-2 bg-[#0A2463] hover:bg-[#0d2d73] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                        >
                          <ArrowRight className="w-4 h-4" />
                          Entre para participar
                        </Link>
                      ) : jaParticipou ? (
                        <div className="w-full flex items-center justify-center gap-2 bg-[#14A76C]/10 text-[#14A76C] font-semibold py-3 rounded-xl text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Você já participou
                        </div>
                      ) : (
                        <button
                          onClick={() => handleParticipar(c)}
                          disabled={isParticipando}
                          className="w-full inline-flex items-center justify-center gap-2 bg-[#14A76C] hover:bg-[#11915e] disabled:bg-[#14A76C]/50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                        >
                          {isParticipando ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Participando...
                            </>
                          ) : (
                            <>
                              <HandHeart className="w-4 h-4" />
                              Participar
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Ranking link */}
          <div className="text-center mt-10">
            <Link
              href="/social/ranking"
              className="inline-flex items-center gap-2 text-[#0A2463] font-semibold hover:underline text-sm"
            >
              <Trophy className="w-4 h-4 text-[#F5A623]" />
              Ver Ranking de Participantes
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Impacto em Números ─── */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#0A2463] to-[#14A76C]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeUp}
              custom={0}
              className="text-3xl md:text-4xl font-bold text-white"
            >
              Nosso Impacto em Números
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((s, i) => (
              <motion.div key={s.label} variants={fadeUp} custom={i} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-4">
                  <s.icon className="w-7 h-7 text-[#F5A623]" />
                </div>
                <div className="text-4xl md:text-5xl font-extrabold text-white mb-1">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </div>
                <div className="text-white/70 font-medium">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Transparência ─── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={fadeUp} custom={0}>
              <span className="text-sm font-semibold tracking-widest uppercase text-[#14A76C]">
                Transparência
              </span>
              <h2 className="text-3xl font-bold text-[#0A2463] mt-2 mb-4">
                Acompanhe a aplicação dos recursos
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Na DNA Baixada, transparência não é apenas um valor — é uma prática. Publicamos
                periodicamente relatórios detalhados sobre como cada centavo arrecadado é investido
                em projetos sociais.
              </p>
              <ul className="space-y-3">
                {[
                  'Relatórios mensais de impacto',
                  'Prestação de contas pública',
                  'Auditoria independente trimestral',
                  'Dashboard em tempo real',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-600">
                    <ShieldCheck className="w-5 h-5 text-[#14A76C] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div variants={fadeUp} custom={1}>
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-6 h-6 text-[#0A2463]" />
                  <h3 className="font-bold text-[#0A2463]">Distribuição de Recursos</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Projetos Educacionais', pct: 35, color: '#0A2463' },
                    { label: 'Doações & Alimentos', pct: 25, color: '#14A76C' },
                    { label: 'Limpeza & Meio Ambiente', pct: 20, color: '#F5A623' },
                    { label: 'Campanhas de Inverno', pct: 12, color: '#0d2d73' },
                    { label: 'Administração', pct: 8, color: '#94a3b8' },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{bar.label}</span>
                        <span className="font-bold text-gray-800">{bar.pct}%</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${bar.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' as const }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: bar.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 px-6 bg-gradient-to-r from-[#14A76C] to-[#0A2463]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <HandHeart className="w-12 h-12 text-[#F5A623] mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Participe de uma campanha
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Seja voluntário, doe ou ajude a espalhar a palavra. Juntos, podemos transformar a
            Baixada Santista.
          </p>
          <Link
            href="/recompensas"
            className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#e6951c] text-[#0A2463] font-bold px-8 py-4 rounded-full transition-colors shadow-lg"
          >
            Ver Recompensas
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
