'use client';

import PageTitle from '@/components/seo/PageTitle';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Brain,
  Apple,
  Activity,
  Dumbbell,
  Stethoscope,
  HeartPulse,
  MapPin,
  Phone,
  MessageCircle,
  Percent,
  Wifi,
  ShieldPlus,
  Crown,
  Search,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { ParceiroSaude, SaudeTipo } from '@/lib/supabase';
import { SAUDE_TIPO_LABELS } from '@/lib/supabase';

/* ─── colour token ─── */
const P = '#0A2463';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

/* ─── ícone por tipo de serviço ─── */
const ICON_BY_TIPO: Record<SaudeTipo, typeof Brain> = {
  psicologo: Brain,
  nutricionista: Apple,
  fisioterapeuta: Activity,
  academia: Dumbbell,
  clinica: Stethoscope,
  medico: HeartPulse,
  outro: HeartPulse,
};

/* ─── filtros disponíveis ─── */
const FILTROS: { value: SaudeTipo | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'psicologo', label: 'Psicólogo' },
  { value: 'nutricionista', label: 'Nutricionista' },
  { value: 'fisioterapeuta', label: 'Fisioterapeuta' },
  { value: 'academia', label: 'Academia' },
  { value: 'clinica', label: 'Clínica' },
];

/* ══════════════════════════════════════════════════════════
   FALLBACK DATA
   ══════════════════════════════════════════════════════════ */
const FALLBACK_SAUDE: ParceiroSaude[] = [
  {
    id: 's1',
    nome: 'Dra. Marina Costa',
    tipo: 'psicologo',
    descricao: 'Atendimento psicológico para motoristas',
    especialidades: ['Ansiedade', 'Stress ocupacional'],
    desconto_descricao: '20% nas sessões',
    desconto_percentual: 20,
    aceita_convenio: false,
    convenios: [],
    atendimento_online: true,
    atendimento_presencial: true,
    telefone: null,
    whatsapp: null,
    endereco: null,
    cidade: 'Santos',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: true,
    desconto_dna_pass: null,
    ativo: true,
    destaque: true,
    ordem: 1,
  },
  {
    id: 's2',
    nome: 'Espaço Nutri Baixada',
    tipo: 'nutricionista',
    descricao: 'Consultoria nutricional',
    especialidades: ['Emagrecimento', 'Alimentação na estrada'],
    desconto_descricao: '15% na consulta',
    desconto_percentual: 15,
    aceita_convenio: false,
    convenios: [],
    atendimento_online: false,
    atendimento_presencial: true,
    telefone: null,
    whatsapp: null,
    endereco: null,
    cidade: 'Santos',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: false,
    desconto_dna_pass: null,
    ativo: true,
    destaque: false,
    ordem: 2,
  },
  {
    id: 's3',
    nome: 'Fisio Movimento',
    tipo: 'fisioterapeuta',
    descricao: 'Fisioterapia preventiva',
    especialidades: ['Coluna', 'Ergonomia'],
    desconto_descricao: '25% nas sessões',
    desconto_percentual: 25,
    aceita_convenio: true,
    convenios: [],
    atendimento_online: false,
    atendimento_presencial: true,
    telefone: null,
    whatsapp: null,
    endereco: null,
    cidade: 'São Vicente',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: false,
    desconto_dna_pass: null,
    ativo: true,
    destaque: false,
    ordem: 3,
  },
  {
    id: 's4',
    nome: 'Smart Fit Santos',
    tipo: 'academia',
    descricao: 'Mensalidade reduzida',
    especialidades: ['Musculação', 'Funcional'],
    desconto_descricao: 'R$ 59,90/mês',
    desconto_percentual: null,
    aceita_convenio: false,
    convenios: [],
    atendimento_online: false,
    atendimento_presencial: true,
    telefone: null,
    whatsapp: null,
    endereco: null,
    cidade: 'Santos',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: true,
    desconto_dna_pass: null,
    ativo: true,
    destaque: true,
    ordem: 4,
  },
  {
    id: 's5',
    nome: 'Clínica Vida Plena',
    tipo: 'clinica',
    descricao: 'Check-ups e exames',
    especialidades: ['Check-up', 'Exames'],
    desconto_descricao: '30% em exames',
    desconto_percentual: 30,
    aceita_convenio: true,
    convenios: [],
    atendimento_online: false,
    atendimento_presencial: true,
    telefone: null,
    whatsapp: null,
    endereco: null,
    cidade: 'Praia Grande',
    latitude: null,
    longitude: null,
    logo_url: null,
    foto_url: null,
    dna_pass_exclusivo: false,
    desconto_dna_pass: null,
    ativo: true,
    destaque: false,
    ordem: 5,
  },
];

