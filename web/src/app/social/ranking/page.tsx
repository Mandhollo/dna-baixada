'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Star,
  ArrowLeft,
  Car,
  MessageSquare,
  UserPlus,
  Megaphone,
  LogIn,
  Users,
  TrendingUp,
  Crown,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';

// ── Types ──────────────────────────────────────────────────

interface RankingEntry {
  id: string;
  nome: string;
  foto_url: string | null;
  pontos: number;
  role: string;
  participacoes: number;
  pontos_sociais: number;
}

// ── Animation variants ─────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// ── Helpers ────────────────────────────────────────────────

const podiumColors = ['#F5A623', '#94a3b8', '#b45309'] as const;
const podiumLabels = ['🥇 Ouro', '🥈 Prata', '🥉 Bronze'] as const;
const podiumBg = [
  'bg-[#F5A623]/10 border-[#F5A623]/30',
  'bg-slate-100 border-slate-300',
  'bg-[#b45309]/10 border-[#b45309]/30',
] as const;

const roleBadgeMap: Record<string, { label: string; bg: string; color: string }> = {
  passageiro: { label: 'Passageiro', bg: 'bg-[#0A2463]/10', color: 'text-[#0A2463]' },
  motorista: { label: 'Motorista', bg: 'bg-[#14A76C]/10', color: 'text-[#14A76C]' },
  parceiro: { label: 'Parceiro', bg: 'bg-[#F5A623]/10', color: 'text-[#F5A623]' },
  admin: { label: 'Admin', bg: 'bg-[#E84855]/10', color: 'text-[#E84855]' },
};

function getRoleBadge(role: string) {
  return roleBadgeMap[role] ?? { label: role, bg: 'bg-gray-100', color: 'text-gray-600' };
}

function getInitials(nome: string) {
  return nome
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// ── How-to-earn cards data ─────────────────────────────────

const earnCards = [
  {
    icon: Car,
    title: 'Corridas',
    desc: 'Ganhe pontos a cada corrida concluída com a DNA Baixada.',
    pts: '+10 pts',
    color: '#0A2463',
  },
  {
    icon: MessageSquare,
    title: 'Avaliações',
    desc: 'Avalie sua corrida e ganhe pontos por cada avaliação.',
    pts: '+5 pts',
    color: '#14A76C',
  },
  {
    icon: UserPlus,
    title: 'Indicações',
    desc: 'Indique amigos e ganhe pontos bônus quando eles usarem o app.',
    pts: '+25 pts',
    color: '#F5A623',
  },
  {
    icon: Megaphone,
    title: 'Campanhas Sociais',
    desc: 'Participe de campanhas e mutirões para acumular pontos extras.',
    pts: '+30 pts',
    color: '#E84855',
  },
  {
    icon: LogIn,
    title: 'Login Diário',
    desc: 'Faça login diariamente para manter sua sequência de pontos.',
    pts: '+2 pts/dia',
    color: '#0d2d73',
  },
];

// ── Skeleton ───────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-white animate-pulse">
        <PageTitle title='Ranking Social' />
      {/* Hero skeleton */}
      <div className="h-72 bg-gradient-to-br from-[#0A2463] to-[#14A76C]" />
      {/* Podium skeleton */}
      <div className="max-w-5xl mx-auto px-6 -mt-20">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 rounded-2xl h-56" />
          ))}
        </div>
      </div>
      {/* List skeleton */}
      <div className="max-w-5xl mx-auto px-6 mt-16 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-gray-100 rounded-xl h-20" />
        ))}
      </div>
    </div>
  );
}

// ── Podium Entry ───────────────────────────────────────────

