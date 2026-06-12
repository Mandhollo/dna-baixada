'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserCheck, Car, CheckCircle, XCircle, Phone, Star } from 'lucide-react';

interface Motorista {
  id: string;
  cnh_numero: string;
  veiculo_modelo: string;
  veiculo_placa: string;
  veiculo_cor: string | null;
  veiculo_ano: number | null;
  veiculo_lugares: number;
  status: string;
  cidade_base: string;
  disponivel: boolean;
  total_corridas: number;
  ganho_total: number;
  created_at: string;
  profile?: {
    nome: string;
    email: string;
    telefone: string | null;
    avaliacao_media: number | null;
  };
}

export default function AdminMotoristas() {
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('motoristas')
      .select('*, profile:profiles!motoristas_id_fkey(nome, email, telefone, avaliacao_media)')
      .order('created_at', { ascending: false });
    setMotoristas(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('motoristas').update({ status }).eq('id', id);
    load();
  };

  const filtrados = motoristas.filter(m => {
    if (filtro === 'todos') return true;
    return m.status === filtro;
  });

  const counts = {
    pendentes: motoristas.filter(m => m.status === 'pendente').length,
    aprovados: motoristas.filter(m => m.status === 'aprovado').length,
    rejeitados: motoristas.filter(m => m.status === 'rejeitado').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Motoristas</h1>
        <p className="text-sm text-[var(--foreground-muted)]">Aprove e gerencie os motoristas cadastrados</p>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setFiltro('todos')}
          className={`rounded-xl border p-3 text-center transition ${filtro === 'todos' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--border)] bg-[var(--surface-elevated)]'}`}
        >
          <p className="text-xl font-bold text-[var(--foreground)]">{motoristas.length}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Total</p>
        </button>
        <button
          onClick={() => setFiltro('pendente')}
          className={`rounded-xl border p-3 text-center transition ${filtro === 'pendente' ? 'border-amber-400 bg-amber-50' : 'border-[var(--border)] bg-[var(--surface-elevated)]'}`}
        >
          <p className="text-xl font-bold text-amber-700">{counts.pendentes}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Pendentes</p>
        </button>
        <button
          onClick={() => setFiltro('aprovado')}
          className={`rounded-xl border p-3 text-center transition ${filtro === 'aprovado' ? 'border-green-400 bg-green-50' : 'border-[var(--border)] bg-[var(--surface-elevated)]'}`}
        >
          <p className="text-xl font-bold text-green-700">{counts.aprovados}</p>
          <p className="text-xs text-[var(--foreground-muted)]">Aprovados</p>
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] py-12 text-center">
          <UserCheck className="mx-auto mb-3 h-10 w-10 text-[var(--foreground-muted)]" />
          <p className="text-sm text-[var(--foreground-muted)]">Nenhum motorista nesta categoria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((m) => (
            <div key={m.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                {/* Info do motorista */}
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]/10">
                    <Car className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{m.profile?.nome || 'Sem nome'}</p>
                    <p className="text-xs text-[var(--foreground-muted)]">{m.profile?.email}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      {m.profile?.telefone && (
                        <span className="flex items-center gap-1 text-[var(--foreground-secondary)]">
                          <Phone className="h-3 w-3" /> {m.profile.telefone}
                        </span>
                      )}
                      {m.profile?.avaliacao_media && (
                        <span className="flex items-center gap-1 text-[var(--color-accent)]">
                          <Star className="h-3 w-3 fill-current" /> {Number(m.profile.avaliacao_media).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  m.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                  m.status === 'pendente' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {m.status}
                </span>
              </div>

              {/* Info do veículo */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
                  <p className="text-[var(--foreground-muted)]">Veículo</p>
                  <p className="font-medium text-[var(--foreground)]">{m.veiculo_modelo}</p>
                </div>
                <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
                  <p className="text-[var(--foreground-muted)]">Placa</p>
                  <p className="font-medium text-[var(--foreground)]">{m.veiculo_placa}</p>
                </div>
                <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
                  <p className="text-[var(--foreground-muted)]">Lugares</p>
                  <p className="font-medium text-[var(--foreground)]">{m.veiculo_lugares}</p>
                </div>
                <div className="rounded-lg bg-[var(--surface)] px-3 py-2">
                  <p className="text-[var(--foreground-muted)]">Corridas</p>
                  <p className="font-medium text-[var(--foreground)]">{m.total_corridas}</p>
                </div>
              </div>

              {/* Ações */}
              {m.status === 'pendente' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => updateStatus(m.id, 'aprovado')}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" /> Aprovar
                  </button>
                  <button
                    onClick={() => updateStatus(m.id, 'rejeitado')}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-xs font-medium text-white transition hover:bg-red-600"
                  >
                    <XCircle className="h-4 w-4" /> Rejeitar
                  </button>
                </div>
              )}
              {m.status === 'aprovado' && (
                <button
                  onClick={() => updateStatus(m.id, 'rejeitado')}
                  className="mt-3 flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" /> Suspender
                </button>
              )}
              {m.status === 'rejeitado' && (
                <button
                  onClick={() => updateStatus(m.id, 'aprovado')}
                  className="mt-3 flex items-center gap-1.5 rounded-lg border border-green-200 px-4 py-2 text-xs font-medium text-green-600 transition hover:bg-green-50"
                >
                  <CheckCircle className="h-4 w-4" /> Reativar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
