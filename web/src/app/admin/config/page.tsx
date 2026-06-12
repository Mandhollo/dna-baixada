'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Save, DollarSign, TrendingUp, Info, ExternalLink, AlertCircle } from 'lucide-react';

interface TaxaConfig {
  id: string;
  tipo_corrida: string;
  taxa_percentual: number;
  taxa_fixa: number;
  ativo: boolean;
}

const TIPO_LABELS: Record<string, string> = {
  urbana: 'Urbana',
  executivo: 'Executivo',
  transfer_aeroporto: 'Transfer Aeroporto',
  transfer_rodoviaria: 'Transfer Rodoviária',
  transfer_hotel: 'Transfer Hotel',
  transfer_cruzeiro: 'Transfer Cruzeiro',
  city_tour: 'City Tour',
  passeio_turistico: 'Passeio Turístico',
};

export default function AdminConfig() {
  const [taxas, setTaxas] = useState<TaxaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [novasTaxas, setNovasTaxas] = useState<TaxaConfig[]>([]);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('config_taxas')
      .select('*')
      .order('tipo_corrida');
    if (error) {
      setErro('Erro ao carregar: ' + error.message);
    } else {
      setTaxas(data || []);
      setNovasTaxas(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const salvarTaxa = async (taxa: TaxaConfig) => {
    setSalvando(true);
    setErro(null);
    const { error } = await supabase
      .from('config_taxas')
      .update({
        taxa_percentual: taxa.taxa_percentual,
        taxa_fixa: taxa.taxa_fixa,
        ativo: taxa.ativo,
      })
      .eq('id', taxa.id);
    if (error) {
      setErro('Erro ao salvar taxa: ' + error.message);
    } else {
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
    }
    setSalvando(false);
  };

  const salvarTodas = async () => {
    setSalvando(true);
    setErro(null);
    let errors = 0;
    for (const taxa of novasTaxas) {
      const { error } = await supabase
        .from('config_taxas')
        .update({
          taxa_percentual: taxa.taxa_percentual,
          taxa_fixa: taxa.taxa_fixa,
          ativo: taxa.ativo,
        })
        .eq('id', taxa.id);
      if (error) errors++;
    }
    if (errors > 0) {
      setErro(`${errors} taxa(s) falharam ao salvar`);
    } else {
      setSucesso(true);
      setTimeout(() => setSucesso(false), 3000);
      setTaxas([...novasTaxas]);
    }
    setSalvando(false);
  };

  const updateTaxa = (id: string, field: string, value: any) => {
    setNovasTaxas(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const hasChanges = JSON.stringify(novasTaxas) !== JSON.stringify(taxas);

  return (
    <div className="space-y-6">
      {/* Toast */}
      {sucesso && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-green-500 px-6 py-3 text-sm font-medium text-white shadow-lg">
          ✓ Configurações salvas com sucesso!
        </div>
      )}
      {erro && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-red-500 px-6 py-3 text-sm font-medium text-white shadow-lg">
          {erro}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Configurações</h1>
          <p className="text-sm text-[var(--foreground-muted)]">Gerencie taxas e integrações da plataforma</p>
        </div>
        {hasChanges && (
          <button
            onClick={salvarTodas}
            disabled={salvando}
            className="flex items-center gap-1.5 rounded-xl bg-[var(--color-secondary)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {salvando ? 'Salvando…' : 'Salvar Tudo'}
          </button>
        )}
      </div>

      {/* ── Taxas por tipo de corrida ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Taxas por Tipo de Corrida</h2>
        </div>
        <p className="mb-4 text-xs text-[var(--foreground-muted)]">
          Configure a comissão da plataforma (percentual + taxa fixa) para cada tipo de corrida.
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)]" />
          </div>
        ) : novasTaxas.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto mb-2 h-8 w-8 text-[var(--foreground-muted)]" />
            <p className="text-sm text-[var(--foreground-muted)]">
              Nenhuma taxa configurada. Execute o SQL inicial de config_taxas.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {novasTaxas.map((taxa) => (
              <div
                key={taxa.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--surface)] p-3"
              >
                <div className="flex-1 min-w-[140px]">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {TIPO_LABELS[taxa.tipo_corrida] || taxa.tipo_corrida}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      value={taxa.taxa_percentual}
                      onChange={e => updateTaxa(taxa.id, 'taxa_percentual', Number(e.target.value))}
                      className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                    <span className="text-sm text-[var(--foreground-muted)]">%</span>
                  </div>
                  <span className="text-xs text-[var(--foreground-muted)]">+</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-[var(--foreground-muted)]">R$</span>
                    <input
                      type="number"
                      step="0.5"
                      value={taxa.taxa_fixa}
                      onChange={e => updateTaxa(taxa.id, 'taxa_fixa', Number(e.target.value))}
                      className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
                <button
                  onClick={() => updateTaxa(taxa.id, 'ativo', !taxa.ativo)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    taxa.ativo
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {taxa.ativo ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Mercado Pago ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-[var(--color-secondary)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Pagamentos — Mercado Pago</h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-light)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Access Token</p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
                    ? '✓ Configurado'
                    : '⚠ Não configurado'}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${
                process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ? 'Ativo' : 'Pendente'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-light)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">Webhook</p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {process.env.MERCADOPAGO_WEBHOOK_SECRET
                    ? '✓ Assinatura verificada'
                    : '⚠ Sem verificação de assinatura'}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs ${
                process.env.MERCADOPAGO_WEBHOOK_SECRET
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {process.env.MERCADOPAGO_WEBHOOK_SECRET ? 'Seguro' : 'Dev mode'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-[var(--color-accent)]/5 p-3">
          <div className="flex gap-2">
            <Info className="h-4 w-4 flex-shrink-0 text-[var(--color-accent-dark)] mt-0.5" />
            <div className="text-xs text-[var(--foreground-secondary)]">
              <p className="font-medium">Para ativar pagamentos reais:</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                <li>Crie uma conta no <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener" className="text-[var(--color-primary)] underline inline-flex items-center gap-0.5">Mercado Pago Developers <ExternalLink className="h-3 w-3" /></a></li>
                <li>Gere o Access Token e Public Key nas credenciais</li>
                <li>Configure as env vars no Vercel:
                  <code className="block mt-1 rounded bg-[var(--surface)] px-2 py-1 text-[10px]">
                    MERCADOPAGO_ACCESS_TOKEN<br/>
                    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY<br/>
                    MERCADOPAGO_WEBHOOK_SECRET
                  </code>
                </li>
                <li>Configure o webhook URL: <code className="rounded bg-[var(--surface)] px-1">https://dna-baixada.vercel.app/api/pagamento/webhook</code></li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* ── Estatísticas do Sistema ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-[var(--color-accent-dark)]" />
          <h2 className="text-lg font-bold text-[var(--foreground)]">Status do Sistema</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Site Passageiros', value: 'Online', ok: true },
            { label: 'App Motorista', value: 'Online', ok: true },
            { label: 'Banco Supabase', value: 'Ativo', ok: true },
            { label: 'PIX Produção', value: 'Pendente', ok: false },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-3 ${
                item.ok
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <p className="text-xs text-[var(--foreground-muted)]">{item.label}</p>
              <p className={`text-sm font-semibold ${
                item.ok ? 'text-green-700' : 'text-amber-700'
              }`}>
                {item.ok ? '✓' : '⚠'} {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