function PodiumEntry({
  entry,
  position,
  isCurrentUser,
}: {
  entry: RankingEntry;
  position: number;
  isCurrentUser: boolean;
}) {
  const heights = ['h-48', 'h-40', 'h-36'] as const;
  const isFirst = position === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position * 0.2, duration: 0.6 }}
      className={`flex flex-col items-center ${isFirst ? 'order-first sm:-mt-4' : ''}`}
    >
      {/* Avatar */}
      <div className="relative mb-3">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 ${
            isCurrentUser ? 'border-[#F5A623]' : 'border-white'
          } shadow-lg`}
          style={{ backgroundColor: podiumColors[position] }}
        >
          {entry.foto_url ? (
            <img
              src={entry.foto_url}
              alt={entry.nome}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(entry.nome)
          )}
        </div>
        {/* Position badge */}
        <div
          className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
          style={{ backgroundColor: podiumColors[position] }}
        >
          {position + 1}
        </div>
        {isCurrentUser && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#F5A623] text-[#0A2463] text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            Você
          </span>
        )}
      </div>

      {/* Name */}
      <p className="text-sm font-bold text-[#0A2463] text-center mt-1 max-w-[120px] truncate">
        {entry.nome}
      </p>
      <p className="text-xs text-gray-500">{entry.participacoes} participações</p>

      {/* Points bar */}
      <div
        className={`w-full mt-3 ${heights[position]} rounded-t-xl ${podiumBg[position]} border-t-4 flex flex-col items-center justify-end pb-4`}
        style={{ borderColor: podiumColors[position] }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
          style={{ backgroundColor: `${podiumColors[position]}20` }}
        >
          <Trophy className="w-5 h-5" style={{ color: podiumColors[position] }} />
        </div>
        <span className="text-2xl font-extrabold" style={{ color: podiumColors[position] }}>
          {entry.pontos.toLocaleString('pt-BR')}
        </span>
        <span className="text-xs text-gray-500 mt-0.5">pontos</span>
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────

export default function RankingSocialPage() {
  const { user } = useAuth();
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRanking() {
      try {
        const { data, error: fetchError } = await supabase
          .from('ranking_social')
          .select('*')
          .order('pontos', { ascending: false });

        if (fetchError) throw fetchError;
        setRanking((data as RankingEntry[]) ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar ranking');
      } finally {
        setLoading(false);
      }
    }
    fetchRanking();
  }, []);

  // ── Stats ──
  const totalPontos = ranking.reduce((acc, r) => acc + r.pontos, 0);
  const totalParticipantes = ranking.length;
  const liderDoMes = ranking.length > 0 ? ranking[0] : null;

  if (loading) return <Skeleton />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-6">
        <p className="text-[#E84855] text-lg font-semibold mb-4">{error}</p>
        <Link
          href="/social"
          className="inline-flex items-center gap-2 text-[#0A2463] font-semibold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Social
        </Link>
      </div>
    );
  }

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A2463] via-[#0d2d73] to-[#F5A623] py-24 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-[#F5A623] blur-3xl" />
          <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-[#14A76C] blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto">
          <Link
            href="/social"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Social
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <span className="inline-block text-sm font-semibold tracking-widest uppercase text-[#F5A623] mb-4">
              Leaderboard
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
              Ranking
              <span className="bg-gradient-to-r from-[#F5A623] to-[#14A76C] bg-clip-text text-transparent">
                {' '}DNA Social
              </span>
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-lg text-white/80">
              Veja quem está making a difference na Baixada Santista. Cada ponto é um impacto real.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Stats Gerais ── */}
      <section className="max-w-5xl mx-auto px-6 -mt-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center border border-gray-100">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#F5A623]/10 flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-[#F5A623]" />
            </div>
            <p className="text-2xl font-extrabold text-[#0A2463]">
              {totalPontos.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-gray-500 mt-1">Pontos distribuídos</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center border border-gray-100">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#14A76C]/10 flex items-center justify-center mb-2">
              <Users className="w-5 h-5 text-[#14A76C]" />
            </div>
            <p className="text-2xl font-extrabold text-[#0A2463]">{totalParticipantes}</p>
            <p className="text-xs text-gray-500 mt-1">Participantes</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-5 text-center border border-gray-100">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#0A2463]/10 flex items-center justify-center mb-2">
              <Crown className="w-5 h-5 text-[#0A2463]" />
            </div>
            <p className="text-lg font-extrabold text-[#0A2463] truncate">
              {liderDoMes?.nome ?? '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Líder do mês</p>
          </div>
        </motion.div>
      </section>

      {/* ── Podium Top 3 ── */}
      {top3.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 mt-16">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl md:text-3xl font-bold text-[#0A2463] text-center mb-10"
          >
            🏆 Top 3 do Mês
          </motion.h2>
          <div className="flex items-end justify-center gap-4 sm:gap-6">
            {/* Reorder for podium layout: 2nd, 1st, 3rd */}
            {[top3[1], top3[0], top3[2]]
              .filter(Boolean)
              .map((entry, displayIdx) => {
                const actualPosition = ranking.findIndex((r) => r.id === entry.id);
                return (
                  <PodiumEntry
                    key={entry.id}
                    entry={entry}
                    position={actualPosition}
                    isCurrentUser={user?.id === entry.id}
                  />
                );
              })}
          </div>
        </section>
      )}

      {/* ── Full Ranking List ── */}
      {rest.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 mt-20">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-[#0A2463] text-center mb-10"
          >
            Classificação Completa
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={stagger}
            className="space-y-3"
          >
            {rest.map((entry, i) => {
              const position = i + 4;
              const isCurrentUser = user?.id === entry.id;
              const badge = getRoleBadge(entry.role);

              return (
                <motion.div
                  key={entry.id}
                  variants={fadeUp}
                  custom={i}
                  className={`flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border-2 ${
                    isCurrentUser
                      ? 'border-[#F5A623] bg-[#F5A623]/5'
                      : 'border-transparent'
                  }`}
                >
                  {/* Position */}
                  <span className="w-8 text-center text-lg font-extrabold text-gray-400 shrink-0">
                    {position}
                  </span>

                  {/* Avatar */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                      isCurrentUser ? 'ring-2 ring-[#F5A623]' : ''
                    }`}
                    style={{ backgroundColor: '#0A2463' }}
                  >
                    {entry.foto_url ? (
                      <img
                        src={entry.foto_url}
                        alt={entry.nome}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(entry.nome)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#0A2463] truncate">{entry.nome}</p>
                      {isCurrentUser && (
                        <span className="shrink-0 bg-[#F5A623] text-[#0A2463] text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.bg} ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {entry.participacoes} participações
                      </span>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <p className="text-lg font-extrabold text-[#0A2463]">
                      {entry.pontos.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-[11px] text-gray-400">pontos</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      )}

      {/* ── Empty State ── */}
      {ranking.length === 0 && (
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <Medal className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Nenhum participante no ranking ainda.</p>
          <p className="text-gray-400 text-sm mt-1">Seja o primeiro a pontuar!</p>
        </div>
      )}

      {/* ── Como Ganhar Pontos ── */}
      <section className="py-20 px-6 bg-gray-50 mt-16">
        <div className="max-w-5xl mx-auto">
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
              Como Ganhar Pontos
            </motion.h2>
            <motion.div
              variants={fadeUp}
              custom={1}
              className="mt-3 w-16 h-1 bg-gradient-to-r from-[#14A76C] to-[#F5A623] mx-auto rounded-full"
            />
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mt-4 text-gray-500 max-w-lg mx-auto"
            >
              Cada ação conta. Quanto mais você participa, mais impacto gera na comunidade.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {earnCards.map((card, i) => (
              <motion.div
                key={card.title}
                variants={fadeUp}
                custom={i}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${card.color}15` }}
                  >
                    <card.icon className="w-6 h-6" style={{ color: card.color }} />
                  </div>
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: `${card.color}15`,
                      color: card.color,
                    }}
                  >
                    {card.pts}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#0A2463] mb-1">{card.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 px-6 bg-gradient-to-r from-[#0A2463] to-[#14A76C]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <Star className="w-12 h-12 text-[#F5A623] mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Suba no Ranking!
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Use a DNA Baixada, participe de campanhas sociais e veja seu nome no topo. Cada corrida
            é uma chance de gerar impacto.
          </p>
          <Link
            href="/social"
            className="inline-flex items-center gap-2 bg-[#F5A623] hover:bg-[#e6951c] text-[#0A2463] font-bold px-8 py-4 rounded-full transition-colors shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para Social
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
