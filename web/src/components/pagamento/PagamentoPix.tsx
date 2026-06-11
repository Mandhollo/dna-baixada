'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Banknote,
  CreditCard,
  Copy,
  Check,
  Loader2,
  CircleCheck,
  Clock,
  Wallet,
  Lock,
} from 'lucide-react';
import { supabase, formatarBRL } from '@/lib/supabase';
import type { FormaPagamento } from '@/lib/supabase';
import { QRCodeSVG } from 'qrcode.react';

// ════════════════════════════════════════════════════════════
// Props
// ════════════════════════════════════════════════════════════

interface PagamentoPixProps {
  valor: number;
  corridaId: string;
  onPagamentoConfirmado: () => void;
  onPular: () => void;
}

// ════════════════════════════════════════════════════════════
// Animation variants
// ════════════════════════════════════════════════════════════

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// ════════════════════════════════════════════════════════════
// Tab config
// ════════════════════════════════════════════════════════════

type TabPagamento = 'pix' | 'dinheiro' | 'cartao';

const TABS: { value: TabPagamento; label: string; icon: React.ReactNode }[] = [
  { value: 'pix', label: 'Pix', icon: <QrCode className="h-4 w-4" /> },
  { value: 'dinheiro', label: 'Dinheiro', icon: <Banknote className="h-4 w-4" /> },
  { value: 'cartao', label: 'Cartao', icon: <CreditCard className="h-4 w-4" /> },
];

// ════════════════════════════════════════════════════════════
// API response types
// ════════════════════════════════════════════════════════════

interface PixPaymentData {
  qr_code: string | null;
  copy_paste: string;
  payment_id: number;
  transacao_id: string;
  amount: number;
}

// ════════════════════════════════════════════════════════════
// Component
// ════════════════════════════════════════════════════════════

