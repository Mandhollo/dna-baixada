'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  Gift,
  Sparkles,
  Percent,
  ArrowUpCircle,
  Package,
  Award,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Tag,
  Hash,
} from 'lucide-react';
import Link from 'next/link';
import { supabase, formatarBRL } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import type {
  Recompensa,
  ResgateRecompensa,
  RecompensaCategoria,
  ResgateStatus,
} from '@/lib/supabase';
import { RECOMPENSA_CATEGORIA_LABELS } from '@/lib/supabase';

// ─── Icon map for categories ────────────────────────────────
const CATEGORY_ICONS: Record<RecompensaCategoria, React.ElementType> = {
  desconto_corrida: Percent,
  upgrade: ArrowUpCircle,
  produto: Package,
  experiencia: Sparkles,
  certificado: Award,
  outro: Gift,
};

const RESGATE_STATUS_CONFIG: Record<ResgateStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pendente: { label: 'Pendente', color: 'text-[#F5A623]', bg: 'bg-[#F5A623]/10', icon: Clock },
  aprovado: { label: 'Aprovado', color: 'text-[#14A76C]', bg: 'bg-[#14A76C]/10', icon: CheckCircle2 },
  entregue: { label: 'Entregue', color: 'text-[#0A2463]', bg: 'bg-[#0A2463]/10', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'text-[#E84855]', bg: 'bg-[#E84855]/10', icon: XCircle },
};

const CATEGORIES: { value: RecompensaCategoria | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  ...Object.entries(RECOMPENSA_CATEGORIA_LABELS).map(([value, { label }]) => ({
    value: value as RecompensaCategoria,
    label,
  })),
];

// ─── Animations ─────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

// ─── Skeleton ───────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
      <PageTitle title='Recompensas' />
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div className="w-16 h-5 rounded-full bg-gray-200" />
      </div>
      <div className="h-5 w-3/4 rounded bg-gray-200 mb-2" />
      <div className="h-4 w-full rounded bg-gray-100 mb-1" />
      <div className="h-4 w-2/3 rounded bg-gray-100 mb-4" />
      <div className="flex items-center justify-between">
        <div className="h-8 w-24 rounded-xl bg-gray-200" />
        <div className="h-10 w-28 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}

function SkeletonResgate() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/2 rounded bg-gray-200" />
        <div className="h-3 w-1/3 rounded bg-gray-100" />
      </div>
      <div className="w-20 h-6 rounded-full bg-gray-200" />
    </div>
  );
}

