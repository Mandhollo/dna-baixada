'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Store,
  Plus,
  X,
  Pencil,
  Trash2,
  Check,
  CheckCircle,
  XCircle,
  Search,
  Star,
  MapPin,
  Phone,
  Globe,
  Building2,
  Loader2,
  Tag,
} from 'lucide-react';

interface Parceiro {
  id: string;
  cnpj: string | null;
  nome_fantasia: string;
  razao_social: string | null;
  categoria: string | null;
  descricao: string | null;
  endereco: string | null;
  cidade: string | null;
  telefone_comercial: string | null;
  site_url: string | null;
  foto_url: string | null;
  logo_url: string | null;
  status: string;
  avaliacao_media: number | null;
  total_avaliacoes: number | null;
  desconto_percento?: number | null;
  created_at?: string;
  updated_at?: string;
}

type StatusFiltro = 'todos' | 'pendente' | 'aprovado' | 'rejeitado';

const VAZIO: Record<string, string> = {
  cnpj: '',
  nome_fantasia: '',
  razao_social: '',
  categoria: '',
  descricao: '',
  endereco: '',
  cidade: '',
  telefone_comercial: '',
  site_url: '',
  foto_url: '',
  logo_url: '',
  status: 'pendente',
  desconto: '',
};

const STATUS_INFO: Record<string, { label: string; badge: string }> = {
  pendente: { label: 'Pendente', badge: 'bg-amber-100 text-amber-700' },
  aprovado: { label: 'Aprovado', badge: 'bg-green-100 text-green-700' },
  rejeitado: { label: 'Rejeitado', badge: 'bg-red-100 text-red-700' },
};

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--color-primary)] placeholder:text-[var(--foreground-muted)]';
const labelClass = 'mb-1 block text-xs font-medium text-[var(--foreground-secondary)]';