export default function PagamentoPix({
  valor,
  corridaId,
  onPagamentoConfirmado,
  onPular,
}: PagamentoPixProps) {
  const [activeTab, setActiveTab] = useState<TabPagamento>('pix');
  const [copied, setCopied] = useState(false);
  const [pagamentoStatus, setPagamentoStatus] = useState<
    'carregando' | 'aguardando' | 'verificando' | 'confirmado' | 'falhou'
  >('aguardando');
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [troco, setTroco] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Cleanup polling on unmount ──
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // ── Copiar codigo Pix ──
  const handleCopy = useCallback(async () => {
    const code = pixData?.copy_paste ?? '';
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [pixData]);

  // ── Polling: check payment status ──
  const iniciarPolling = useCallback(
    (paymentId: number) => {
      setPagamentoStatus('verificando');

      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      let attempts = 0;
      const MAX_ATTEMPTS = 120; // 10 minutos com intervalo de 5s

      pollingRef.current = setInterval(async () => {
        attempts++;

        if (attempts > MAX_ATTEMPTS) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPagamentoStatus('falhou');
          setError('Tempo esgotado. Tente novamente.');
          return;
        }

        try {
          const res = await fetch(`/api/pagamento/status/${paymentId}`);
          if (!res.ok) return;

          const data = await res.json();

          if (data.status === 'approved') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            setPagamentoStatus('confirmado');
            setTimeout(() => {
              onPagamentoConfirmado();
            }, 1800);
          }
        } catch {
          // Silently retry on network error
        }
      }, 5000);
    },
    [onPagamentoConfirmado]
  );

  // ── Criar pagamento PIX via API ──
  const handleConfirmarPix = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado.');
        setLoading(false);
        return;
      }

      // Fetch user profile for CPF and nome
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, telefone')
        .eq('id', user.id)
        .maybeSingle();

      const res = await fetch('/api/pagamento/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          corrida_id: corridaId,
          email: user.email,
          cpf: user.user_metadata?.cpf ?? '00000000000',
          nome: profile?.nome ?? undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Erro ao criar pagamento');
        setLoading(false);
        return;
      }

      setPixData(data);

      // Start polling for payment confirmation
      iniciarPolling(data.payment_id);
    } catch {
      setError('Erro ao conectar com o gateway de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  // ── Confirmar pagamento em dinheiro ──
  const handleConfirmarDinheiro = async () => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('Usuário não autenticado.');
        setLoading(false);
        return;
      }

      const { data, error: insertError } = await supabase
        .from('transacoes')
        .insert({
          corrida_id: corridaId,
          usuario_id: user.id,
          tipo: 'pagamento_corrida',
          status: 'pendente',
          valor_bruto: valor,
          taxa_plataforma: 0,
          valor_liquido: valor,
          forma_pagamento: 'dinheiro',
          descricao: `Pagamento corrida ${corridaId.substring(0, 8)} (dinheiro)`,
        })
        .select('id')
        .single();

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      setPagamentoStatus('confirmado');
      setTimeout(() => {
        onPagamentoConfirmado();
      }, 1500);
    } catch {
      setError('Erro ao criar transação.');
    } finally {
      setLoading(false);
    }
  };

  // ── Pular pagamento (pagar em dinheiro direto) ──
  const handlePular = () => {
    onPular();
  };

  // ════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════

  // QR code content: use real copy_paste string or fallback
  const qrCodeValue = pixData?.copy_paste ?? '';
  // If MP returns a base64 image, we use it; otherwise we render QRCodeSVG from the copy_paste string
  const hasBase64Qr = pixData?.qr_code && pixData.qr_code.length > 100;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <h2 className="text-xl font-bold text-foreground">Pagamento</h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Escolha como pagar a corrida
        </p>
      </motion.div>

      {/* ── Valor card ── */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.1 }}
        className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-center text-white shadow-lg"
      >
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <Wallet className="h-5 w-5" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
          Valor a pagar
        </p>
        <p className="mt-1 text-3xl font-extrabold">{formatarBRL(valor)}</p>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <div className="flex rounded-xl border border-border bg-surface-elevated p-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-foreground-muted hover:text-foreground-secondary'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'pix' && (
          <motion.div
            key="tab-pix"
            {...scaleIn}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {pagamentoStatus === 'aguardando' && !pixData && (
              <>
                {/* Botao gerar QR Code */}
                <div className="flex flex-col items-center rounded-2xl border border-border bg-surface-elevated p-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                    <QrCode className="h-8 w-8 text-secondary" />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-sm font-semibold text-foreground-secondary">
                      Pagamento via PIX
                    </p>
                    <p className="mt-1 text-xs text-foreground-muted">
                      Clique abaixo para gerar o QR Code
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConfirmarPix}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Gerando QR Code...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      Gerar QR Code Pix
                    </>
                  )}
                </button>
              </>
            )}

            {pagamentoStatus === 'aguardando' && pixData && (
              <>
                {/* QR Code */}
                <div className="flex flex-col items-center rounded-2xl border border-border bg-surface-elevated p-6">
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    {hasBase64Qr ? (
                      <img
                        src={`data:image/png;base64,${pixData.qr_code!}`}
                        alt="QR Code PIX"
                        width={200}
                        height={200}
                      />
                    ) : (
                      <QRCodeSVG
                        value={qrCodeValue}
                        size={200}
                        level="M"
                        bgColor="#FFFFFF"
                        fgColor="#1a1a2e"
                        includeMargin={false}
                      />
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-secondary" />
                    <p className="text-xs font-medium text-foreground-muted">
                      Escaneie o QR Code para pagar com Pix
                    </p>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-lg font-bold text-secondary">
                      {formatarBRL(valor)}
                    </p>
                  </div>
                </div>

                {/* Botao copiar */}
                <button
                  onClick={handleCopy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm font-semibold text-foreground-secondary transition hover:bg-background-tertiary"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-secondary" />
                      Código copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Código Pix
                    </>
                  )}
                </button>

                {/* Botao confirmar manualmente (fallback) */}
                <button
                  onClick={() => iniciarPolling(pixData.payment_id)}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Preparando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Já fiz o pagamento Pix
                    </>
                  )}
                </button>
              </>
            )}

            {pagamentoStatus === 'verificando' && (
              <motion.div
                {...fadeUp}
                className="flex flex-col items-center gap-4 rounded-2xl border border-secondary/20 bg-secondary/5 p-8"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                  <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-foreground">
                    Verificando pagamento
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Aguardando confirmação do PIX...
                  </p>
                </div>
              </motion.div>
            )}

            {pagamentoStatus === 'confirmado' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="flex flex-col items-center gap-4 rounded-2xl border border-secondary/30 bg-secondary/5 p-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary"
                >
                  <CircleCheck className="h-8 w-8 text-white" />
                </motion.div>
                <div className="text-center">
                  <p className="text-base font-bold text-secondary">
                    Pagamento confirmado!
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Redirecionando...
                  </p>
                </div>
              </motion.div>
            )}

            {pagamentoStatus === 'falhou' && (
              <motion.div
                {...fadeUp}
                className="flex flex-col items-center gap-4 rounded-2xl border border-accent2/20 bg-accent2/5 p-8"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent2/10">
                  <Clock className="h-8 w-8 text-accent2" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-accent2">
                    Pagamento não detectado
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Tente novamente ou escolha outra forma de pagamento
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPixData(null);
                    setPagamentoStatus('aguardando');
                    setError(null);
                  }}
                  className="rounded-xl border border-border bg-surface-elevated px-5 py-2.5 text-sm font-semibold text-foreground-secondary transition hover:bg-background-tertiary"
                >
                  Tentar novamente
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'dinheiro' && (
          <motion.div
            key="tab-dinheiro"
            {...scaleIn}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            {pagamentoStatus === 'aguardando' || pagamentoStatus === 'carregando' ? (
              <>
                <div className="rounded-2xl border border-border bg-surface-elevated p-5">
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground-secondary">
                    <Banknote className="h-4 w-4 text-secondary" />
                    Precisa de troco?
                  </label>
                  <input
                    type="number"
                    value={troco}
                    onChange={(e) => setTroco(e.target.value)}
                    placeholder="Ex: 50,00 (deixe vazio se não precisa)"
                    className="w-full rounded-xl border border-border bg-background-secondary px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted/50 transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none"
                  />
                  {troco && Number(troco) > valor && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 text-sm text-foreground-muted"
                    >
                      Troco:{' '}
                      <span className="font-bold text-secondary">
                        {formatarBRL(Number(troco) - valor)}
                      </span>
                    </motion.p>
                  )}
                </div>

                <p className="text-center text-xs text-foreground-muted">
                  O pagamento será feito diretamente ao motorista
                </p>

                <button
                  onClick={handleConfirmarDinheiro}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirmar pagamento em dinheiro
                    </>
                  )}
                </button>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="flex flex-col items-center gap-4 rounded-2xl border border-secondary/30 bg-secondary/5 p-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary"
                >
                  <CircleCheck className="h-8 w-8 text-white" />
                </motion.div>
                <div className="text-center">
                  <p className="text-base font-bold text-secondary">
                    Registrado com sucesso!
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Pague ao motorista em dinheiro
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'cartao' && (
          <motion.div
            key="tab-cartao"
            {...scaleIn}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface-elevated p-8"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
              <Lock className="h-8 w-8 text-primary/30" />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-foreground">
                Em breve
              </p>
              <p className="mt-1 text-sm text-foreground-muted">
                Pagamento com cartão de crédito estará disponível em breve
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 rounded-xl border border-accent2/20 bg-accent2/5 px-4 py-3 text-sm text-accent2"
          >
            <span className="font-semibold">Erro:</span> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Skip option ── */}
      {pagamentoStatus === 'aguardando' && (
        <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="text-center">
          <button
            onClick={handlePular}
            className="text-sm text-foreground-muted underline decoration-foreground-muted/30 transition hover:text-foreground-secondary hover:decoration-foreground-secondary"
          >
            Pagar depois em dinheiro
          </button>
        </motion.div>
      )}
    </div>
  );
}
