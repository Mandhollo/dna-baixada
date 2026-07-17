'use client';

import PageTitle from '@/components/seo/PageTitle';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Users,
  DollarSign,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Edit,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Star,
  X,
} from 'lucide-react';
import { supabase, formatarBRL } from '@/lib/supabase';
import type { DNAPassPlano, DNAPassAssinatura, DNAPassStatus } from '@/lib/supabase';

/* ─── tipos derivados (joins) ───────────────────────────── */
interface AssinaturaComRel extends DNAPassAssinatura {
  motorista?: {
    nome: string;
    email: string;
  } | null;
}

/* ─── status filters ───────────────────────────────────── */
type StatusFilter = 'todos' | 'ativa' | 'trial' | 'cancelada';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ativa', label: 'Ativas' },
  { value: 'trial', label: 'Trial' },
  { value: 'cancelada', label: 'Canceladas' },
];

const STATUS_BADGES: Record<string, { label: string; cls: string }> = {
  ativa: { label: 'Ativa', cls: 'bg-emerald-100 text-emerald-700' },
  trial: { label: 'Trial', cls: 'bg-amber-100 text-amber-700' },
  cancelada: { label: 'Cancelada', cls: 'bg-red-100 text-red-700' },
  expirada: { label: 'Expirada', cls: 'bg-gray-100 text-gray-600' },
  suspendida: { label: 'Suspensa', cls: 'bg-orange-100 text-orange-700' },
};

