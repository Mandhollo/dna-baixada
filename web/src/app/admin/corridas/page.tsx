'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Car, Filter, Search, Eye, X } from 'lucide-react';

const TIPO_LABELS: Record<string, string> = {
  urbana: 'Urbana', executivo: 'Executivo',
  eletrico_hibrido: 'Elétrico/Híbrido',
  transfer_aeroporto: 'Transfer Aeroporto', transfer_rodoviaria: 'Transfer Rodoviária',
  transfer_hotel: 'Transfer Hotel', transfer_cruzeiro: 'Transfer Cruzeiro',
  city_tour: 'City Tour', passeio_turistico: 'Passeio Turístico',
};

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  aguardando: { label: 'Aguardando', color: 'bg-amber-100 text-amber-700' },
  aceita: { label: 'Aceita', color: 'bg-blue-100 text-blue-700' },
  motorista_chegou: { label: 'Chegou', color: 'bg-indigo-100 text-indigo-700' },
  em_andamento: { label: 'Em Andamento', color: 'bg-purple-100 text-purple-700' },
  finalizada: { label: 'Finalizada', color: 'bg-green-100 text-green-700' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
};

interface Corrida {
  id: string;
  tipo: string;
  status: string;
  origem_endereco: string;
  destino_endereco: string | null;
  preco_estimado: number | null;
  preco_final: number | null;
  passageiros: number;
  forma_pagamento: string | null;
  created_at: string;
  passageiro_id: string;
  motorista_id: string | null;
}

export default function AdminCorridas() {
  const [corridas, setCorridas] = useState<Corrida[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [busca, setBusca] = useState('');
  const [corridaSelecionada, setCorridaSelecionada] = useState<Corrida | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const cancelarCorrida = async (id: string) => {
    setCancelando(true);
    const { error } = await supabase.from('corridas').update({ status: 'cancelada' }).eq('id', id);
    if (!error) {
      setCorridas(prev => prev.map(c => c.id === id ? { ...c, status: 'cancelada' } : c));
      setCorridaSelecionada(null);
    }
    setCancelando(false);
  };

  const loadCorridas = useCallback(async () => {
    let q = supabase.from('corridas').select('*').order('created_at', { ascending: false });
    if (filtroStatus !== 'todas') q = q.eq('status', filtroStatus);
    const { data } = await q.limit(100);
    setCorridas(data || []);
    setLoading(false);
  }, [filtroStatus]);

  useEffect(() => { loadCorridas(); }, [loadCorridas]);

  const filtradas = busca
    ? corridas.filter(c =>
        c.origem_endereco?.toLowerCase().includes(busca.toLowerCase()) ||
        c.destino_endereco?.toLowerCase().includes(busca.toLowerCase()) ||
        TIPO_LABELS[c.tipo]?.toLowerCase().includes(busca.toLowerCase()))
    : corridas;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Corridas</h1>
        <p className="text-sm text-[var(--foreground-muted)]">Gerencie todas as corridas da plataforma</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <input
            type="text"
            placeholder="Buscar por endereço, tipo..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--color-primary)]"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[var(--foreground-muted)]" />
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
          >
            <option value="todas">Todos os status</option>
            <option value="aguardando">Aguardando</option>
            <option value="aceita">Aceita</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="finalizada">Finalizada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] py-12 text-center">
          <Car className="mx-auto mb-3 h-10 w-10 text-[var(--foreground-muted)]" />
          <p className="text-sm text-[var(--foreground-muted)]">Nenhuma corrida encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtradas.map((c) => {
            const si = STATUS_INFO[c.status] || { label: c.status, color: 'bg-gray-100 text-gray-700' };
            return (
              <button
                key={c.id}
                onClick={() => setCorridaSelecionada(c)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-left transition hover:border-[var(--color-primary)]/30 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                    <Car className="h-5 w-5 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{TIPO_LABELS[c.tipo] || c.tipo}</p>
                    <p className="text-xs text-[var(--foreground-muted)] truncate max-w-[200px] sm:max-w-md">
                      {c.origem_endereco}
                      {c.destino_endereco ? ` → ${c.destino_endereco}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      R$ {Number(c.preco_final || c.preco_estimado || 0).toFixed(0)}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${si.color}`}>{si.label}</span>
                  <Eye className="h-4 w-4 text-[var(--foreground-muted)]" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal de detalhes */}
      {corridaSelecionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setCorridaSelecionada(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[var(--surface-elevated)] p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Detalhes da Corrida</h2>
              <button onClick={() => setCorridaSelecionada(null)} className="rounded-lg p-1 hover:bg-[var(--surface)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Tipo', value: TIPO_LABELS[corridaSelecionada.tipo] || corridaSelecionada.tipo },
                { label: 'Status', value: STATUS_INFO[corridaSelecionada.status]?.label || corridaSelecionada.status },
                { label: 'Origem', value: corridaSelecionada.origem_endereco },
                { label: 'Destino', value: corridaSelecionada.destino_endereco || '—' },
                { label: 'Passageiros', value: String(corridaSelecionada.passageiros) },
                { label: 'Preço Estimado', value: `R$ ${Number(corridaSelecionada.preco_estimado || 0).toFixed(2)}` },
                { label: 'Preço Final', value: corridaSelecionada.preco_final ? `R$ ${Number(corridaSelecionada.preco_final).toFixed(2)}` : '—' },
                { label: 'Pagamento', value: corridaSelecionada.forma_pagamento || '—' },
                { label: 'Data', value: new Date(corridaSelecionada.created_at).toLocaleString('pt-BR') },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b border-[var(--border-light)] py-2">
                  <span className="text-sm text-[var(--foreground-muted)]">{label}</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">{value}</span>
                </div>
              ))}
            </div>
            {/* Botão cancelar corrida */}
            {!['finalizada', 'cancelada'].includes(corridaSelecionada.status) && (
              <button
                onClick={() => cancelarCorrida(corridaSelecionada.id)}
                disabled={cancelando}
                className="mt-4 w-full rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {cancelando ? 'Cancelando…' : 'Cancelar Corrida'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}