'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Users, Car, DollarSign, TrendingUp, Clock, CheckCircle,
  UserCheck, Star, AlertCircle,
} from 'lucide-react';

interface Stats {
  total_usuarios: number;
  total_passageiros: number;
  total_motoristas: number;
  total_corridas: number;
  corridas_aguardando: number;
  corridas_andamento: number;
  corridas_finalizadas: number;
  faturamento_total: number;
  motoristas_disponiveis: number;
}

interface CorridaRecente {
  id: string;
  tipo: string;
  status: string;
  preco_estimado: number | null;
  created_at: string;
  passageiro_id: string;
}

const TIPO_LABELS: Record<string, string> = {
  urbana: 'Urbana',
  executivo: 'Executivo',
  eletrico_hibrido: 'Elétrico/Híbrido',
  transfer_aeroporto: 'Transfer Aeroporto',
  transfer_rodoviaria: 'Transfer Rodoviária',
  transfer_hotel: 'Transfer Hotel',
  transfer_cruzeiro: 'Transfer Cruzeiro',
  city_tour: 'City Tour',
  passeio_turistico: 'Passeio Turístico',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  aguardando: { label: 'Aguardando', color: 'bg-amber-100 text-amber-700' },
  aceita: { label: 'Aceita', color: 'bg-blue-100 text-blue-700' },
  motorista_chegou: { label: 'Motorista Chegou', color: 'bg-indigo-100 text-indigo-700' },
  em_andamento: { label: 'Em Andamento', color: 'bg-purple-100 text-purple-700' },
  finalizada: { label: 'Finalizada', color: 'bg-green-100 text-green-700' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
};

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm hover-lift">
      <div className="flex items-center justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-bold text-[var(--foreground)]">{value}</p>
      <p className="text-sm text-[var(--foreground-muted)]">{label}</p>
      {sub && <p className="mt-1 text-xs text-[var(--foreground-secondary)]">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentes, setRecentes] = useState<CorridaRecente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Load stats
      const [profilesRes, passRes, motRes, corridasRes, motDispRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'passageiro'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'motorista'),
        supabase.from('corridas').select('*'),
        supabase.from('motoristas').select('*', { count: 'exact', head: true }).eq('disponivel', true),
      ]);

      const allCorridas = corridasRes.data || [];
      const finalizadas = allCorridas.filter(c => c.status === 'finalizada');
      const faturamento = finalizadas.reduce((sum, c) => sum + Number(c.preco_final || c.preco_estimado || 0), 0);

      setStats({
        total_usuarios: profilesRes.count ?? 0,
        total_passageiros: passRes.count ?? 0,
        total_motoristas: motRes.count ?? 0,
        total_corridas: allCorridas.length,
        corridas_aguardando: allCorridas.filter(c => c.status === 'aguardando').length,
        corridas_andamento: allCorridas.filter(c => ['aceita', 'motorista_chegou', 'em_andamento'].includes(c.status)).length,
        corridas_finalizadas: finalizadas.length,
        faturamento_total: faturamento,
        motoristas_disponiveis: motDispRes.count ?? 0,
      });

      setRecentes(allCorridas.slice(0, 8));
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h1>
        <p className="text-sm text-[var(--foreground-muted)]">Visão geral da plataforma DNA Baixada</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} label="Total de Usuários" value={stats?.total_usuarios ?? 0}
          sub={`${stats?.total_passageiros ?? 0} passageiros · ${stats?.total_motoristas ?? 0} motoristas`}
          color="bg-[var(--color-primary)]" />
        <StatCard icon={Car} label="Total de Corridas" value={stats?.total_corridas ?? 0}
          sub={`${stats?.corridas_finalizadas ?? 0} finalizadas`}
          color="bg-[var(--color-secondary)]" />
        <StatCard icon={DollarSign} label="Faturamento Total" value={`R$ ${(stats?.faturamento_total ?? 0).toFixed(0)}`}
          sub="Corridas finalizadas"
          color="bg-[var(--color-accent)]" />
        <StatCard icon={UserCheck} label="Motoristas Online" value={stats?.motoristas_disponiveis ?? 0}
          sub="Disponíveis agora"
          color="bg-[var(--color-accent2)]" />
      </div>

      {/* Status das Corridas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">Aguardando</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-800">{stats?.corridas_aguardando ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-blue-50 p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Em Andamento</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-800">{stats?.corridas_andamento ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Finalizadas</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-green-800">{stats?.corridas_finalizadas ?? 0}</p>
        </div>
      </div>

      {/* Corridas Recentes */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">Corridas Recentes</h2>
        {recentes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="mb-2 h-8 w-8 text-[var(--foreground-muted)]" />
            <p className="text-sm text-[var(--foreground-muted)]">Nenhuma corrida ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentes.map((c) => {
              const statusInfo = STATUS_LABELS[c.status] || { label: c.status, color: 'bg-gray-100 text-gray-700' };
              return (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-[var(--border-light)] px-4 py-3 transition hover:bg-[var(--surface)]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
                      <Car className="h-5 w-5 text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--foreground)]">{TIPO_LABELS[c.tipo] || c.tipo}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {new Date(c.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.preco_estimado && (
                      <span className="text-sm font-semibold text-[var(--foreground)]">R$ {Number(c.preco_estimado).toFixed(0)}</span>
                    )}
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
