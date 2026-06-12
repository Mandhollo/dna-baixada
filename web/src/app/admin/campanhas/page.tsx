'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Megaphone, Plus, X, Tag, Calendar, Percent, Trash2, Power } from 'lucide-react';

interface Cupom {
  id: string;
  codigo: string;
  descricao: string;
  tipo_desconto: string;
  valor_desconto: number;
  usos_maximo: number;
  usos_contabilizados: number;
  valor_minimo_corrida: number | null;
  ativo: boolean;
  valido_de: string;
  valido_ate: string | null;
  created_at: string;
}

const TIPO_LABELS: Record<string, { label: string; color: string }> = {
  percentual: { label: 'Percentual', color: 'bg-blue-100 text-blue-700' },
  fixo: { label: 'Valor Fixo', color: 'bg-purple-100 text-purple-700' },
};

export default function AdminCampanhas() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [form, setForm] = useState({
    codigo: '',
    descricao: '',
    tipo_desconto: 'percentual',
    valor_desconto: '',
    usos_maximo: '100',
    valor_minimo_corrida: '',
    valido_de: new Date().toISOString().slice(0, 10),
    valido_ate: '',
  });

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('cupons')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setErro('Erro ao carregar cupons: ' + error.message);
    } else {
      setCupons(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({
      codigo: '', descricao: '', tipo_desconto: 'percentual',
      valor_desconto: '', usos_maximo: '100',
      valor_minimo_corrida: '',
      valido_de: new Date().toISOString().slice(0, 10),
      valido_ate: '',
    });
    setEditandoId(null);
    setShowForm(false);
  };

  const editar = (c: Cupom) => {
    setForm({
      codigo: c.codigo,
      descricao: c.descricao,
      tipo_desconto: c.tipo_desconto,
      valor_desconto: String(c.valor_desconto),
      usos_maximo: String(c.usos_maximo),
      valor_minimo_corrida: c.valor_minimo_corrida ? String(c.valor_minimo_corrida) : '',
      valido_de: c.valido_de ? new Date(c.valido_de).toISOString().slice(0, 10) : '',
      valido_ate: c.valido_ate ? new Date(c.valido_ate).toISOString().slice(0, 10) : '',
    });
    setEditandoId(c.id);
    setShowForm(true);
  };

  const salvar = async () => {
    if (!form.codigo || !form.descricao || !form.valor_desconto) {
      setErro('Preencha código, descrição e valor do desconto');
      return;
    }
    setSalvando(true);
    setErro(null);

    const payload = {
      codigo: form.codigo.toUpperCase().trim(),
      descricao: form.descricao,
      tipo_desconto: form.tipo_desconto,
      valor_desconto: Number(form.valor_desconto),
      usos_maximo: Number(form.usos_maximo || 100),
      usos_contabilizados: 0,
      valor_minimo_corrida: form.valor_minimo_corrida ? Number(form.valor_minimo_corrida) : null,
      ativo: true,
      valido_de: new Date(form.valido_de).toISOString(),
      valido_ate: form.valido_ate ? new Date(form.valido_ate + 'T23:59:59').toISOString() : null,
    };

    let result;
    if (editandoId) {
      result = await supabase.from('cupons').update(payload).eq('id', editandoId);
    } else {
      result = await supabase.from('cupons').insert(payload);
    }

    if (result.error) {
      setErro('Erro ao salvar: ' + result.error.message);
    } else {
      setSucesso(editandoId ? 'Cupom atualizado!' : 'Cupom criado!');
      setTimeout(() => setSucesso(null), 3000);
      resetForm();
      load();
    }
    setSalvando(false);
  };

  const toggleAtivo = async (c: Cupom) => {
    const { error } = await supabase
      .from('cupons')
      .update({ ativo: !c.ativo })
      .eq('id', c.id);
    if (!error) load();
  };

  const remover = async (id: string) => {
    if (!confirm('Excluir este cupom permanentemente?')) return;
    const { error } = await supabase.from('cupons').delete().eq('id', id);
    if (!error) load();
  };

  const cuponsAtivos = cupons.filter(c => c.ativo).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {sucesso && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-green-500 px-6 py-3 text-sm font-medium text-white shadow-lg">
          {sucesso}
        </div>
      )}
      {erro && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-lg">
          {erro}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Campanhas & Cupons</h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            {cupons.length} cupons • {cuponsAtivos} ativos
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-light)]"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Fechar' : 'Novo Cupom'}
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">Código *</label>
              <input
                placeholder="EX: VERAO10"
                value={form.codigo}
                onChange={e => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm uppercase outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">Tipo de Desconto</label>
              <select
                value={form.tipo_desconto}
                onChange={e => setForm({ ...form, tipo_desconto: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              >
                <option value="percentual">Percentual (%)</option>
                <option value="fixo">Valor Fixo (R$)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">Descrição *</label>
              <input
                placeholder="Descrição do cupom"
                value={form.descricao}
                onChange={e => setForm({ ...form, descricao: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">
                Valor do Desconto * {form.tipo_desconto === 'percentual' ? '(%)' : '(R$)'}
              </label>
              <input
                type="number"
                placeholder="10"
                value={form.valor_desconto}
                onChange={e => setForm({ ...form, valor_desconto: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">Usos Máximos</label>
              <input
                type="number"
                placeholder="100"
                value={form.usos_maximo}
                onChange={e => setForm({ ...form, usos_maximo: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">Pedido Mínimo (R$)</label>
              <input
                type="number"
                placeholder="Opcional"
                value={form.valor_minimo_corrida}
                onChange={e => setForm({ ...form, valor_minimo_corrida: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">Válido De</label>
              <input
                type="date"
                value={form.valido_de}
                onChange={e => setForm({ ...form, valido_de: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--foreground-muted)]">Válido Até</label>
              <input
                type="date"
                value={form.valido_ate}
                onChange={e => setForm({ ...form, valido_ate: e.target.value })}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={salvar}
              disabled={salvando}
              className="rounded-xl bg-[var(--color-secondary)] px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {salvando ? 'Salvando…' : editandoId ? 'Atualizar Cupom' : 'Criar Cupom'}
            </button>
            {editandoId && (
              <button
                onClick={resetForm}
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground-muted)] transition hover:bg-[var(--surface)]"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
        </div>
      ) : cupons.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] py-12 text-center">
          <Megaphone className="mx-auto mb-3 h-10 w-10 text-[var(--foreground-muted)]" />
          <p className="text-sm text-[var(--foreground-muted)]">Nenhum cupom criado ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cupons.map((c) => {
            const ti = TIPO_LABELS[c.tipo_desconto] || { label: c.tipo_desconto, color: 'bg-gray-100 text-gray-700' };
            const usoPct = c.usos_maximo > 0 ? Math.round((c.usos_contabilizados / c.usos_maximo) * 100) : 0;
            return (
              <div
                key={c.id}
                className={`rounded-2xl border p-4 shadow-sm transition ${
                  c.ativo
                    ? 'border-[var(--color-primary)]/20 bg-[var(--surface-elevated)]'
                    : 'border-[var(--border)] bg-[var(--surface-elevated)] opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
                      <Tag className="h-5 w-5 text-[var(--color-accent-dark)]" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold text-[var(--foreground)]">{c.codigo}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ti.color}`}>
                        {ti.label}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      c.ativo
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <p className="mt-2 text-xs text-[var(--foreground-secondary)] line-clamp-2">{c.descricao}</p>

                <div className="mt-3 flex items-center gap-4 text-xs text-[var(--foreground-muted)]">
                  <span className="font-semibold text-[var(--color-accent-dark)]">
                    {c.tipo_desconto === 'percentual' ? `${c.valor_desconto}%` : `R$ ${c.valor_desconto}`}
                  </span>
                  <span>
                    {c.usos_contabilizados}/{c.usos_maximo} usos
                  </span>
                </div>

                {/* Barra de uso */}
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-secondary)]"
                    style={{ width: `${Math.min(usoPct, 100)}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center gap-2 text-[10px] text-[var(--foreground-muted)]">
                  <Calendar className="h-3 w-3" />
                  {new Date(c.valido_de).toLocaleDateString('pt-BR')}
                  {c.valido_ate && ` → ${new Date(c.valido_ate).toLocaleDateString('pt-BR')}`}
                </div>

                {/* Ações */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => editar(c)}
                    className="flex-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground-secondary)] transition hover:bg-[var(--surface)]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleAtivo(c)}
                    className={`rounded-lg p-1.5 transition ${
                      c.ativo
                        ? 'text-amber-600 hover:bg-amber-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                    title={c.ativo ? 'Desativar' : 'Ativar'}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remover(c.id)}
                    className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
