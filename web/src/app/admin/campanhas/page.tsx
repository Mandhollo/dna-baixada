'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Star,
  Power,
  Loader2,
  X,
  Save,
  Megaphone,
  CalendarDays,
  MapPin,
  Target,
  CheckCircle2,
  XCircle,
  Search,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  supabase,
  CAMPANHA_SOCIAL_CATEGORIA_LABELS,
} from '@/lib/supabase';
import type {
  CampanhaSocial,
  CampanhaSocialCategoria,
  CampanhaSocialStatus,
} from '@/lib/supabase';

/* ─── animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const },
  }),
};

/* ─── Category options ─── */
const CATEGORIAS = Object.entries(CAMPANHA_SOCIAL_CATEGORIA_LABELS).map(
  ([value, info]) => ({ value: value as CampanhaSocialCategoria, label: info.label, color: info.color })
);

/* ─── Form data type ─── */
interface CampanhaFormData {
  titulo: string;
  descricao: string;
  categoria: CampanhaSocialCategoria;
  meta_valor: string;
  meta_unidade: string;
  data_inicio: string;
  data_fim: string;
  pontos_participacao: string;
  local: string;
}

const EMPTY_FORM: CampanhaFormData = {
  titulo: '',
  descricao: '',
  categoria: 'alimentos',
  meta_valor: '',
  meta_unidade: '',
  data_inicio: new Date().toISOString().split('T')[0],
  data_fim: '',
  pontos_participacao: '50',
  local: '',
};

