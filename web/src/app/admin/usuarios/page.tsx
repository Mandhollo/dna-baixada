'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Search } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: string;
  created_at: string;
}

const ROLE_INFO: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
  motorista: { label: 'Motorista', color: 'bg-blue-100 text-blue-700' },
  passageiro: { label: 'Passageiro', color: 'bg-green-100 text-green-700' },
  parceiro: { label: 'Parceiro', color: 'bg-purple-100 text-purple-700' },
};

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState('todos');

  const load = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsuarios(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtrados = usuarios.filter(u => {
    if (filtroRole !== 'todos' && u.role !== filtroRole) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return u.nome?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Usuários</h1>
        <p className="text-sm text-[var(--foreground-muted)]">{usuarios.length} usuários cadastrados</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <select
          value={filtroRole}
          onChange={e => setFiltroRole(e.target.value)}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
        >
          <option value="todos">Todos os tipos</option>
          <option value="passageiro">Passageiros</option>
          <option value="motorista">Motoristas</option>
          <option value="parceiro">Parceiros</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] py-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-[var(--foreground-muted)]" />
          <p className="text-sm text-[var(--foreground-muted)]">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((u) => {
            const ri = ROLE_INFO[u.role] || { label: u.role, color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={u.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-bold text-[var(--color-primary)]">
                    {(u.nome || '?')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{u.nome || 'Sem nome'}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-xs text-[var(--foreground-muted)] sm:block">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${ri.color}`}>{ri.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
