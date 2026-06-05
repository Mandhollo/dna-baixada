'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings,
  Save,
  Percent,
  Loader2,
  CheckCircle2,
  XCircle,
  Car,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase, CORRIDA_TIPOS } from '@/lib/supabase';
import type { ConfigTaxa } from '@/lib/supabase';

/* ─── animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

/* ════════════════════════════════════════════════════════════ */
/*  Page Component                                            */
/* ════════════════════════════════════════════════════════════ */
export default function AdminConfigPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [taxas, setTaxas] = useState<ConfigTaxa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editValor, setEditValor] = useState<string>('');
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);
  const [msgErro, setMsgErro] = useState<string | null>(null);

  /* ── Auth guard ── */
  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.role !== 'admin') {
      router.replace('/entrar');
    }
  }, [user, profile, authLoading, router]);

  /* ── Fetch taxas ── */
  const fetchTaxas = useCallback(async () => {
    if (!user || profile?.role !== 'admin') return;
    setCarregando(true);
    const { data, error } = await supabase
      .from('config_taxas')
      .select('*')
      .order('tipo_corrida', { ascending: true });

    if (!error && data) {
      setTaxas(data as ConfigTaxa[]);
    }
    setCarregando(false);
  }, [user, profile]);

  useEffect(() => {
    fetchTaxas();
  }, [fetchTaxas]);

  /* ── Inline edit ── */
  function iniciarEdicao(taxa: ConfigTaxa) {
    setEditandoId(taxa.id);
    setEditValor(String(taxa.taxa_percentual));
    setMsgSucesso(null);
    setMsgErro(null);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditValor('');
    setMsgSucesso(null);
    setMsgErro(null);
  }

  async function salvarEdicao(id: string) {
    const valor = parseFloat(editValor);
    if (isNaN(valor) || valor < 0 || valor > 100) {
      setMsgErro('Valor inválido. Insira um percentual entre 0 e 100.');
      return;
    }

    setSalvando(true);
    setMsgSucesso(null);
    setMsgErro(null);

    const { error } = await supabase
      .from('config_taxas')
      .update({ taxa_percentual: valor, updated_at: new Date().toISOString() })
      .eq('id', id);

    setSalvando(false);

    if (error) {
      setMsgErro('Erro ao salvar: ' + error.message);
      return;
    }

    setTaxas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, taxa_percentual: valor } : t))
    );
    setMsgSucesso('Taxa atualizada com sucesso!');
    setEditandoId(null);
    setEditValor('');

    setTimeout(() => setMsgSucesso(null), 3000);
  }

  /* ── Get label for tipo_corrida ── */
  function getTipoLabel(tipo: string) {
    const found = CORRIDA_TIPOS.find((t) => t.value === tipo);
    return found ? found.label : tipo;
  }

  /* ── Loading / auth ── */
  if (authLoading || !profile) {
    return <LoadingSkeleton />;
  }

  if (profile.role !== 'admin') return null;

  return (
    <div className="space-y-8">
      {/* ═══ Header ═══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl flex items-center gap-3">
            <Settings className="h-7 w-7 text-primary" />
            Configuração de Preços e Taxas
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Configure as taxas percentuais cobradas pela plataforma para cada tipo de serviço
          </p>
        </div>
      </motion.div>

      {/* ═══ Toast messages ═══ */}
      {msgSucesso && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 p-3 text-sm font-semibold text-secondary"
        >
          <CheckCircle2 size={18} />
          {msgSucesso}
        </motion.div>
      )}
      {msgErro && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-accent2/20 bg-accent2/5 p-3 text-sm font-semibold text-accent2"
        >
          <XCircle size={18} />
          {msgErro}
        </motion.div>
      )}

      {/* ═══ Taxas list ═══ */}
      {carregando ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-elevated" />
          ))}
        </div>
      ) : taxas.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface-elevated p-8 text-center shadow-sm">
          <Settings size={40} className="mx-auto text-foreground-muted/40" />
          <p className="mt-3 font-semibold text-foreground-secondary">
            Nenhuma configuração encontrada
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            Adicione configurações de taxa pelo banco de dados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {taxas.map((taxa, i) => (
            <motion.div
              key={taxa.id}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={i + 1}
              className={`rounded-2xl border bg-surface-elevated p-4 shadow-sm transition hover:shadow-md ${
                editandoId === taxa.id ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: info */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/5">
                    <Car size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{getTipoLabel(taxa.tipo_corrida)}</p>
                    <p className="text-xs text-foreground-muted">
                      {taxa.ativo ? (
                        <span className="flex items-center gap-1 text-secondary">
                          <CheckCircle2 size={11} /> Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-foreground-muted">
                          <XCircle size={11} /> Inativo
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: taxa value / edit */}
                <div className="flex items-center gap-2">
                  {editandoId === taxa.id ? (
                    <>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={editValor}
                          onChange={(e) => setEditValor(e.target.value)}
                          className="w-24 rounded-xl border border-primary/30 bg-background px-3 py-2 text-right text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarEdicao(taxa.id);
                            if (e.key === 'Escape') cancelarEdicao();
                          }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-muted">%</span>
                      </div>
                      <button
                        onClick={() => salvarEdicao(taxa.id)}
                        disabled={salvando}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-white transition hover:bg-secondary/90 disabled:opacity-50"
                        aria-label="Salvar"
                      >
                        {salvando ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                      </button>
                      <button
                        onClick={cancelarEdicao}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-background-tertiary text-foreground-muted transition hover:text-foreground"
                        aria-label="Cancelar"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => iniciarEdicao(taxa)}
                      className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 transition hover:border-primary/30 hover:bg-primary/5"
                    >
                      <Percent size={14} className="text-primary" />
                      <span className="text-lg font-extrabold text-primary">
                        {taxa.taxa_percentual}%
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════ */
/*  Skeleton                                                  */
/* ════════════════════════════════════════════════════════════ */
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-72 rounded-xl animate-pulse bg-surface-elevated" />
        <div className="h-4 w-56 rounded-lg animate-pulse bg-surface-elevated" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface-elevated" />
        ))}
      </div>
    </div>
  );
}
