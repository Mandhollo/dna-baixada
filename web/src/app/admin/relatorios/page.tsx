'use client';

import { BarChart3, DollarSign, Car, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminRelatorios() {
  const [corridas, setCorridas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('corridas').select('*');
      setCorridas(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
      </div>
    );
  }

  const finalizadas = corridas.filter(c => c.status === 'finalizada');
  const faturamento = finalizadas.reduce((sum, c) => sum + Number(c.preco_final || c.preco_estimado || 0), 0);
  const ticketMedio = finalizadas.length > 0 ? faturamento / finalizadas.length : 0;

  // Agrupar por tipo
  const porTipo: Record<string, { total: number; faturamento: number }> = {};
  corridas.forEach(c => {
    if (!porTipo[c.tipo]) porTipo[c.tipo] = { total: 0, faturamento: 0 };
    porTipo[c.tipo].total++;
    if (c.status === 'finalizada') {
      porTipo[c.tipo].faturamento += Number(c.preco_final || c.preco_estimado || 0);
    }
  });

  // Agrupar por dia (últimos 7)
  const hoje = new Date();
  const ultimos7: { data: string; count: number; valor: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const dataStr = d.toISOString().split('T')[0];
    const doDia = corridas.filter(c => c.created_at?.split('T')[0] === dataStr);
    ultimos7.push({
      data: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
      count: doDia.length,
      valor: doDia.filter(c => c.status === 'finalizada').reduce((s, c) => s + Number(c.preco_final || c.preco_estimado || 0), 0),
    });
  }
  const maxCount = Math.max(...ultimos7.map(d => d.count), 1);

  const TIPO_LABELS: Record<string, string> = {
    urbana: 'Urbana', executivo: 'Executivo', transfer_aeroporto: 'Transfer Aeroporto',
    city_tour: 'City Tour', passeio_turistico: 'Passeio', transfer_hotel: 'Transfer Hotel',
    transfer_cruzeiro: 'Transfer Cruzeiro', transfer_rodoviaria: 'Transfer Rodov.',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Relatórios</h1>
        <p className="text-sm text-[var(--foreground-muted)]">Análise de desempenho da plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Car, label: 'Total de Corridas', value: corridas.length, color: 'bg-[var(--color-primary)]' },
          { icon: CheckCircle, label: 'Finalizadas', value: finalizadas.length, color: 'bg-[var(--color-secondary)]' },
          { icon: DollarSign, label: 'Faturamento', value: `R$ ${faturamento.toFixed(0)}`, color: 'bg-[var(--color-accent)]' },
          { icon: TrendingUp, label: 'Ticket Médio', value: `R$ ${ticketMedio.toFixed(0)}`, color: 'bg-[var(--color-accent2)]' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <p className="mt-4 text-2xl font-bold text-[var(--foreground)]">{value}</p>
            <p className="text-sm text-[var(--foreground-muted)]">{label}</p>
          </div>
        ))}
      </div>

      {/* Gráfico de barras — últimos 7 dias */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">Corridas por Dia (7 dias)</h2>
        <div className="flex items-end justify-between gap-2" style={{ height: 160 }}>
          {ultimos7.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div className="text-xs font-semibold text-[var(--foreground)]">{d.count}</div>
              <div className="w-full rounded-t-lg bg-[var(--color-primary)] transition-all" style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? '8px' : '2px' }} />
              <div className="text-xs text-[var(--foreground-muted)]">{d.data}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Por tipo */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-[var(--foreground)]">Corridas por Tipo</h2>
        <div className="space-y-2">
          {Object.entries(porTipo).sort((a, b) => b[1].total - a[1].total).map(([tipo, data]) => {
            const pct = corridas.length > 0 ? (data.total / corridas.length) * 100 : 0;
            return (
              <div key={tipo}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-[var(--foreground)]">{TIPO_LABELS[tipo] || tipo}</span>
                  <span className="text-[var(--foreground-muted)]">{data.total} corridas · R$ {data.faturamento.toFixed(0)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                  <div className="h-full rounded-full bg-[var(--color-secondary)]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