/* ══════════════════════════════════════════════════════════
   SKELETON LOADING
   ══════════════════════════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-200" />
        <div className="flex-1">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
      <div className="mt-4 h-3 w-full animate-pulse rounded bg-gray-100" />
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="mt-4 h-10 animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CARD DE PARCEIRO DE SAÚDE
   ══════════════════════════════════════════════════════════ */
function SaudeCard({ parceiro, index }: { parceiro: ParceiroSaude; index: number }) {
  const tipoInfo = SAUDE_TIPO_LABELS[parceiro.tipo];
  const Icon = ICON_BY_TIPO[parceiro.tipo] ?? HeartPulse;
  const corTipo = tipoInfo?.color ?? P;

  const temWhats = parceiro.whatsapp && parceiro.whatsapp.trim() !== '';
  const temTel = parceiro.telefone && parceiro.telefone.trim() !== '';

  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className={`relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
        parceiro.destaque ? 'ring-2 ring-[#F5A623]/40' : 'border border-gray-100'
      }`}
    >
      {/* ─── Header com ícone/cor do tipo ─── */}
      <div className="flex items-start gap-4 p-5 pb-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ backgroundColor: corTipo }}
        >
          <Icon size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-tight text-primary">
            {parceiro.nome}
          </h3>
          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wide" style={{ color: corTipo }}>
            {tipoInfo?.label ?? parceiro.tipo}
          </p>
        </div>
        {parceiro.destaque && (
          <span className="absolute right-4 top-4 rounded-full bg-[#F5A623] px-2.5 py-0.5 text-[10px] font-bold text-white">
            ★ Destaque
          </span>
        )}
      </div>

      {/* ─── Descrição ─── */}
      <div className="px-5">
        {parceiro.descricao && (
          <p className="text-sm text-gray-500 line-clamp-2">{parceiro.descricao}</p>
        )}
      </div>

      {/* ─── Especialidades (tags) ─── */}
      {parceiro.especialidades && parceiro.especialidades.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pt-3">
          {parceiro.especialidades.map((esp, i) => (
            <span
              key={`${esp}-${i}`}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600"
            >
              {esp}
            </span>
          ))}
        </div>
      )}

      {/* ─── Desconto em destaque ─── */}
      {parceiro.desconto_descricao && (
        <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-[#14A76C]/10 px-3 py-2">
          <Percent size={16} className="shrink-0 text-[#14A76C]" />
          <span className="text-sm font-extrabold text-[#14A76C]">
            {parceiro.desconto_descricao}
          </span>
        </div>
      )}

      {/* ─── Badges ─── */}
      <div className="flex flex-wrap gap-1.5 px-5 pt-3">
        {parceiro.atendimento_online && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
            <Wifi size={11} /> Atendimento Online
          </span>
        )}
        {parceiro.aceita_convenio && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary">
            <ShieldPlus size={11} /> Aceita Convênio
          </span>
        )}
        {parceiro.dna_pass_exclusivo && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-[#F5A623]">
            <Crown size={11} /> DNA Pass
          </span>
        )}
      </div>

      {/* ─── Cidade ─── */}
      <div className="flex items-center gap-1 px-5 pt-3 text-xs text-gray-400">
        <MapPin size={12} />
        {parceiro.cidade}
      </div>

      {/* ─── Botões telefone / whatsapp ─── */}
      {(temTel || temWhats) && (
        <div className="mt-auto flex gap-2 p-5 pt-4">
          {temTel && (
            <a
              href={`tel:${parceiro.telefone!.replace(/\D/g, '')}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/10 py-2.5 text-xs font-bold text-primary transition hover:bg-primary/20"
            >
              <Phone size={14} />
              Ligar
            </a>
          )}
          {temWhats && (
            <a
              href={`https://wa.me/${parceiro.whatsapp!.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-secondary/10 py-2.5 text-xs font-bold text-secondary transition hover:bg-secondary/20"
            >
              <MessageCircle size={14} />
              WhatsApp
            </a>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */
export default function SaudePage() {
  const { user } = useAuth();
  const [parceiros, setParceiros] = useState<ParceiroSaude[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<SaudeTipo | 'todos'>('todos');
  const [busca, setBusca] = useState('');

  /* ── fetch data ── */
  useEffect(() => {
    let active = true;

    supabase
      .from('parceiros_saude')
      .select('*')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('ordem', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data && data.length > 0) {
          setParceiros(data as ParceiroSaude[]);
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const lista = parceiros.length > 0 ? parceiros : FALLBACK_SAUDE;

  /* ── filtros ── */
  const filtrados = useMemo(() => {
    let result = lista;
    if (filtroTipo !== 'todos') {
      result = result.filter((p) => p.tipo === filtroTipo);
    }
    if (busca.trim()) {
      const q = busca.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.cidade.toLowerCase().includes(q) ||
          p.especialidades?.some((e) => e.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [lista, filtroTipo, busca]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PageTitle title="Saúde e Bem-estar" />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 px-6 py-20">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 top-10 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-rose-300 blur-3xl" />
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
            <HeartPulse className="h-8 w-8 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl font-extrabold leading-tight text-white sm:text-5xl"
          >
            Saúde e Bem-estar
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mx-auto mt-4 max-w-xl text-lg text-white/80"
          >
            A plataforma se preocupa com quem está na estrada
          </motion.p>
        </div>
      </section>

      {/* ═══ FILTROS + BUSCA ═══ */}
      <section className="relative z-20 mx-auto -mt-6 max-w-6xl px-6">
        <div className="rounded-2xl bg-white p-5 shadow-lg">
          {/* Busca */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, especialidade ou cidade…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>

          {/* Chips de filtro por tipo */}
          <div className="mt-4 flex flex-wrap gap-2">
            {FILTROS.map((f) => {
              const active = filtroTipo === f.value;
              const info =
                f.value !== 'todos' ? SAUDE_TIPO_LABELS[f.value as SaudeTipo] : null;
              return (
                <button
                  key={f.value}
                  onClick={() => setFiltroTipo(f.value)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    active
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={active ? { backgroundColor: info?.color ?? P } : undefined}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ GRID DE PARCEIROS ═══ */}
      <section className="mx-auto mt-12 max-w-6xl px-6 pb-20">
        <div className="mb-6 flex items-center gap-2">
          <HeartPulse size={20} className="text-[#E84855]" />
          <h2 className="text-xl font-extrabold text-primary">Parceiros de Saúde</h2>
          {!loading && (
            <span className="ml-2 text-sm font-normal text-gray-400">
              {filtrados.length}{' '}
              {filtrados.length !== 1 ? 'resultados' : 'resultado'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
            <HeartPulse size={48} className="text-gray-300" />
            <p className="mt-4 text-base font-semibold text-gray-400">
              Nenhum parceiro encontrado
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Tente outro filtro ou termo de busca.
            </p>
            <button
              onClick={() => {
                setBusca('');
                setFiltroTipo('todos');
              }}
              className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-bold text-white transition hover:bg-primary-light"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={filtroTipo + busca}
              variants={stagger}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtrados.map((p, i) => (
                <SaudeCard key={p.id} parceiro={p} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>
    </div>
  );
}