/* ════════════════════════════════════════════════════════════ */
/*  Page Component                                            */
/* ════════════════════════════════════════════════════════════ */
export default function AdminCampanhasPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [campanhas, setCampanhas] = useState<CampanhaSocial[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<CampanhaFormData>(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [msgErro, setMsgErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

  /* ── Auth guard ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== 'admin') {
      router.replace('/entrar');
    }
  }, [user, profile, authLoading, router]);

  /* ── Fetch campanhas ── */
  const fetchCampanhas = useCallback(async () => {
    if (!user || profile?.role !== 'admin') return;
    setCarregando(true);
    const { data, error } = await supabase
      .from('campanhas_sociais')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCampanhas(data as CampanhaSocial[]);
    }
    setCarregando(false);
  }, [user, profile]);

  useEffect(() => {
    fetchCampanhas();
  }, [fetchCampanhas]);

  /* ── Toggle status ── */
  async function toggleStatus(campanha: CampanhaSocial) {
    const novoStatus: CampanhaSocialStatus = campanha.status === 'ativa' ? 'encerrada' : 'ativa';
    const { error } = await supabase
      .from('campanhas_sociais')
      .update({ status: novoStatus })
      .eq('id', campanha.id);

    if (!error) {
      setCampanhas((prev) =>
        prev.map((c) => (c.id === campanha.id ? { ...c, status: novoStatus } : c))
      );
    }
  }

  /* ── Toggle destaque ── */
  async function toggleDestaque(campanha: CampanhaSocial) {
    const { error } = await supabase
      .from('campanhas_sociais')
      .update({ destaque: !campanha.destaque })
      .eq('id', campanha.id);

    if (!error) {
      setCampanhas((prev) =>
        prev.map((c) => (c.id === campanha.id ? { ...c, destaque: !c.destaque } : c))
      );
    }
  }

  /* ── Modal open/close ── */
  function abrirNovaCampanha() {
    setEditandoId(null);
    setForm(EMPTY_FORM);
    setMsgErro(null);
    setShowModal(true);
  }

  function abrirEditar(campanha: CampanhaSocial) {
    setEditandoId(campanha.id);
    setForm({
      titulo: campanha.titulo,
      descricao: campanha.descricao,
      categoria: campanha.categoria,
      meta_valor: campanha.meta_valor ? String(campanha.meta_valor) : '',
      meta_unidade: campanha.meta_unidade ?? '',
      data_inicio: campanha.data_inicio ?? '',
      data_fim: campanha.data_fim ?? '',
      pontos_participacao: String(campanha.pontos_participacao),
      local: campanha.local ?? '',
    });
    setMsgErro(null);
    setShowModal(true);
  }

  function fecharModal() {
    setShowModal(false);
    setEditandoId(null);
    setMsgErro(null);
  }

  /* ── Save (create or update) ── */
  async function salvar() {
    if (!form.titulo.trim() || !form.descricao.trim()) {
      setMsgErro('Título e descrição são obrigatórios.');
      return;
    }

    setSalvando(true);
    setMsgErro(null);

    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      categoria: form.categoria,
      meta_valor: form.meta_valor ? Number(form.meta_valor) : null,
      meta_unidade: form.meta_unidade.trim() || null,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
      pontos_participacao: Number(form.pontos_participacao) || 50,
      local: form.local.trim() || null,
      cidade: 'Santos',
    };

    let error;
    if (editandoId) {
      ({ error } = await supabase
        .from('campanhas_sociais')
        .update(payload)
        .eq('id', editandoId));
    } else {
      ({ error } = await supabase
        .from('campanhas_sociais')
        .insert({ ...payload, status: 'planejada', destaque: false, meta_alcancada: 0, recorrente: false }));
    }

    setSalvando(false);

    if (error) {
      setMsgErro('Erro ao salvar: ' + error.message);
      return;
    }

    fecharModal();
    fetchCampanhas();
  }

  /* ── Filter ── */
  const campanhasFiltradas = campanhas.filter((c) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      c.titulo.toLowerCase().includes(termo) ||
      c.descricao.toLowerCase().includes(termo) ||
      c.categoria.toLowerCase().includes(termo)
    );
  });

  /* ── Loading / auth ── */
  if (authLoading || !profile) {
    return <LoadingSkeleton />;
  }

  if (profile.role !== 'admin') return null;

  return (
    <div className="space-y-8">
      <PageTitle title='Campanhas' />
      {/* ═══ Header ═══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl flex items-center gap-3">
            <Megaphone className="h-7 w-7 text-primary" />
            Gestão de Campanhas Sociais
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Crie, edite e gerencie campanhas de impacto social
          </p>
        </div>
        <button
          onClick={abrirNovaCampanha}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-light px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl"
        >
          <Plus size={18} />
          Nova Campanha
        </button>
      </motion.div>

      {/* ═══ Search ═══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Buscar campanhas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-elevated py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </motion.div>

      {/* ═══ Campanhas list ═══ */}
      {carregando ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-elevated" />
          ))}
        </div>
      ) : campanhasFiltradas.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface-elevated p-8 text-center shadow-sm">
          <Megaphone size={40} className="mx-auto text-foreground-muted/40" />
          <p className="mt-3 font-semibold text-foreground-secondary">
            {campanhas.length === 0 ? 'Nenhuma campanha criada' : 'Nenhum resultado'}
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            {campanhas.length === 0
              ? 'Clique em "Nova Campanha" para criar a primeira campanha social.'
              : 'Tente outro termo de busca.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {campanhasFiltradas.map((campanha, i) => {
            const catInfo = CAMPANHA_SOCIAL_CATEGORIA_LABELS[campanha.categoria];
            return (
              <motion.div
                key={campanha.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={i + 2}
                className={`rounded-2xl border bg-surface-elevated p-4 shadow-sm transition hover:shadow-md ${
                  campanha.destaque ? 'border-accent/30 ring-1 ring-accent/10' : 'border-border'
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <h3 className="font-bold text-foreground truncate">{campanha.titulo}</h3>
                      {campanha.destaque && (
                        <Star size={14} className="shrink-0 text-accent fill-accent" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground-muted line-clamp-2">
                      {campanha.descricao}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/* Categoria badge */}
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ backgroundColor: catInfo.color + '15', color: catInfo.color }}
                      >
                        {catInfo.label}
                      </span>
                      {/* Status badge */}
                      <StatusBadge status={campanha.status} />
                      {/* Meta */}
                      {campanha.meta_valor && (
                        <span className="flex items-center gap-1 text-[11px] text-foreground-muted">
                          <Target size={11} />
                          {campanha.meta_valor} {campanha.meta_unidade}
                        </span>
                      )}
                      {/* Date */}
                      {campanha.data_inicio && (
                        <span className="flex items-center gap-1 text-[11px] text-foreground-muted">
                          <CalendarDays size={11} />
                          {new Date(campanha.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                      {/* Local */}
                      {campanha.local && (
                        <span className="flex items-center gap-1 text-[11px] text-foreground-muted">
                          <MapPin size={11} />
                          {campanha.local}
                        </span>
                      )}
                      {/* Pontos */}
                      <span className="text-[11px] font-semibold text-accent-dark">
                        {campanha.pontos_participacao} pts
                      </span>
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => abrirEditar(campanha)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/5 text-primary transition hover:bg-primary/10"
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => toggleDestaque(campanha)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl transition ${
                        campanha.destaque
                          ? 'bg-accent/10 text-accent-dark'
                          : 'bg-background-tertiary text-foreground-muted hover:text-accent-dark'
                      }`}
                      aria-label={campanha.destaque ? 'Remover destaque' : 'Destacar'}
                    >
                      <Star size={14} className={campanha.destaque ? 'fill-accent' : ''} />
                    </button>
                    <button
                      onClick={() => toggleStatus(campanha)}
                      className={`flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition ${
                        campanha.status === 'ativa'
                          ? 'bg-accent2/10 text-accent2 hover:bg-accent2/20'
                          : 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                      }`}
                      aria-label={campanha.status === 'ativa' ? 'Encerrar' : 'Ativar'}
                    >
                      <Power size={13} />
                      {campanha.status === 'ativa' ? 'Encerrar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ Modal ═══ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
            onClick={fecharModal}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-surface-elevated shadow-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface-elevated px-5 py-4">
                <h2 className="text-lg font-bold text-foreground">
                  {editandoId ? 'Editar Campanha' : 'Nova Campanha'}
                </h2>
                <button
                  onClick={fecharModal}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-background-tertiary text-foreground-muted transition hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <div className="px-5 py-4 space-y-4">
                {msgErro && (
                  <div className="flex items-center gap-2 rounded-xl border border-accent2/20 bg-accent2/5 p-3 text-sm font-semibold text-accent2">
                    <XCircle size={16} />
                    {msgErro}
                  </div>
                )}

                {/* Título */}
                <Field label="Título *">
                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    className={inputCls}
                    placeholder="Ex: Arrecadação de Alimentos"
                  />
                </Field>

                {/* Descrição */}
                <Field label="Descrição *">
                  <textarea
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    className={`${inputCls} min-h-[80px] resize-y`}
                    placeholder="Descreva a campanha..."
                  />
                </Field>

                {/* Categoria */}
                <Field label="Categoria">
                  <select
                    value={form.categoria}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value as CampanhaSocialCategoria })}
                    className={inputCls}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </Field>

                {/* Meta valor + unidade */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Meta Valor">
                    <input
                      type="number"
                      value={form.meta_valor}
                      onChange={(e) => setForm({ ...form, meta_valor: e.target.value })}
                      className={inputCls}
                      placeholder="Ex: 500"
                    />
                  </Field>
                  <Field label="Meta Unidade">
                    <input
                      type="text"
                      value={form.meta_unidade}
                      onChange={(e) => setForm({ ...form, meta_unidade: e.target.value })}
                      className={inputCls}
                      placeholder="Ex: kg, unidades"
                    />
                  </Field>
                </div>

                {/* Datas */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Data Início">
                    <input
                      type="date"
                      value={form.data_inicio}
                      onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Data Fim">
                    <input
                      type="date"
                      value={form.data_fim}
                      onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                      className={inputCls}
                    />
                  </Field>
                </div>

                {/* Pontos + Local */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Pontos por Participação">
                    <input
                      type="number"
                      value={form.pontos_participacao}
                      onChange={(e) => setForm({ ...form, pontos_participacao: e.target.value })}
                      className={inputCls}
                      placeholder="50"
                    />
                  </Field>
                  <Field label="Local">
                    <input
                      type="text"
                      value={form.local}
                      onChange={(e) => setForm({ ...form, local: e.target.value })}
                      className={inputCls}
                      placeholder="Ex: Praça da Independência"
                    />
                  </Field>
                </div>
              </div>

              {/* Modal footer */}
              <div className="sticky bottom-0 border-t border-border bg-surface-elevated px-5 py-4 flex gap-3">
                <button
                  onClick={fecharModal}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground-secondary transition hover:bg-background-tertiary"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  disabled={salvando}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-50"
                >
                  {salvando ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {editandoId ? 'Salvar Alterações' : 'Criar Campanha'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
/*  Sub-components                                            */
/* ════════════════════════════════════════════════════════════ */

function StatusBadge({ status }: { status: CampanhaSocialStatus }) {
  const config: Record<CampanhaSocialStatus, { label: string; color: string; bg: string }> = {
    ativa: { label: 'Ativa', color: 'text-secondary', bg: 'bg-secondary/10' },
    encerrada: { label: 'Encerrada', color: 'text-foreground-muted', bg: 'bg-background-tertiary' },
    planejada: { label: 'Planejada', color: 'text-accent-dark', bg: 'bg-accent/10' },
  };
  const c = config[status] ?? config.planejada;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${c.bg} ${c.color}`}>
      {status === 'ativa' ? <CheckCircle2 size={10} /> : status === 'encerrada' ? <XCircle size={10} /> : <CalendarDays size={10} />}
      {c.label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-foreground-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/40 focus:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/10';

/* ════════════════════════════════════════════════════════════ */
/*  Skeleton                                                  */
/* ════════════════════════════════════════════════════════════ */
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-72 rounded-xl animate-pulse bg-surface-elevated" />
          <div className="h-4 w-52 rounded-lg animate-pulse bg-surface-elevated" />
        </div>
        <div className="h-10 w-36 rounded-xl animate-pulse bg-surface-elevated" />
      </div>
      <div className="h-10 rounded-xl animate-pulse bg-surface-elevated" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-surface-elevated" />
        ))}
      </div>
    </div>
  );
}