export default function AdminDNAPassPage() {
  const [aba, setAba] = useState<'planos' | 'assinaturas'>('planos');
  const [planos, setPlanos] = useState<DNAPassPlano[]>([]);
  const [assinaturas, setAssinaturas] = useState<AssinaturaComRel[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [editingPlano, setEditingPlano] = useState<DNAPassPlano | null>(null);

  /* ── Carregar dados ── */
  const load = useCallback(async () => {
    setLoading(true);
    const [planosRes, assRes] = await Promise.all([
      supabase.from('dna_pass_planos').select('*').order('ordem', { ascending: true }),
      supabase
        .from('dna_pass_assinaturas')
        .select(
          '*, plano:dna_pass_planos(*), motorista:profiles!dna_pass_assinaturas_motorista_id_fkey(nome, email)'
        )
        .order('created_at', { ascending: false }),
    ]);
    if (planosRes.data) setPlanos(planosRes.data as DNAPassPlano[]);
    if (assRes.data) setAssinaturas(assRes.data as unknown as AssinaturaComRel[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ── Stats ── */
  const totalAtivos = assinaturas.filter((a) => a.status === 'ativa').length;
  const totalTrial = assinaturas.filter((a) => a.status === 'trial').length;
  const mrr = assinaturas
    .filter((a) => a.status === 'ativa' || a.status === 'trial')
    .reduce((sum, a) => {
      const plano = a.plano;
      const meses = plano?.periodo_meses || 1;
      const valor = Number(a.valor_pago) || 0;
      return sum + valor / meses;
    }, 0);

  /* ── Filtro assinaturas ── */
  const assFiltradas = assinaturas.filter((a) => {
    if (statusFilter === 'todos') return true;
    return a.status === statusFilter;
  });

  /* ── Toggle ativo plano ── */
  const toggleAtivo = async (id: string, atual: boolean) => {
    setPlanos((prev) => prev.map((p) => (p.id === id ? { ...p, ativo: !atual } : p)));
    await supabase.from('dna_pass_planos').update({ ativo: !atual }).eq('id', id);
  };

  /* ── Salvar edição ── */
  const salvarPlano = async (id: string, dados: { preco_mensal: number; preco_total: number; desconto_percentual: number }) => {
    setPlanos((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              preco_mensal: dados.preco_mensal,
              preco_total: dados.preco_total,
              desconto_percentual: dados.desconto_percentual,
            }
          : p
      )
    );
    await supabase.from('dna_pass_planos').update(dados).eq('id', id);
    setEditingPlano(null);
  };

  /* ──────────────────────────────────────────────────────── */
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageTitle title="Admin — DNA Pass" />
      <Link
        href="/admin/premium"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para Premium
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">DNA Pass</h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Gerencie planos e assinaturas do DNA Pass
          </p>
        </div>
      </div>

      {/* ─── Stats ─────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-secondary">
            <Users className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Assinantes Ativos
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{totalAtivos}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-accent-dark">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              MRR
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
            {formatarBRL(mrr)}
          </p>
          <p className="text-xs text-[var(--foreground-secondary)]">por mês</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-600">
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
              Trials Ativos
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">{totalTrial}</p>
        </div>
      </div>

      {/* ─── Abas ──────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setAba('planos')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            aba === 'planos'
              ? 'bg-primary text-white shadow-md'
              : 'bg-[var(--surface-elevated)] text-[var(--foreground-secondary)] border border-[var(--border)]'
          }`}
        >
          <CreditCard className="w-4 h-4 inline mr-1.5" />
          Planos ({planos.length})
        </button>
        <button
          onClick={() => setAba('assinaturas')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            aba === 'assinaturas'
              ? 'bg-primary text-white shadow-md'
              : 'bg-[var(--surface-elevated)] text-[var(--foreground-secondary)] border border-[var(--border)]'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1.5" />
          Assinaturas ({assinaturas.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : aba === 'planos' ? (
        /* ─── Aba Planos ─── */
        planos.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] py-12 text-center">
            <CreditCard className="mx-auto mb-3 h-10 w-10 text-[var(--foreground-muted)]" />
            <p className="text-sm text-[var(--foreground-muted)]">Nenhum plano encontrado</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {planos.map((plano) => {
              const isDestaque = plano.destaque;
              return (
                <div
                  key={plano.id}
                  className={`relative rounded-2xl border-2 p-5 shadow-sm transition-all ${
                    isDestaque
                      ? 'border-secondary bg-gradient-to-br from-secondary/5 to-green-50/50'
                      : 'border-gray-100 bg-[var(--surface-elevated)]'
                  }`}
                >
                  {/* Badge */}
                  {plano.badge && (
                    <span
                      className={`absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold shadow-md ${
                        isDestaque ? 'bg-secondary text-white' : 'bg-accent text-primary'
                      }`}
                    >
                      <Star className="w-3 h-3 fill-current" />
                      {plano.badge}
                    </span>
                  )}

                  {/* Nome + cor */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="h-8 w-8 rounded-lg"
                      style={{ backgroundColor: plano.cor_hex }}
                    />
                    <h3 className="text-lg font-bold text-[var(--foreground)]">{plano.nome}</h3>
                  </div>

                  {/* Preço */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-medium text-[var(--foreground-muted)]">R$</span>
                      <span className="text-2xl font-extrabold text-[var(--foreground)]">
                        {plano.preco_mensal.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-xs text-[var(--foreground-muted)]">/mês</span>
                    </div>
                    <p className="text-xs text-[var(--foreground-secondary)] mt-0.5">
                      Total: {formatarBRL(plano.preco_total)} · {plano.periodo_meses}m
                    </p>
                    {plano.desconto_percentual > 0 && (
                      <p className="text-xs font-semibold text-secondary mt-0.5">
                        Economize {plano.desconto_percentual.toFixed(0)}%
                      </p>
                    )}
                  </div>

                  {/* Descrição curta */}
                  {plano.descricao_curta && (
                    <p className="text-xs text-[var(--foreground-muted)] mb-4 line-clamp-2">
                      {plano.descricao_curta}
                    </p>
                  )}

                  {/* Toggle ativo */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <button
                      onClick={() => toggleAtivo(plano.id, plano.ativo)}
                      className="flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      {plano.ativo ? (
                        <>
                          <ToggleRight className="w-6 h-6 text-secondary" />
                          <span className="text-secondary">Ativo</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                          <span className="text-gray-500">Inativo</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setEditingPlano(plano)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-[var(--foreground-secondary)] transition hover:bg-[var(--surface)] hover:text-primary"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Editar plano
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ─── Aba Assinaturas ─── */
        assinaturas.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] py-12 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-[var(--foreground-muted)]" />
            <p className="text-sm text-[var(--foreground-muted)]">
              Nenhuma assinatura encontrada
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((f) => {
                const count =
                  f.value === 'todos'
                    ? assinaturas.length
                    : assinaturas.filter((a) => a.status === f.value).length;
                return (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      statusFilter === f.value
                        ? 'bg-primary text-white'
                        : 'bg-[var(--surface-elevated)] text-[var(--foreground-secondary)] border border-[var(--border)]'
                    }`}
                  >
                    {f.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Tabela desktop */}
            <div className="hidden lg:block overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface)] text-left text-xs uppercase tracking-wider text-[var(--foreground-muted)]">
                    <th className="px-4 py-3 font-semibold">Motorista</th>
                    <th className="px-4 py-3 font-semibold">Plano</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Início</th>
                    <th className="px-4 py-3 font-semibold">Fim</th>
                    <th className="px-4 py-3 font-semibold text-center">Auto-renovar</th>
                    <th className="px-4 py-3 font-semibold text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {assFiltradas.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-[var(--foreground-muted)]">
                        Nenhuma assinatura encontrada
                      </td>
                    </tr>
                  ) : (
                    assFiltradas.map((a) => {
                      const badge = STATUS_BADGES[a.status] || {
                        label: a.status,
                        cls: 'bg-gray-100 text-gray-600',
                      };
                      return (
                        <tr
                          key={a.id}
                          className="border-b border-[var(--border-light)] transition hover:bg-[var(--surface)]"
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium text-[var(--foreground)]">
                              {a.motorista?.nome || '—'}
                            </p>
                            <p className="text-xs text-[var(--foreground-muted)]">
                              {a.motorista?.email || ''}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: a.plano?.cor_hex || '#cbd5e1' }}
                              />
                              <span className="font-medium text-[var(--foreground)]">
                                {a.plano?.nome || '—'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--foreground-secondary)]">
                            {new Date(a.inicio_em).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--foreground-secondary)]">
                            {new Date(a.fim_em).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {a.auto_renovar ? (
                              <CheckCircle2 className="mx-auto h-5 w-5 text-secondary" />
                            ) : (
                              <X className="mx-auto h-4 w-4 text-gray-400" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[var(--foreground)]">
                            {formatarBRL(Number(a.valor_pago) || 0)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Lista mobile */}
            <div className="lg:hidden space-y-3">
              {assFiltradas.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] py-10 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-[var(--foreground-muted)]" />
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Nenhuma assinatura encontrada
                  </p>
                </div>
              ) : (
                assFiltradas.map((a) => {
                  const badge = STATUS_BADGES[a.status] || {
                    label: a.status,
                    cls: 'bg-gray-100 text-gray-600',
                  };
                  return (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">
                            {a.motorista?.nome || '—'}
                          </p>
                          <p className="text-xs text-[var(--foreground-muted)]">
                            {a.motorista?.email || ''}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-[var(--foreground-muted)]">Plano</p>
                          <p className="font-medium text-[var(--foreground)]">
                            {a.plano?.nome || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--foreground-muted)]">Valor</p>
                          <p className="font-semibold text-[var(--foreground)]">
                            {formatarBRL(Number(a.valor_pago) || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--foreground-muted)]">Início</p>
                          <p className="text-[var(--foreground-secondary)]">
                            {new Date(a.inicio_em).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div>
                          <p className="text-[var(--foreground-muted)]">Fim</p>
                          <p className="text-[var(--foreground-secondary)]">
                            {new Date(a.fim_em).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <p className="text-[var(--foreground-muted)]">Auto-renovar:</p>
                          {a.auto_renovar ? (
                            <CheckCircle2 className="h-4 w-4 text-secondary" />
                          ) : (
                            <X className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )
      )}

      {/* ─── Modal Editar Plano ────────────────────────────── */}
      <AnimatePresence>
        {editingPlano && (
          <EditarPlanoModal
            plano={editingPlano}
            onClose={() => setEditingPlano(null)}
            onSave={salvarPlano}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Modal de Edição
   ═══════════════════════════════════════════════════════════ */
function EditarPlanoModal({
  plano,
  onClose,
  onSave,
}: {
  plano: DNAPassPlano;
  onClose: () => void;
  onSave: (id: string, dados: { preco_mensal: number; preco_total: number; desconto_percentual: number }) => Promise<void>;
}) {
  const [precoMensal, setPrecoMensal] = useState(String(plano.preco_mensal));
  const [precoTotal, setPrecoTotal] = useState(String(plano.preco_total));
  const [desconto, setDesconto] = useState(String(plano.desconto_percentual));
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    await onSave(plano.id, {
      preco_mensal: parseFloat(precoMensal.replace(',', '.')) || 0,
      preco_total: parseFloat(precoTotal.replace(',', '.')) || 0,
      desconto_percentual: parseFloat(desconto.replace(',', '.')) || 0,
    });
    setSalvando(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md rounded-2xl bg-[var(--surface-elevated)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" />
            Editar Plano
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition hover:bg-[var(--surface)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3 rounded-xl bg-[var(--surface)] p-3">
          <div
            className="h-10 w-10 rounded-lg"
            style={{ backgroundColor: plano.cor_hex }}
          />
          <div>
            <p className="font-bold text-[var(--foreground)]">{plano.nome}</p>
            <p className="text-xs text-[var(--foreground-muted)]">
              {plano.periodo_meses} mês(es)
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mb-1.5">
              Preço mensal (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={precoMensal}
              onChange={(e) => setPrecoMensal(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="29,90"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mb-1.5">
              Preço total (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={precoTotal}
              onChange={(e) => setPrecoTotal(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="29,90"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mb-1.5">
              Desconto (%)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={desconto}
              onChange={(e) => setDesconto(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="0"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-bold text-[var(--foreground-secondary)] transition hover:bg-[var(--surface)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
