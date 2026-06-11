'use client';

import { useState, useEffect, useCallback } from 'react';
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
// PIX EMV payload generator
// ════════════════════════════════════════════════════════════

const PIX_KEY = 'dna.baixada@pagamento.com.br';
const PIX_MERCHANT = 'DNA BAIXADA';

function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, '0') + value;
}

function gerarPixPayload(amount: number): string {
  // Payload Format Indicator
  const pfi = tlv('00', '01');

  // Merchant Account Information (GUI + PIX key)
  const gui = tlv('00', 'br.gov.bcb.pix');   // GUI
  const key = tlv('01', PIX_KEY);             // PIX key
  const mai = tlv('26', gui + key);           // MAI under ID 26

  // Merchant Category Code
  const mcc = tlv('52', '5411');

  // Transaction Currency (986 = BRL)
  const cur = tlv('53', '986');

  // Transaction Amount
  const amt = tlv('54', amount.toFixed(2));

  // Country Code
  const ccy = tlv('58', 'BR');

  // Merchant Name
  const name = tlv('59', PIX_MERCHANT);

  // Merchant City
  const city = tlv('60', 'SAO PAULO');

  // Additional Data Field Template
  const addData = tlv('05', '***');
  const adft = tlv('62', addData);

  const payloadWithoutCrc = pfi + mai + mcc + cur + amt + ccy + name + city + adft + '6304';

  // CRC16 calculation
  const crc = crc16CCITT(payloadWithoutCrc);
  return payloadWithoutCrc + crc.toUpperCase();
}

function crc16CCITT(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).padStart(4, '0');
}

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
    'aguardando' | 'verificando' | 'confirmado' | 'falhou'
  >('aguardando');
  const [transacaoId, setTransacaoId] = useState<string | null>(null);
  const [troco, setTroco] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pixCode = gerarPixPayload(valor);

  // ── Copiar codigo Pix ──
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = pixCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }, [pixCode]);

  // ── Criar transacao no Supabase ──
  const criarTransacao = useCallback(
    async (formaPagamento: FormaPagamento) => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError('Usuario nao autenticado.');
          setLoading(false);
          return null;
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
            forma_pagamento: formaPagamento,
            pix_qrcode: formaPagamento === 'pix' ? pixCode : null,
            pix_copiaecola: formaPagamento === 'pix' ? pixCode : null,
            descricao: `Pagamento corrida ${corridaId.substring(0, 8)}`,
          })
          .select('id')
          .single();

        if (insertError) {
          setError(insertError.message);
          setLoading(false);
          return null;
        }

        setTransacaoId(data.id);
        setLoading(false);
        return data.id;
      } catch {
        setError('Erro ao criar transacao.');
        setLoading(false);
        return null;
      }
    },
    [corridaId, valor, pixCode]
  );

  // ── Simular polling de pagamento Pix ──
  const iniciarPollingPix = useCallback(
    (txId: string) => {
      setPagamentoStatus('verificando');

      // Simular verificacao apos 3 segundos
      setTimeout(async () => {
        try {
          // Atualizar transacao como concluida
          const { error: updateError } = await supabase
            .from('transacoes')
            .update({
              status: 'concluido',
              pix_pago_em: new Date().toISOString(),
            })
            .eq('id', txId);

          if (updateError) {
            setPagamentoStatus('falhou');
            return;
          }

          setPagamentoStatus('confirmado');
          // Chamar callback apos animacao de sucesso
          setTimeout(() => {
            onPagamentoConfirmado();
          }, 1800);
        } catch {
          setPagamentoStatus('falhou');
        }
      }, 3000);
    },
    [onPagamentoConfirmado]
  );

  // ── Confirmar pagamento Pix ──
  const handleConfirmarPix = async () => {
    const txId = await criarTransacao('pix');
    if (txId) {
      iniciarPollingPix(txId);
    }
  };

  // ── Confirmar pagamento em dinheiro ──
  const handleConfirmarDinheiro = async () => {
    const txId = await criarTransacao('dinheiro');
    if (txId) {
      setPagamentoStatus('confirmado');
      setTimeout(() => {
        onPagamentoConfirmado();
      }, 1500);
    }
  };

  // ── Pular pagamento (pagar em dinheiro direto) ──
  const handlePular = () => {
    onPular();
  };

  // ════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════

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
            {pagamentoStatus === 'aguardando' && (
              <>
                {/* QR Code */}
                <div className="flex flex-col items-center rounded-2xl border border-border bg-surface-elevated p-6">
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <QRCodeSVG
                      value={pixCode}
                      size={200}
                      level="M"
                      bgColor="#FFFFFF"
                      fgColor="#1a1a2e"
                      includeMargin={false}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-secondary" />
                    <p className="text-xs font-medium text-foreground-muted">
                      Escaneie o QR Code para pagar com Pix
                    </p>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs text-foreground-muted/60">
                      Chave: {PIX_KEY}
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-secondary">
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
                      Codigo copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar Codigo Pix
                    </>
                  )}
                </button>

                {/* Botao confirmar pagamento */}
                <button
                  onClick={handleConfirmarPix}
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
                      Ja fiz o pagamento Pix
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
                    Aguardando confirmacao...
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
                    Pagamento nao detectado
                  </p>
                  <p className="mt-1 text-sm text-foreground-muted">
                    Tente novamente ou escolha outra forma de pagamento
                  </p>
                </div>
                <button
                  onClick={() => setPagamentoStatus('aguardando')}
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
            {pagamentoStatus === 'aguardando' ? (
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
                    placeholder="Ex: 50,00 (deixe vazio se nao precisa)"
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
                  O pagamento sera feito diretamente ao motorista
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
                Pagamento com cartao de credito estara disponivel em breve
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