// ─── Confirm Modal ──────────────────────────────────────────
function ConfirmModal({
  open,
  recompensa,
  pontosAtuais,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  recompensa: Recompensa | null;
  pontosAtuais: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  if (!open || !recompensa) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#F5A623]/10 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-[#F5A623]" />
          </div>
          <h3 className="text-xl font-bold text-[#0A2463]">Confirmar Resgate</h3>
          <p className="text-gray-600 mt-2">{recompensa.nome}</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Seus pontos</span>
            <span className="font-bold text-[#0A2463]">{pontosAtuais.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Custo</span>
            <span className="font-bold text-[#E84855]">-{recompensa.pontos_necessarios.toLocaleString('pt-BR')}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
            <span className="text-gray-500">Saldo após resgate</span>
            <span className="font-bold text-[#14A76C]">
              {(pontosAtuais - recompensa.pontos_necessarios).toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-[#14A76C] text-white font-semibold hover:bg-[#128f5e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resgatando…
              </>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Success Toast ──────────────────────────────────────────
function SuccessToast({
  show,
  codigo,
  onClose,
}: {
  show: boolean;
  codigo: string | null;
  onClose: () => void;
}) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#14A76C] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm"
    >
      <CheckCircle2 className="w-6 h-6 shrink-0" />
      <div className="flex-1">
        <p className="font-bold text-sm">Resgate realizado!</p>
        {codigo && (
          <p className="text-white/80 text-xs mt-0.5">
            Código: <span className="font-mono font-bold">{codigo}</span>
          </p>
        )}
      </div>
      <button onClick={onClose} className="text-white/70 hover:text-white">
        <XCircle className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export default function RecompensasPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();

  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [resgates, setResgates] = useState<ResgateRecompensa[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaFiltro, setCategoriaFiltro] = useState<RecompensaCategoria | 'todos'>('todos');
  const [confirmRecompensa, setConfirmRecompensa] = useState<Recompensa | null>(null);
  const [resgatando, setResgatando] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; codigo: string | null }>({ show: false, codigo: null });

  // Fetch recompensas
  const fetchRecompensas = useCallback(async () => {
    const { data, error } = await supabase
      .from('recompensas')
      .select('*')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('pontos_necessarios', { ascending: true });

    if (!error && data) {
      setRecompensas(data as Recompensa[]);
    }
  }, []);

  // Fetch resgates do usuário
  const fetchResgates = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('resgates_recompensas')
      .select('*, recompensa:recompensas(nome, descricao, categoria)')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setResgates(data as unknown as ResgateRecompensa[]);
    }
  }, [user]);

  useEffect(() => {
    Promise.all([fetchRecompensas(), fetchResgates()]).finally(() => setLoading(false));
  }, [fetchRecompensas, fetchResgates]);

  // Filtered
  const recompensasFiltradas =
    categoriaFiltro === 'todos'
      ? recompensas
      : recompensas.filter((r) => r.categoria === categoriaFiltro);

  // Stock
  const getEstoque = (r: Recompensa) => {
    if (r.quantidade_total == null) return Infinity;
    return r.quantidade_total - r.quantidade_resgatada;
  };

  // Resgatar
  const handleResgatar = async () => {
    if (!user || !confirmRecompensa) return;
    setResgatando(true);

    try {
      const codigo = `DNA-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // 1. Criar resgate
      const { error: resgateError } = await supabase.from('resgates_recompensas').insert({
        recompensa_id: confirmRecompensa.id,
        usuario_id: user.id,
        pontos_gastos: confirmRecompensa.pontos_necessarios,
        status: 'pendente',
        codigo_resgate: codigo,
      });

      if (resgateError) throw resgateError;

      // 2. Atualizar quantidade resgatada
      const { error: updateError } = await supabase
        .from('recompensas')
        .update({ quantidade_resgatada: confirmRecompensa.quantidade_resgatada + 1 })
        .eq('id', confirmRecompensa.id);

      if (updateError) throw updateError;

      // 3. Deduzir pontos do profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ pontos: (profile?.pontos ?? 0) - confirmRecompensa.pontos_necessarios })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 4. Registrar no histórico de pontos
      const { error: historicoError } = await supabase.from('historico_pontos').insert({
        usuario_id: user.id,
        tipo: 'resgate',
        pontos: -confirmRecompensa.pontos_necessarios,
        descricao: `Resgate: ${confirmRecompensa.nome}`,
      });

      if (historicoError) throw historicoError;

      // Refresh
      await Promise.all([fetchRecompensas(), fetchResgates(), refreshProfile()]);

      setConfirmRecompensa(null);
      setToast({ show: true, codigo });
      setTimeout(() => setToast({ show: false, codigo: null }), 6000);
    } catch (err) {
      console.error('Erro ao resgatar:', err);
      alert('Erro ao realizar resgate. Tente novamente.');
    } finally {
      setResgatando(false);
    }
  };

  const pontosAtuais = profile?.pontos ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#14A76C] via-[#0d6b4f] to-[#0A2463] py-24 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-[#F5A623] blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#14A76C] blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Back link */}
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
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block text-sm font-semibold tracking-widest uppercase text-[#F5A623] mb-4"
            >
              DNA Baixada
            </motion.span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
              Recompensas
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-lg text-white/80">
              Troque seus pontos por benefícios reais
            </p>
          </motion.div>

          {/* Pontos Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 max-w-sm mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-[#F5A623]/20 flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-7 h-7 text-[#F5A623]" />
              </div>
              {authLoading ? (
                <div className="h-8 w-24 rounded bg-white/20 animate-pulse mx-auto" />
              ) : profile ? (
                <>
                  <p className="text-white/60 text-sm font-medium mb-1">Seus Pontos</p>
                  <p className="text-3xl font-extrabold text-white">
                    {pontosAtuais.toLocaleString('pt-BR')}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white/60 text-sm">Seus Pontos</p>
                  <p className="text-white font-semibold mt-1 text-sm">
                    Entre para acumular
                  </p>
                  <Link
                    href="/entrar"
                    className="inline-flex items-center gap-1 mt-3 text-[#F5A623] text-sm font-bold hover:underline"
                  >
                    <Star className="w-4 h-4" />
                    Fazer login
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Filtros ──────────────────────────────────────── */}
      <section className="py-8 px-6 bg-gray-50 border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategoriaFiltro(cat.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  categoriaFiltro === cat.value
                    ? 'bg-[#0A2463] text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-[#0A2463]/30 hover:text-[#0A2463]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Grid de Recompensas ──────────────────────────── */}
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
              className="text-3xl md:text-4xl font-bold text-[#0A2463]"
            >
              Catálogo de Recompensas
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
          ) : recompensasFiltradas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Nenhuma recompensa disponível nesta categoria.</p>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={stagger}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {recompensasFiltradas.map((r, i) => {
                const Icon = CATEGORY_ICONS[r.categoria] || Gift;
                const estoque = getEstoque(r);
                const temPontos = profile ? pontosAtuais >= r.pontos_necessarios : false;
                const semEstoque = estoque <= 0;

                return (
                  <motion.div
                    key={r.id}
                    variants={fadeUp}
                    custom={i}
                    className="relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow group border border-gray-100"
                  >
                    {/* Badge destaque */}
                    {r.destaque && (
                      <div className="absolute -top-3 left-6">
                        <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#F5A623] to-[#e6951c] text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                          <Star className="w-3 h-3" />
                          Destaque
                        </span>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-[#0A2463]/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-[#0A2463]" />
                      </div>
                      {r.valor_desconto != null && r.valor_desconto > 0 && (
                        <span className="inline-flex items-center gap-1 bg-[#14A76C]/10 text-[#14A76C] text-xs font-bold px-2.5 py-1 rounded-full">
                          <Tag className="w-3 h-3" />
                          {formatarBRL(r.valor_desconto)} off
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <h3 className="text-lg font-bold text-[#0A2463] mb-1 line-clamp-1">{r.nome}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-2">
                      {r.descricao}
                    </p>

                    {/* Pontos */}
                    <div className="flex items-center gap-1.5 mb-4">
                      <Star className="w-5 h-5 text-[#F5A623] fill-[#F5A623]" />
                      <span className="text-xl font-extrabold text-[#0A2463]">
                        {r.pontos_necessarios.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-sm text-gray-400">pontos</span>
                    </div>

                    {/* Estoque */}
                    {estoque !== Infinity && (
                      <p className={`text-xs mb-4 ${estoque <= 5 ? 'text-[#E84855] font-semibold' : 'text-gray-400'}`}>
                        {estoque > 0 ? `${estoque} restante${estoque > 1 ? 's' : ''}` : 'Esgotado'}
                      </p>
                    )}

                    {/* Action */}
                    {!profile ? (
                      <Link
                        href="/entrar"
                        className="block w-full text-center py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors"
                      >
                        Entre para resgatar
                      </Link>
                    ) : semEstoque ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 font-semibold text-sm cursor-not-allowed"
                      >
                        Esgotado
                      </button>
                    ) : temPontos ? (
                      <button
                        onClick={() => setConfirmRecompensa(r)}
                        className="w-full py-2.5 rounded-xl bg-[#14A76C] text-white font-semibold text-sm hover:bg-[#128f5e] transition-colors"
                      >
                        Resgatar
                      </button>
                    ) : (
                      <div className="text-center">
                        <p className="text-xs text-[#E84855] font-semibold mb-1.5">
                          <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                          Faltam {(r.pontos_necessarios - pontosAtuais).toLocaleString('pt-BR')} pontos
                        </p>
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-400 font-semibold text-sm cursor-not-allowed"
                        >
                          Pontos insuficientes
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

      {/* ─── Meus Resgates ────────────────────────────────── */}
      {user && (
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={stagger}
              className="text-center mb-10"
            >
              <motion.h2
                variants={fadeUp}
                custom={0}
                className="text-3xl font-bold text-[#0A2463]"
              >
                Meus Resgates
              </motion.h2>
              <motion.div
                variants={fadeUp}
                custom={1}
                className="mt-3 w-16 h-1 bg-gradient-to-r from-[#14A76C] to-[#F5A623] mx-auto rounded-full"
              />
            </motion.div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonResgate key={i} />
                ))}
              </div>
            ) : resgates.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Você ainda não resgatou nenhuma recompensa.</p>
              </motion.div>
            ) : (
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
                className="space-y-3"
              >
                {resgates.map((resgate, i) => {
                  const statusConfig = RESGATE_STATUS_CONFIG[resgate.status];
                  const StatusIcon = statusConfig.icon;
                  const catInfo = resgate.recompensa?.categoria
                    ? RECOMPENSA_CATEGORIA_LABELS[resgate.recompensa.categoria]
                    : null;
                  const CatIcon = catInfo
                    ? CATEGORY_ICONS[resgate.recompensa!.categoria] || Gift
                    : Gift;

                  return (
                    <motion.div
                      key={resgate.id}
                      variants={fadeUp}
                      custom={i}
                      className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#0A2463]/10 flex items-center justify-center shrink-0">
                        <CatIcon className="w-5 h-5 text-[#0A2463]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#0A2463] text-sm truncate">
                          {resgate.recompensa?.nome ?? 'Recompensa'}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-[#F5A623]" />
                            {resgate.pontos_gastos.toLocaleString('pt-BR')} pts
                          </span>
                          {resgate.codigo_resgate && (
                            <span className="flex items-center gap-1 font-mono">
                              <Hash className="w-3 h-3" />
                              {resgate.codigo_resgate}
                            </span>
                          )}
                          <span>
                            {new Date(resgate.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${statusConfig.color} ${statusConfig.bg}`}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* ─── Confirm Modal ────────────────────────────────── */}
      <AnimatePresence>
        <ConfirmModal
          open={!!confirmRecompensa}
          recompensa={confirmRecompensa}
          pontosAtuais={pontosAtuais}
          onConfirm={handleResgatar}
          onCancel={() => setConfirmRecompensa(null)}
          loading={resgatando}
        />
      </AnimatePresence>

      {/* ─── Success Toast ────────────────────────────────── */}
      <AnimatePresence>
        <SuccessToast
          show={toast.show}
          codigo={toast.codigo}
          onClose={() => setToast({ show: false, codigo: null })}
        />
      </AnimatePresence>
    </div>
  );
}
