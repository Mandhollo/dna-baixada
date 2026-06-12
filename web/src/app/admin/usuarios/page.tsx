'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users, Search, Shield, UserCheck, Car, Mail, Phone, Calendar,
  X, Save, CheckCircle, AlertCircle, Loader2,
} from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  role: string;
  foto_url: string | null;
  created_at: string;
}

const ROLE_INFO: Record<string, { label: string; color: string }> = {
  admin: { label: 'Admin', color: 'bg-red-100 text-red-700' },
  motorista: { label: 'Motorista', color: 'bg-blue-100 text-blue-700' },
  passageiro: { label: 'Passageiro', color: 'bg-green-100 text-green-700' },
  parceiro: { label: 'Parceiro', color: 'bg-purple-100 text-purple-700' },
};

const ROLE_OPTIONS = [
  { value: 'passageiro', label: 'Passageiro' },
  { value: 'motorista', label: 'Motorista' },
  { value: 'admin', label: 'Admin' },
  { value: 'parceiro', label: 'Parceiro' },
];

type Toast = { type: 'success' | 'error'; message: string } | null;

function StatCard({
  icon: Icon, label, value, color,
}: {
  icon: React.ElementType; label: string; value: number; color: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="mt-3 text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="text-sm text-[var(--foreground-muted)]">{label}</p>
    </div>
  );
}

function Avatar({ usuario, size = 'md' }: { usuario: Usuario; size?: 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm';
  if (usuario.foto_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={usuario.foto_url}
        alt={usuario.nome || 'Usuário'}
        className={`${dims} rounded-full object-cover`}
      />
    );
  }
  return (
    <div className={`${dims} flex items-center justify-center rounded-full bg-[var(--color-primary)]/10 font-bold text-[var(--color-primary)]`}>
      {(usuario.nome || '?')[0]?.toUpperCase()}
    </div>
  );
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState('todos');
  const [selecionado, setSelecionado] = useState<Usuario | null>(null);
  const [novaRole, setNovaRole] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  useEffect(() => {
    let active = true;
    async function carregar() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!active) return;
      if (error) {
        setToast({ type: 'error', message: 'Erro ao carregar usuários.' });
      }
      setUsuarios((data || []) as Usuario[]);
      setLoading(false);
    }
    carregar();
    return () => { active = false; };
  }, []);

  // Auto-dismiss inline toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Close modal on Escape
  useEffect(() => {
    if (!selecionado) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelecionado(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selecionado]);

  const stats = {
    total: usuarios.length,
    motoristas: usuarios.filter(u => u.role === 'motorista').length,
    passageiros: usuarios.filter(u => u.role === 'passageiro').length,
    admins: usuarios.filter(u => u.role === 'admin').length,
  };

  const filtrados = usuarios.filter(u => {
    if (filtroRole !== 'todos' && u.role !== filtroRole) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return u.nome?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  function abrir(u: Usuario) {
    setSelecionado(u);
    setNovaRole(u.role);
  }

  async function salvar() {
    if (!selecionado) return;
    if (novaRole === selecionado.role) {
      setSelecionado(null);
      return;
    }
    setSalvando(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: novaRole })
      .eq('id', selecionado.id);
    setSalvando(false);
    if (error) {
      setToast({ type: 'error', message: `Erro ao atualizar: ${error.message}` });
      return;
    }
    const userId = selecionado.id;
    const role = novaRole;
    setUsuarios(prev => prev.map(u => (u.id === userId ? { ...u, role } : u)));
    setSelecionado(prev => (prev ? { ...prev, role } : null));
    setToast({ type: 'success', message: 'Perfil atualizado com sucesso!' });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Usuários</h1>
        <p className="text-sm text-[var(--foreground-muted)]">Gerencie todos os usuários da plataforma</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total de Usuários" value={stats.total} color="bg-[var(--color-primary)]" />
        <StatCard icon={Car} label="Motoristas" value={stats.motoristas} color="bg-[var(--color-secondary)]" />
        <StatCard icon={UserCheck} label="Passageiros" value={stats.passageiros} color="bg-[var(--color-accent)]" />
        <StatCard icon={Shield} label="Administradores" value={stats.admins} color="bg-[var(--color-accent2)]" />
      </div>

      {/* Filtros */}
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

      {/* Lista */}
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
              <button
                key={u.id}
                onClick={() => abrir(u)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-left transition hover:border-[var(--color-primary)]/30 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Avatar usuario={u} />
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
              </button>
            );
          })}
        </div>
      )}

      {/* Modal de detalhes / edição */}
      {selecionado && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelecionado(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[var(--surface-elevated)] p-6 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Detalhes do Usuário</h2>
              <button onClick={() => setSelecionado(null)} className="rounded-lg p-1 hover:bg-[var(--surface)]">
                <X className="h-5 w-5 text-[var(--foreground-muted)]" />
              </button>
            </div>

            {/* Identificação */}
            <div className="mb-5 flex items-center gap-4">
              <Avatar usuario={selecionado} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-[var(--foreground)]">
                  {selecionado.nome || 'Sem nome'}
                </p>
                {(() => {
                  const ri = ROLE_INFO[selecionado.role] || { label: selecionado.role, color: 'bg-gray-100 text-gray-700' };
                  return (
                    <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${ri.color}`}>
                      {ri.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Dados */}
            <div className="space-y-1">
              {[
                { icon: Mail, label: 'Email', value: selecionado.email },
                { icon: Phone, label: 'Telefone', value: selecionado.telefone || '—' },
                { icon: Calendar, label: 'Cadastrado em', value: new Date(selecionado.created_at).toLocaleString('pt-BR') },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between border-b border-[var(--border-light)] py-2.5">
                  <span className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                    <Icon className="h-4 w-4" /> {label}
                  </span>
                  <span className="ml-4 truncate text-right text-sm font-medium text-[var(--foreground)]">{value}</span>
                </div>
              ))}
            </div>

            {/* Editar role */}
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">Tipo de usuário</label>
              <select
                value={novaRole}
                onChange={e => setNovaRole(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
              >
                {ROLE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Ações */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelecionado(null)}
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface)]"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {salvando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast inline */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-[var(--color-secondary)] text-white'
                : 'bg-[var(--color-accent2)] text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
