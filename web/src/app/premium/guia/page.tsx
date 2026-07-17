'use client';

import PageTitle from '@/components/seo/PageTitle';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  Languages,
  Star,
  MapPin,
  Compass,
  GraduationCap,
  DollarSign,
  Clock,
  Globe,
  CheckCircle2,
  Crown,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

// ─── Tipos ───────────────────────────────────────────────────
interface Guia {
  id: string;
  nome: string;
  idiomas: string[];
  especialidades: string[];
  bio: string;
  avaliacao: number;
  passeios: number;
  tarifa: string;
}

interface Beneficio {
  id: string;
  titulo: string;
  descricao: string;
  icon: LucideIcon;
}

interface Passo {
  id: number;
  titulo: string;
  descricao: string;
  icon: LucideIcon;
}

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

// ─── Mapa de flags por idioma ────────────────────────────────
const IDIOMA_FLAGS: Record<string, string> = {
  Português: '🇧🇷',
  Inglês: '🇺🇸',
  Espanhol: '🇪🇸',
  Italiano: '🇮🇹',
  Francês: '🇫🇷',
  Alemão: '🇩🇪',
  Japonês: '🇯🇵',
};

// ─── Fallback data ───────────────────────────────────────────
const FALLBACK_GUIAS: Guia[] = [
  {
    id: 'g1',
    nome: 'Carlos Eduardo',
    idiomas: ['Português', 'Inglês', 'Espanhol'],
    especialidades: ['City Tour', 'História', 'Gastronomia'],
    bio: '10 anos de experiência com turistas em Santos',
    avaliacao: 4.9,
    passeios: 245,
    tarifa: 'R$80/h',
  },
  {
    id: 'g2',
    nome: 'Marina Costa',
    idiomas: ['Português', 'Inglês'],
    especialidades: ['Eco Tour', 'Natureza', 'Praias'],
    bio: 'Especialista em ecoturismo da Baixada',
    avaliacao: 5.0,
    passeios: 180,
    tarifa: 'R$90/h',
  },
  {
    id: 'g3',
    nome: 'Roberto Silva',
    idiomas: ['Português', 'Italiano', 'Inglês'],
    especialidades: ['City Tour', 'Arquitetura', 'Cultura'],
    bio: 'Apaixonado por história da região',
    avaliacao: 4.8,
    passeios: 320,
    tarifa: 'R$75/h',
  },
  {
    id: 'g4',
    nome: 'Ana Beatriz',
    idiomas: ['Português', 'Francês', 'Inglês'],
    especialidades: ['Gastronomia', 'Vinho', 'Cultura'],
    bio: 'Somelière e guia gastronômica',
    avaliacao: 5.0,
    passeios: 95,
    tarifa: 'R$120/h',
  },
];

const BENEFICIOS: Beneficio[] = [
  {
    id: 'b1',
    titulo: 'Atenda turistas',
    descricao:
      'Receba solicitações de passageiros estrangeiros e turistas nacionais que buscam um motorista que também seja guia local.',
    icon: Globe,
  },
  {
    id: 'b2',
    titulo: 'Ganhos maiores',
    descricao:
      'Passeios turísticos têm tarifa por hora superior às corridas comuns. Ganhe até 3x mais por viagem.',
    icon: DollarSign,
  },
  {
    id: 'b3',
    titulo: 'Flexibilidade de horários',
    descricao:
      'Defina sua própria agenda de passeios. Trabalhe meio período, fins de semana ou em alta temporada.',
    icon: Clock,
  },
  {
    id: 'b4',
    titulo: 'Reconhecimento',
    descricao:
      'Ganhe o selo Guia DNA Baixada e destaque-se entre os motoristas da plataforma com um selo exclusivo.',
    icon: Award,
  },
];

const PASSOS: Passo[] = [
  {
    id: 1,
    titulo: 'Tenha nível Ouro+',
    descricao:
      'A categoria Guia é exclusiva para motoristas com nível Ouro ou superior no sistema de níveis da DNA.',
    icon: Crown,
  },
  {
    id: 2,
    titulo: 'Conclua o curso de Atendimento ao Turista',
    descricao:
      'Faça o curso gratuito da Academia DNA e aprenda técnicas de atendimento, história local e hospitalidade.',
    icon: GraduationCap,
  },
  {
    id: 3,
    titulo: 'Cadastre seus idiomas',
    descricao:
      'Informe quais idiomas você domina para que o sistema possa casar você com turistas que falam sua língua.',
    icon: Languages,
  },
  {
    id: 4,
    titulo: 'Aguarde aprovação',
    descricao:
      'Nossa equipe revisa seu perfil em até 7 dias. Após aprovação, você já aparece como Guia no app.',
    icon: CheckCircle2,
  },
];