export default function AdminParceiros() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Busca e filtros
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<StatusFiltro>('todos');

  // Modal de formulário (criar/editar)
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({ ...VAZIO });

  // Confirmação de exclusão
  const [deletando, setDeletando] = useState<Parceiro | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('parceiros')
      .select('*')
      .order('created_at', { ascending: false });
    setParceiros(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Estatísticas ──────────────────────────────
  const stats = {
    total: parceiros.length,
    aprovados: parceiros.filter((p) => p.status === 'aprovado').length,
    pendentes: parceiros.filter((p) => p.status === 'pendente').length,
  };

  // ── Lista filtrada ────────────────────────────
  const filtrados = parceiros.filter((p) => {
    if (filtro !== 'todos' && p.status !== filtro) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return (
        p.nome_fantasia?.toLowerCase().includes(q) ||
        p.razao_social?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Abrir formulário (novo / editar) ──────────
  const abrirNovo = () => {
    setForm({ ...VAZIO });
    setEditandoId(null);
    setShowForm(true);
  };

  const abrirEdicao = (p: Parceiro) => {
    setForm({
      cnpj: p.cnpj || '',
      nome_fantasia: p.nome_fantasia || '',
      razao_social: p.razao_social || '',
      categoria: p.categoria || '',
      descricao: p.descricao || '',
      endereco: p.endereco || '',
      cidade: p.cidade || '',
      telefone_comercial: p.telefone_comercial || '',
      site_url: p.site_url || '',
      foto_url: p.foto_url || '',
      logo_url: p.logo_url || '',
      status: p.status || 'pendente',
      desconto: p.desconto_percento ? String(p.desconto_percento) : '',
    });
    setEditandoId(p.id);
    setShowForm(true);
  };

  const fecharForm = () => {
    setShowForm(false);
    setEditandoId(null);
  };

  const set = (campo: string, valor: string) => setForm((f) => ({ ...f, [campo]: valor }));

  // ── Salvar (criar ou atualizar) ───────────────
  const salvar = async () => {
    if (!form.nome_fantasia.trim()) return;

    setSalvando(true);
    const payload: Record<string, unknown> = {
      cnpj: form.cnpj.trim() || null,
      nome_fantasia: form.nome_fantasia.trim(),
      razao_social: form.razao_social.trim() || null,
      categoria: form.categoria.trim() || null,
      descricao: form.descricao.trim() || null,
      endereco: form.endereco.trim() || null,
      cidade: form.cidade.trim() || null,
      telefone_comercial: form.telefone_comercial.trim() || null,
      site_url: form.site_url.trim() || null,
      foto_url: form.foto_url.trim() || null,
      logo_url: form.logo_url.trim() || null,
      status: form.status,
      desconto_percento: form.desconto ? Number(form.desconto) : null,
      updated_at: new Date().toISOString(),
    };

    if (editandoId) {
      await supabase.from('parceiros').update(payload).eq('id', editandoId);
    } else {
      await supabase.from('parceiros').insert(payload);
    }

    setSalvando(false);
    fecharForm();
    load();
  };

  // ── Status (aprovar / rejeitar) ───────────────
  const alterarStatus = async (id: string, status: string) => {
    await supabase
      .from('parceiros')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    load();
  };

  // ── Excluir ───────────────────────────────────
  const confirmarExclusao = async () => {
    if (!deletando) return;
    await supabase.from('parceiros').delete().eq('id', deletando.id);
    setDeletando(null);
    load();
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Parceiros</h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Gerencie os estabelecimentos parceiros cadastrados
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-light)]"
        >
          <Plus className="h-4 w-4" />
          Novo Parceiro
        </button>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFiltro('todos')}
          className={`rounded-2xl border p-4 text-center transition ${
            filtro === 'todos'
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
              : 'border-[var(--border)] bg-[var(--surface-elevated)]'
          }`}
        >
          <Store className="mx-auto mb-1 h-5 w-5 text-[var(--color-primary)]" />
          <p className="text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Total</p>
        </button>
        <button
          onClick={() => setFiltro('aprovado')}
          className={`rounded-2xl border p-4 text-center transition ${
            filtro === 'aprovado'
              ? 'border-green-400 bg-green-50'
              : 'border-[var(--border)] bg-[var(--surface-elevated)]'
          }`}
        >
          <CheckCircle className="mx-auto mb-1 h-5 w-5 text-green-600" />
          <p className="text-2xl font-bold text-green-700">{stats.aprovados}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Aprovados</p>
        </button>
        <button
          onClick={() => setFiltro('pendente')}
          className={`rounded-2xl border p-4 text-center transition ${
            filtro === 'pendente'
              ? 'border-amber-400 bg-amber-50'
              : 'border-[var(--border)] bg-[var(--surface-elevated)]'
          }`}
        >
          <Tag className="mx-auto mb-1 h-5 w-5 text-amber-600" />
          <p className="text-2xl font-bold text-amber-700">{stats.pendentes}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Pendentes</p>
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
        <input
          type="text"
          placeholder="Buscar por nome fantasia ou razão social..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className={`${inputClass} pl-10`}
        />
        {busca && (
          <button
            onClick={() => setBusca('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filtros por status */}
      <div className="flex flex-wrap gap-2">
        {(['todos', 'aprovado', 'pendente', 'rejeitado'] as StatusFiltro[]).map((s) => {
          const labels: Record<StatusFiltro, string> = {
            todos: 'Todos',
            aprovado: 'Aprovados',
            pendente: 'Pendentes',
            rejeitado: 'Rejeitados',
          };
          const ativo = filtro === s;
          return (
            <button
              key={s}
              onClick={() => setFiltro(s)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                ativo
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground-secondary)] hover:border-[var(--color-primary)]'
              }`}
            >
              {labels[s]}
            </button>
          );
        })}
      </div>

      {/* Lista / Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] py-12 text-center">
          <Store className="mx-auto mb-3 h-10 w-10 text-[var(--foreground-muted)]" />
          <p className="text-sm text-[var(--foreground-muted)]">
            {busca || filtro !== 'todos'
              ? 'Nenhum parceiro encontrado com esses filtros'
              : 'Nenhum parceiro cadastrado ainda'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((p) => {
            const info = STATUS_INFO[p.status] || STATUS_INFO.pendente;
            return (
              <div
                key={p.id}
                className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-sm transition hover:shadow-md"
              >
                {/* Topo: logo + nome + status */}
                <div className="flex items-start gap-3">
                  {p.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logo_url}
                      alt={p.nome_fantasia}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                      <Store className="h-7 w-7 text-[var(--color-primary)]" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[var(--foreground)]">
                      {p.nome_fantasia}
                    </p>
                    {p.categoria && (
                      <p className="truncate text-xs text-[var(--foreground-muted)]">
                        {p.categoria}
                      </p>
                    )}
                    {p.avaliacao_media ? (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--color-accent-dark)]">
                        <Star className="h-3 w-3 fill-current" />
                        {Number(p.avaliacao_media).toFixed(1)}
                        {p.total_avaliacoes ? ` (${p.total_avaliacoes})` : ''}
                      </p>
                    ) : null}
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${info.badge}`}
                  >
                    {info.label}
                  </span>
                </div>

                {/* Desconto */}
                {p.desconto_percento ? (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-bold text-[var(--color-accent-dark)]">
                      <Tag className="h-3 w-3" />
                      {p.desconto_percento}% OFF
                    </span>
                  </div>
                ) : null}

                {/* Detalhes */}
                {p.descricao && (
                  <p className="mt-3 line-clamp-2 text-xs text-[var(--foreground-secondary)]">
                    {p.descricao}
                  </p>
                )}

                <div className="mt-3 space-y-1 text-xs text-[var(--foreground-secondary)]">
                  {p.endereco && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 shrink-0 text-[var(--foreground-muted)]" />
                      <span className="truncate">
                        {p.endereco}
                        {p.cidade ? ` — ${p.cidade}` : ''}
                      </span>
                    </p>
                  )}
                  {p.telefone_comercial && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 shrink-0 text-[var(--foreground-muted)]" />
                      {p.telefone_comercial}
                    </p>
                  )}
                  {p.site_url && (
                    <p className="flex items-center gap-1.5">
                      <Globe className="h-3 w-3 shrink-0 text-[var(--foreground-muted)]" />
                      <a
                        href={p.site_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-[var(--color-primary)] hover:underline"
                      >
                        {p.site_url.replace(/^https?:\/\//, '')}
                      </a>
                    </p>
                  )}
                  {p.cnpj && (
                    <p className="flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 shrink-0 text-[var(--foreground-muted)]" />
                      CNPJ: {p.cnpj}
                    </p>
                  )}
                </div>

                {/* Ações */}
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {p.status !== 'aprovado' && (
                    <button
                      onClick={() => alterarStatus(p.id, 'aprovado')}
                      className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Aprovar
                    </button>
                  )}
                  {p.status !== 'rejeitado' && (
                    <button
                      onClick={() => alterarStatus(p.id, 'rejeitado')}
                      className="flex items-center gap-1 rounded-lg bg-[var(--color-accent2)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--color-accent2-dark)]"
                    >
                      <X className="h-3.5 w-3.5" />
                      Rejeitar
                    </button>
                  )}
                  <button
                    onClick={() => abrirEdicao(p)}
                    className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground-secondary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                  <button
                    onClick={() => setDeletando(p)}
                    className="flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-red-500 transition hover:border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════ MODAL: Formulário (Criar / Editar) ════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-xl">
            {/* Cabeçalho do modal */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="text-lg font-bold text-[var(--foreground)]">
                {editandoId ? 'Editar Parceiro' : 'Novo Parceiro'}
              </h2>
              <button
                onClick={fecharForm}
                className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo do formulário */}
            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nome Fantasia *</label>
                  <input
                    placeholder="Ex: Restaurante Sabor da Terra"
                    value={form.nome_fantasia}
                    onChange={(e) => set('nome_fantasia', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Razão Social</label>
                  <input
                    placeholder="Ex: Sabores da Terra Ltda."
                    value={form.razao_social}
                    onChange={(e) => set('razao_social', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>CNPJ</label>
                  <input
                    placeholder="00.000.000/0000-00"
                    value={form.cnpj}
                    onChange={(e) => set('cnpj', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Categoria</label>
                  <input
                    placeholder="Ex: restaurante, hotel, pousada..."
                    value={form.categoria}
                    onChange={(e) => set('categoria', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Desconto (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Ex: 10"
                    value={form.desconto}
                    onChange={(e) => set('desconto', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Cidade</label>
                  <input
                    placeholder="Ex: Santos"
                    value={form.cidade}
                    onChange={(e) => set('cidade', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Telefone Comercial</label>
                  <input
                    placeholder="(00) 0000-0000"
                    value={form.telefone_comercial}
                    onChange={(e) => set('telefone_comercial', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Endereço</label>
                  <input
                    placeholder="Rua, número, bairro..."
                    value={form.endereco}
                    onChange={(e) => set('endereco', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Site (URL)</label>
                  <input
                    placeholder="https://..."
                    value={form.site_url}
                    onChange={(e) => set('site_url', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>URL do Logo</label>
                  <input
                    placeholder="https://.../logo.png"
                    value={form.logo_url}
                    onChange={(e) => set('logo_url', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>URL da Foto</label>
                  <input
                    placeholder="https://.../foto.jpg"
                    value={form.foto_url}
                    onChange={(e) => set('foto_url', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => set('status', e.target.value)}
                    className={inputClass}
                  >
                    <option value="pendente">Pendente</option>
                    <option value="aprovado">Aprovado</option>
                    <option value="rejeitado">Rejeitado</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Descrição</label>
                  <textarea
                    rows={3}
                    placeholder="Descreva o estabelecimento e o benefício oferecido..."
                    value={form.descricao}
                    onChange={(e) => set('descricao', e.target.value)}
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* Rodapé do modal */}
            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
              <button
                onClick={fecharForm}
                className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] transition hover:bg-[var(--surface)]"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || !form.nome_fantasia.trim()}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-primary-light)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {salvando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {editandoId ? 'Salvar Alterações' : 'Criar Parceiro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════ MODAL: Confirmação de Exclusão ════════ */}
      {deletando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-6 shadow-xl">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-7 w-7 text-red-600" />
              </div>
            </div>
            <h3 className="text-center text-lg font-bold text-[var(--foreground)]">
              Excluir Parceiro
            </h3>
            <p className="mt-2 text-center text-sm text-[var(--foreground-muted)]">
              Tem certeza que deseja excluir{' '}
              <span className="font-semibold text-[var(--foreground)]">
                {deletando.nome_fantasia}
              </span>
              ? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeletando(null)}
                className="flex-1 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground-secondary)] transition hover:bg-[var(--surface)]"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusao}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
