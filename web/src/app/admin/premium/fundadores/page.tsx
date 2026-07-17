'use client';

import PageTitle from '@/components/seo/PageTitle';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Crown,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MotoristaFundador } from '@/lib/supabase';

/* ─── Toast local (sem dependência externa) ─── */
type ToastKind = 'success' | 'error';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);
  const success = useCallback((m: string) => push('success', m), [push]);
  const error = useCallback((m: string) => push('error', m), [push]);
  return { toasts, success, error };
}

/* ─── Validação UUID v4 ─── */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function AdminFundadoresPage() {
  const [fundadores, setFundadores] = useState<MotoristaFundador[]>([]);
  const [loading, setLoading] = useState(true);

  /* modal */
  const [modalOpen, setModalOpen] = useState(false);
  const [motoristaId, setMotoristaId] = useState('');
  const [numeroFundador, setNumeroFundador] = useState<number | ''>('');
  const [reconhecimento, setReconhecimento] = useState(true);
  const [salvando, setSalvando] = useState(false);

  /* ação em andamento (row id) */
  const [busyId, setBusyId] = useState<string | null>(null);

  const { toasts, success, error } = useToasts();

  /* ── Carregar fundadores da view ── */
  const carregar = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('vw_motoristas_fundadores')
        .select('*')
        .order('numero_fundador', { ascending: true });
      if (err) throw err;
      setFundadores((data as MotoristaFundador[]) ?? []);
    } catch {
      // fallback lista vazia
      setFundadores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const { data, error: err } = await supabase
          .from('vw_motoristas_fundadores')
          .select('*')
          .order('numero_fundador', { ascending: true });
        if (err) throw err;
        if (active) setFundadores((data as MotoristaFundador[]) ?? []);
      } catch {
        if (active) setFundadores([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  /* ── Próximo número (derivado, sem effect) ── */
  const proximoNumero = useMemo(() => {
    if (fundadores.length === 0) return 1;
    return fundadores.reduce(
      (acc, f) =>
        typeof f.numero_fundador === 'number' && f.numero_fundador > acc ? f.numero_fundador : acc,
      0,
    ) + 1;
  }, [fundadores]);

  /* ── Sincronizar input quando modal abre (evento, não effect) ── */
  const abrirModal = () => {
    setNumeroFundador(proximoNumero);
    setModalOpen(true);
  };

  /* ── Criar fundador ── */
  const criarFundador = async () => {
    const num = typeof numeroFundador === 'number' ? numeroFundador : Number(numeroFundador);
    if (!motoristaId.trim()) {
      error('Informe o ID do motorista.');
      return;
    }
    if (!UUID_RE.test(motoristaId.trim())) {
      error('ID do motorista inválido (esperado UUID).');
      return;
    }
    if (!Number.isFinite(num) || num < 1) {
      error('Número do fundador inválido.');
      return;
    }

    setSalvando(true);
    try {
      const { error: err } = await supabase
        .from('motoristas_fundadores')
        .insert({
          motorista_id: motoristaId.trim(),
          numero_fundador: num,
          reconhecimento_publico: reconhecimento,
          selo_ativo: true,
        });

      if (err) throw err;

      success(`Fundador #${num} criado com sucesso!`);
      setModalOpen(false);
      setMotoristaId('');
      setReconhecimento(true);
      // recarrega para trazer dados do join (nome, cidade, etc.)
      await carregar();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao criar fundador.';
      error(msg);
    } finally {
      setSalvando(false);
    }
  };

  /* ── Toggle selo ── */
  const toggleSelo = async (f: MotoristaFundador) => {
    setBusyId(f.id);
    try {
      const { error: err } = await supabase
        .from('motoristas_fundadores')
        .update({ selo_ativo: !f.selo_ativo })
        .eq('id', f.id);
      if (err) throw err;

      setFundadores((prev) => prev.map((x) => (x.id === f.id ? { ...x, selo_ativo: !f.selo_ativo } : x)));
      success(`Selo ${!f.selo_ativo ? 'ativado' : 'desativado'} para #${f.numero_fundador}.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao atualizar selo.';
      error(msg);
    } finally {
      setBusyId(null);
    }
  };

  /* ── Remover fundador ── */
  const removerFundador = async (f: MotoristaFundador) => {
    const confirmar = window.confirm(
      `Remover o fundador #${f.numero_fundador} (${f.nome || 'sem nome'})?\nEsta ação não pode ser desfeita.`,
    );
    if (!confirmar) return;

    setBusyId(f.id);
    try {
      const { error: err } = await supabase.from('motoristas_fundadores').delete().eq('id', f.id);
      if (err) throw err;

      setFundadores((prev) => prev.filter((x) => x.id !== f.id));
      success(`Fundador #${f.numero_fundador} removido.`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Falha ao remover fundador.';
      error(msg);
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageTitle title="Admin — Motoristas Fundadores" />
      <Link
        href="/admin/premium"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para Premium
      </Link>

      {/* ─── Header ─── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500" /> Motoristas Fundadores
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie o selo permanente e o reconhecimento dos pioneiros da DNA.
          </p>
        </div>
        <button
          onClick={abrirModal}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-bold hover:bg-primary-dark transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Adicionar Fundador
        </button>
      </div>

      {/* ─── Conteúdo ─── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : fundadores.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum fundador cadastrado ainda.</p>
          <p className="text-xs text-gray-400 mt-1">Clique em “Adicionar Fundador” para começar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nº</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Cidade</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Veículo</th>
                  <th className="text-center px-4 py-3 font-semibold text-gray-600">Selo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Ingresso</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {fundadores.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-white text-xs font-bold">
                        {f.numero_fundador}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-primary">
                      {f.nome || (
                        <span className="text-gray-400 font-normal">Sem nome</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{f.cidade_base || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{f.veiculo_modelo || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleSelo(f)}
                        disabled={busyId === f.id}
                        title={f.selo_ativo ? 'Selo ativo — clique para desativar' : 'Selo inativo — clique para ativar'}
                        className="disabled:opacity-50"
                      >
                        {f.selo_ativo ? (
                          <ToggleRight className="w-7 h-7 text-secondary inline" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-gray-300 inline" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(f.data_ingresso)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleSelo(f)}
                          disabled={busyId === f.id}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            f.selo_ativo
                              ? 'bg-secondary/10 text-secondary hover:bg-secondary/20'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          } disabled:opacity-50`}
                        >
                          {f.selo_ativo ? 'Ativo' : 'Inativo'}
                        </button>
                        <button
                          onClick={() => removerFundador(f)}
                          disabled={busyId === f.id}
                          title="Remover fundador"
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {busyId === f.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Modal: Adicionar Fundador ─── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => !salvando && setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-primary">Adicionar Fundador</h2>
                </div>
                <button
                  onClick={() => !salvando && setModalOpen(false)}
                  disabled={salvando}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* body */}
              <div className="px-6 py-5 space-y-4">
                {/* motorista_id */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    ID do Motorista <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={motoristaId}
                    onChange={(e) => setMotoristaId(e.target.value)}
                    placeholder="00000000-0000-0000-0000-000000000000"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    disabled={salvando}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">UUID do motorista (encontrado no perfil).</p>
                </div>

                {/* numero_fundador */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Número do Fundador
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={numeroFundador}
                    onChange={(e) =>
                      setNumeroFundador(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    disabled={salvando}
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Auto-preenchido com o próximo número disponível ({numeroFundador || '—'}).
                  </p>
                </div>

                {/* reconhecimento_publico */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={reconhecimento}
                    onClick={() => setReconhecimento((v) => !v)}
                    disabled={salvando}
                    className={`mt-0.5 relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      reconhecimento ? 'bg-secondary' : 'bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        reconhecimento ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <div>
                    <span className="text-sm font-semibold text-gray-700">
                      Reconhecimento público
                    </span>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Exibir o nome do fundador publicamente na galeria.
                    </p>
                  </div>
                </label>
              </div>

              {/* footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => setModalOpen(false)}
                  disabled={salvando}
                  className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={criarFundador}
                  disabled={salvando || !motoristaId.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {salvando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Criando…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Criar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Toasts ─── */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`pointer-events-auto flex items-start gap-2 rounded-xl shadow-lg px-4 py-3 text-sm font-medium max-w-sm ${
                t.kind === 'success'
                  ? 'bg-white border border-green-100 text-green-700'
                  : 'bg-white border border-red-100 text-red-700'
              }`}
            >
              {t.kind === 'success' ? (
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
              )}
              <span className="flex-1">{t.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