// ─── Helpers ─────────────────────────────────────────────────
function getInitials(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function renderStars(avaliacao: number) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Avaliação ${avaliacao} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            n <= Math.round(avaliacao)
              ? 'h-4 w-4 fill-yellow-400 text-yellow-400'
              : 'h-4 w-4 text-gray-300'
          }
        />
      ))}
      <span className="ml-1 text-sm font-semibold text-gray-700">{avaliacao.toFixed(1)}</span>
    </div>
  );
}

// ─── Página ──────────────────────────────────────────────────
export default function GuiaPage() {
  const { user } = useAuth();
  const guias = FALLBACK_GUIAS;

  const ctaHref = user ? '/premium' : '/cadastro';

  return (
    <>
      <PageTitle title="Motorista Guia" />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-yellow-500 to-amber-600 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>

            <div className="flex items-center gap-3">
              <Compass className="h-10 w-10" />
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                Motorista Guia
              </h1>
            </div>

            <p className="max-w-2xl text-lg text-white/90 sm:text-xl">
              Categoria premium para passeios turísticos
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── O que é ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="space-y-8"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center">
            <h2 className="text-3xl font-bold text-[#0A2463]">O que é</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-600">
              A categoria <strong>Guia</strong> é um selo premium da DNA Baixada para motoristas
              que também atuam como guias turísticos. Quem tem o selo pode atender turistas,
              faturar mais por hora e ser reconhecido como especialista da região.
            </p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFICIOS.map((b, i) => (
              <motion.div
                key={b.id}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#0A2463]">{b.titulo}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{b.descricao}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Guias Cadastrados ────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="space-y-8"
          >
            <motion.div variants={fadeUp} custom={0} className="text-center">
              <h2 className="text-3xl font-bold text-[#0A2463]">Guias Cadastrados</h2>
              <p className="mx-auto mt-3 max-w-2xl text-gray-600">
                Conheça os motoristas que já fazem parte da categoria premium Guia da DNA Baixada.
              </p>
            </motion.div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
              {guias.map((g, i) => (
                <motion.article
                  key={g.id}
                  variants={fadeUp}
                  custom={i + 1}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Cabeçalho: avatar + nome + avaliação */}
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-lg font-bold text-white"
                      aria-hidden="true"
                    >
                      {getInitials(g.nome)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold text-[#0A2463]">{g.nome}</h3>
                      {renderStars(g.avaliacao)}
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                      <Compass className="h-4 w-4" />
                      Guia
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="mt-4 text-sm leading-relaxed text-gray-700">{g.bio}</p>

                  {/* Idiomas */}
                  <div className="mt-4">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <Languages className="h-3.5 w-3.5" />
                      Idiomas
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.idiomas.map((idioma) => (
                        <span
                          key={idioma}
                          className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#0A2463]"
                        >
                          <span aria-hidden="true">{IDIOMA_FLAGS[idioma] ?? '🌐'}</span>
                          {idioma}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Especialidades */}
                  <div className="mt-4">
                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <Award className="h-3.5 w-3.5" />
                      Especialidades
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {g.especialidades.map((esp) => (
                        <span
                          key={esp}
                          className="rounded-md bg-[#14A76C]/10 px-2 py-0.5 text-xs font-medium text-[#14A76C]"
                        >
                          {esp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats rodapé */}
                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-[#14A76C]" />
                      <span>
                        <strong className="text-[#0A2463]">{g.passeios}</strong> passeios
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0A2463]">
                      <DollarSign className="h-4 w-4 text-[#14A76C]" />
                      {g.tarifa}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Como se tornar um Guia ───────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="space-y-8"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center">
            <h2 className="text-3xl font-bold text-[#0A2463]">Como se tornar um Guia</h2>
            <p className="mx-auto mt-3 max-w-2xl text-gray-600">
              Siga os passos abaixo para conquistar o selo premium de Motorista Guia.
            </p>
          </motion.div>

          <ol className="relative space-y-8 before:absolute before:left-[27px] before:top-2 before:h-[calc(100%-2rem)] before:w-px before:bg-amber-200">
            {PASSOS.map((p, i) => (
              <motion.li
                key={p.id}
                variants={fadeUp}
                custom={i + 1}
                className="relative flex gap-5"
              >
                <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-md">
                  <p.icon className="h-6 w-6" />
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                      {p.id}
                    </span>
                    <h3 className="text-lg font-semibold text-[#0A2463]">{p.titulo}</h3>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{p.descricao}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </motion.div>
      </section>

      {/* ─── CTA final ────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-500 to-amber-600 px-6 py-12 text-center text-white shadow-lg sm:px-12"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_55%)]" />
          <div className="relative">
            <Compass className="mx-auto mb-4 h-12 w-12" />
            <h2 className="text-3xl font-extrabold sm:text-4xl">Pronto para ser um Guia?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">
              {user
                ? 'Candidate-se à categoria premium e comece a atender turistas da DNA Baixada.'
                : 'Crie sua conta gratuita e dê o primeiro passo para se tornar um Motorista Guia.'}
            </p>
            <Link
              href={ctaHref}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-amber-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Crown className="h-5 w-5" />
              Quero ser Guia
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
