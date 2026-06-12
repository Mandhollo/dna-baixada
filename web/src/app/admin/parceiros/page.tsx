'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, Plus, X } from 'lucide-react';

export default function AdminParceiros() {
  const [parceiros, setParceiros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome_fantasia: '', categoria: '', endereco: '', telefone: '', desconto: '' });

  const load = useCallback(async () => {
    const { data } = await supabase.from('parceiros').select('*').order('created_at', { ascending: false });
    setParceiros(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const criar = async () => {
    if (!form.nome_fantasia) return;
    await supabase.from('parceiros').insert({
      nome_fantasia: form.nome_fantasia,
      categoria: form.categoria || null,
      endereco: form.endereco || null,
      telefone: form.telefone || null,
      desconto_percento: form.desconto ? Number(form.desconto) : null,
    });
    setForm({ nome_fantasia: '', categoria: '', endereco: '', telefone: '', desconto: '' });
    setShowForm(false);
    load();
  };

  const remover = async (id: string) => {
    if (!confirm('Remover este parceiro?')) return;
    await supabase.from('parceiros').delete().eq('id', id);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Parceiros</h1>
          <p className="text-sm text-[var(--foreground-muted)]">{parceiros.length} estabelecimentos cadastrados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition hover:bg-[var(--color-primary-light)]">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Fechar' : 'Novo Parceiro'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input placeholder="Nome do estabelecimento *" value={form.nome_fantasia} onChange={e => setForm({ ...form, nome_fantasia: e.target.value })}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]" />
            <input placeholder="Categoria (restaurante, hotel...)" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]" />
            <input placeholder="Endereço" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]" />
            <input placeholder="Telefone" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]" />
            <input placeholder="Desconto (%) — ex: 10" value={form.desconto} onChange={e => setForm({ ...form, desconto: e.target.value })}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]" />
          </div>
          <button onClick={criar} className="mt-3 rounded-xl bg-[var(--color-secondary)] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[var(--color-secondary-dark)]">
            Salvar Parceiro
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
        </div>
      ) : parceiros.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] py-12 text-center">
          <Store className="mx-auto mb-3 h-10 w-10 text-[var(--foreground-muted)]" />
          <p className="text-sm text-[var(--foreground-muted)]">Nenhum parceiro cadastrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {parceiros.map((p) => (
            <div key={p.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{p.nome_fantasia}</p>
                  {p.categoria && <p className="text-xs text-[var(--foreground-muted)]">{p.categoria}</p>}
                </div>
                {p.desconto_percento && (
                  <span className="rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-bold text-[var(--color-accent-dark)]">
                    {p.desconto_percento}% OFF
                  </span>
                )}
              </div>
              {p.endereco && <p className="mt-2 text-xs text-[var(--foreground-secondary)]">{p.endereco}</p>}
              {p.telefone && <p className="text-xs text-[var(--foreground-secondary)]">📞 {p.telefone}</p>}
              <button onClick={() => remover(p.id)} className="mt-2 text-xs text-red-500 hover:text-red-700">Remover</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
