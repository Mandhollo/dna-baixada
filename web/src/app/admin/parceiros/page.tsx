'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Search,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Ban,
  MapPin,
  Tag,
  Star,
  Calendar,
  RefreshCw,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Building2,
  Eye,
  EyeOff,
  Verified,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  supabase,
  type Estabelecimento,
  type EstabelecimentoCategoria,
  ESTABELECIMENTO_CATEGORIA_LABELS,
} from '@/lib/supabase';

/* ─── animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: 'easeOut' as const },
  }),
};

/* ─── Filter types ─── */
type StatusFilter = 'todos' | 'verificado' | 'nao_verificado' | 'ativo' | 'inativo';

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'verificado', label: 'Verificados' },
  { value: 'nao_verificado', label: 'Não verificados' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'inativo', label: 'Inativos' },
];

export default function AdminParceirosPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<EstabelecimentoCategoria | 'todos'>('todos');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== 'admin') {
      router.replace('/entrar');
    }
  }, [user, profile, authLoading, router]);

  /* ── Fetch ── */
  const fetchEstabelecimentos = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('estabelecimentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (categoriaFilter !== 'todos') {
      query = query.eq('categoria', categoriaFilter);
    }

    if (statusFilter === 'verificado') {
      query = query.eq('verificado', true);
    } else if (statusFilter === 'nao_verificado') {
      query = query.eq('verificado', false);
    } else if (statusFilter === 'ativo') {
      query = query.eq('ativo', true);
    } else if (statusFilter === 'inativo') {
      query = query.eq('ativo', false);
    }

    if (searchTerm.trim()) {
      query = query.ilike('nome', `%${searchTerm.trim()}%`);
    }

    const { data, error: fetchError } = await query.limit(100);

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setEstabelecimentos((data as Estabelecimento[]) ?? []);
    }
    setLoading(false);
  }, [categoriaFilter, statusFilter, searchTerm]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchEstabelecimentos();
    }
  }, [profile, categoriaFilter, statusFilter, fetchEstabelecimentos]);

  /* ── Actions ── */
  const handleVerificar = async (id: string) => {
    setActionLoading(id);
    const { error: updateError } = await supabase
      .from('estabelecimentos')
      .update({ verificado: true })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setEstabelecimentos((prev) =>
        prev.map((e) => (e.id === id ? { ...e, verificado: true } : e))
      );
    }
    setActionLoading(null);
  };

  const handleDesativar = async (id: string) => {
    setActionLoading(id);
    const { error: updateError } = await supabase
      .from('estabelecimentos')
      .update({ ativo: false })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setEstabelecimentos((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ativo: false } : e))
      );
    }
    setActionLoading(null);
  };

  const handleReativar = async (id: string) => {
    setActionLoading(id);
    const { error: updateError } = await supabase
      .from('estabelecimentos')
      .update({ ativo: true })
      .eq('id', id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setEstabelecimentos((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ativo: true } : e))
      );
    }
    setActionLoading(null);
  };

  /* ── Loading / Auth ── */
  if (authLoading || !profile || profile.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  /* ── Counters ── */
  const total = estabelecimentos.length;
  const verificadosCount = estabelecimentos.filter((e) => e.verificado).length;
  const naoVerificadosCount = estabelecimentos.filter((e) => !e.verificado).length;
  const inativosCount = estabelecimentos.filter((e) => !e.ativo).length;

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Admin · DNA Baixada
            </p>
            <h1 className="text-lg font-bold sm:text-xl flex items-center gap-2">
              <Store size={22} />
              Gestão de Parceiros
            </h1>
          </div>
          <button
            onClick={fetchEstabelecimentos}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
          >
            <RefreshCw size={16} /> Atualizar
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* ── Stats ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0}
          className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Total</p>
            <p className="mt-1 text-2xl font-bold text-primary">{total}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Verificados</p>
            <p className="mt-1 text-2xl font-bold text-secondary">{verificadosCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Não Verificados</p>
            <p className="mt-1 text-2xl font-bold text-accent-dark">{naoVerificadosCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Inativos</p>
            <p className="mt-1 text-2xl font-bold text-accent2">{inativosCount}</p>
          </div>
        </motion.div>

        {/* ── Error banner ── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 flex items-center gap-2 rounded-xl border border-accent2/30 bg-accent2/5 px-4 py-3 text-sm text-accent2"
            >
              <AlertTriangle size={16} />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-accent2/60 hover:text-accent2">✕</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Filters ── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          className="mb-6 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-elevated py-3 pl-11 pr-4 text-sm text-foreground placeholder-foreground-muted/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div className="relative">
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value as EstabelecimentoCategoria | 'todos')}
              className="appearance-none rounded-xl border border-border bg-surface-elevated py-3 pl-4 pr-10 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              <option value="todos">Todas as categorias</option>
              {Object.entries(ESTABELECIMENTO_CATEGORIA_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="appearance-none rounded-xl border border-border bg-surface-elevated py-3 pl-4 pr-10 text-sm font-medium text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          </div>
        </motion.div>

        {/* ── List / Skeleton ── */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-border bg-surface-elevated p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-background-tertiary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-background-tertiary" />
                    <div className="h-3 w-1/2 rounded bg-background-tertiary" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full rounded bg-background-tertiary" />
                  <div className="h-3 w-2/3 rounded bg-background-tertiary" />
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="h-8 w-20 rounded-lg bg-background-tertiary" />
                  <div className="h-8 w-20 rounded-lg bg-background-tertiary" />
                </div>
              </div>
            ))}
          </div>
        ) : estabelecimentos.length === 0 ? (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="rounded-2xl border border-border bg-surface-elevated p-12 text-center shadow-sm"
          >
            <Store size={48} className="mx-auto text-foreground-muted/30" />
            <p className="mt-4 text-lg font-bold text-foreground">Nenhum estabelecimento encontrado</p>
            <p className="mt-1 text-sm text-foreground-muted">Tente ajustar os filtros de busca.</p>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {estabelecimentos.map((est, idx) => {
              const catConf = ESTABELECIMENTO_CATEGORIA_LABELS[est.categoria];
              const isAction = actionLoading === est.id;

              return (
                <motion.div
                  key={est.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={idx + 2}
                  className={`rounded-2xl border bg-surface-elevated p-5 shadow-sm transition ${
                    !est.ativo ? 'border-accent2/20 opacity-70' : 'border-border hover:shadow-md'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: catConf?.color ?? '#0A2463' }}
                    >
                      <Building2 size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground truncate">{est.nome}</p>
                        {est.verificado && (
                          <Verified size={14} className="shrink-0 text-secondary" />
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted flex items-center gap-1 mt-0.5">
                        <Tag size={11} />
                        {catConf?.label ?? est.categoria}
                      </p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="mt-4 space-y-1.5">
                    <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{est.cidade}{est.bairro ? ` · ${est.bairro}` : ''}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
                      <Star size={12} className="shrink-0 text-accent-dark" />
                      <span>{est.avaliacao_media.toFixed(1)} ({est.total_avaliacoes} avaliações)</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
                      <Calendar size={12} className="shrink-0" />
                      <span>Desde {new Date(est.created_at).toLocaleDateString('pt-BR')}</span>
                    </p>
                  </div>

                  {/* Status badges */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!est.ativo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent2/10 px-2.5 py-0.5 text-[10px] font-bold text-accent2 uppercase">
                        <EyeOff size={10} /> Inativo
                      </span>
                    )}
                    {est.ativo && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-[10px] font-bold text-secondary uppercase">
                        <Eye size={10} /> Ativo
                      </span>
                    )}
                    {!est.verificado && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent-dark uppercase">
                        <ShieldCheck size={10} /> Não verificado
                      </span>
                    )}
                    {est.verificado && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-0.5 text-[10px] font-bold text-secondary uppercase">
                        <CheckCircle size={10} /> Verificado
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border/50 pt-4">
                    {!est.verificado && (
                      <button
                        onClick={() => handleVerificar(est.id)}
                        disabled={isAction}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-secondary-dark disabled:opacity-50"
                      >
                        {isAction ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                        Verificar
                      </button>
                    )}
                    {est.ativo ? (
                      <button
                        onClick={() => handleDesativar(est.id)}
                        disabled={isAction}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-accent2/30 px-3 py-1.5 text-xs font-bold text-accent2 transition hover:bg-accent2/5 disabled:opacity-50"
                      >
                        {isAction ? <Loader2 size={14} className="animate-spin" /> : <EyeOff size={14} />}
                        Desativar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReativar(est.id)}
                        disabled={isAction}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-secondary/30 px-3 py-1.5 text-xs font-bold text-secondary transition hover:bg-secondary/5 disabled:opacity-50"
                      >
                        {isAction ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                        Reativar
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
