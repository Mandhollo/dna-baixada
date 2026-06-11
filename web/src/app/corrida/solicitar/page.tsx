'use client';
import PageTitle from '@/components/seo/PageTitle';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  MapPinIcon,
  Users,
  MessageSquare,
  CreditCard,
  Banknote,
  QrCode,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase, CORRIDA_TIPOS, calcularPrecoEstimado } from '@/lib/supabase';
import type { CorridaTipo, FormaPagamento } from '@/lib/supabase';
import PagamentoPix from '@/components/pagamento/PagamentoPix';
import dynamic from 'next/dynamic';
import type { LatLng } from '@/components/maps/RouteMap';

const RouteMap = dynamic(() => import('@/components/maps/RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-72 items-center justify-center rounded-2xl border border-border bg-surface-elevated">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-secondary/20 border-t-secondary" />
        <span className="text-xs text-foreground-muted">Carregando mapa...</span>
      </div>
    </div>
  ),
});

// ════════════════════════════════════════════════════════════
// Animation variants
// ════════════════════════════════════════════════════════════

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

// ════════════════════════════════════════════════════════════
// Payment options
// ════════════════════════════════════════════════════════════

const PAGAMENTO_OPTIONS: {
  value: FormaPagamento;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'pix',
    label: 'Pix',
    icon: <QrCode className="h-5 w-5" />,
  },
  {
    value: 'dinheiro',
    label: 'Dinheiro',
    icon: <Banknote className="h-5 w-5" />,
  },
  {
    value: 'cartao',
    label: 'Cartão',
    icon: <CreditCard className="h-5 w-5" />,
  },
];

// ════════════════════════════════════════════════════════════
// Main Page
// ════════════════════════════════════════════════════════════

export default function SolicitarCorridaPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // ── Step control ──
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // ── Form state ──
  const [selectedTipo, setSelectedTipo] = useState<CorridaTipo | null>(null);
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [originCoord, setOriginCoord] = useState<LatLng | null>(null);
  const [destCoord, setDestCoord] = useState<LatLng | null>(null);
  const [passageiros, setPassageiros] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');

  // ── Submit state ──
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [corridaId, setCorridaId] = useState<string | null>(null);

  // ── Auth guard ──
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/entrar');
      return;
    }
    if (profile && profile.role !== 'passageiro') {
      router.replace('/dashboard');
    }
  }, [user, profile, loading, router]);

  // ── Computed price ──
  const precoEstimado = useMemo(() => {
    if (!selectedTipo) return 0;
    return calcularPrecoEstimado(selectedTipo, undefined, passageiros);
  }, [selectedTipo, passageiros]);

  // ── Step navigation ──
  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 4));
    setError(null);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
    setError(null);
  };

  // ── Validation ──
  const canGoNext = (): boolean => {
    if (step === 1) return selectedTipo !== null;
    if (step === 2) return origem.trim().length > 0;
    return true;
  };

  // ── Submit handler ──
  const handleSubmit = async () => {
    if (!user || !selectedTipo) return;
    setSubmitting(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from('corridas')
        .insert({
          passageiro_id: user.id,
          tipo: selectedTipo,
          origem_endereco: origem.trim(),
          destino_endereco: destino.trim() || null,
          passageiros,
          observacoes: observacoes.trim() || null,
          preco_estimado: precoEstimado,
          forma_pagamento: formaPagamento,
          status: 'aguardando',
        })
        .select()
        .single();

      if (insertError) {
        setError(insertError.message);
        return;
      }

      setCorridaId(data.id);
      setDirection(1);
      setStep(4);
    } catch (err) {
      setError('Erro inesperado. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Payment callbacks ──
  const handlePagamentoConfirmado = () => {
    if (corridaId) {
      router.push(`/corrida/${corridaId}`);
    }
  };

  const handlePularPagamento = () => {
    if (corridaId) {
      router.push(`/corrida/${corridaId}`);
    }
  };

  // ── Helpers ──
  const selectedTipoObj = CORRIDA_TIPOS.find((t) => t.value === selectedTipo);
  const selectedPagamentoObj = PAGAMENTO_OPTIONS.find(
    (p) => p.value === formaPagamento
  );

  // ════════════════════════════════════════════════════════════
  // Render — Loading
  // ════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
      <PageTitle title='Solicitar Corrida' />
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-foreground-muted">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'passageiro') return null;

  // ════════════════════════════════════════════════════════════
  // Render — Main
  // ════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background-secondary">
      {/* ── Sticky top bar ── */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            onClick={() => {
              if (step === 1) {
                router.push('/dashboard');
              } else {
                goBack();
              }
            }}
            className="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Solicitar Corrida</h1>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-6 bg-accent'
                    : s < step
                      ? 'w-2 bg-secondary'
                      : 'w-2 bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <StepOne
                selectedTipo={selectedTipo}
                onSelect={setSelectedTipo}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <StepTwo
                origem={origem}
                setOrigem={setOrigem}
                destino={destino}
                setDestino={setDestino}
                originCoord={originCoord}
                destCoord={destCoord}
                onOriginChange={(lat: number, lng: number, addr: string) => {
                  setOriginCoord({ lat, lng });
                  setOrigem(addr);
                }}
                onDestChange={(lat: number, lng: number, addr: string) => {
                  setDestCoord({ lat, lng });
                  setDestino(addr);
                }}
                passageiros={passageiros}
                setPassageiros={setPassageiros}
                observacoes={observacoes}
                setObservacoes={setObservacoes}
                formaPagamento={formaPagamento}
                setFormaPagamento={setFormaPagamento}
                precoEstimado={precoEstimado}
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <StepThree
                tipoObj={selectedTipoObj!}
                origem={origem}
                destino={destino}
                passageiros={passageiros}
                observacoes={observacoes}
                formaPagamento={selectedPagamentoObj!}
                precoEstimado={precoEstimado}
              />
            </motion.div>
          )}

          {step === 4 && corridaId && (
            <motion.div
              key="step-4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <PagamentoPix
                valor={precoEstimado}
                corridaId={corridaId}
                onPagamentoConfirmado={handlePagamentoConfirmado}
                onPular={handlePularPagamento}
              />
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
              className="mt-4 flex items-center gap-2 rounded-xl border border-accent2/20 bg-accent2/5 px-4 py-3 text-sm text-accent2"
            >
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bottom action bar ── */}
        {step < 4 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={goBack}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-elevated px-5 py-3 text-sm font-semibold text-foreground-secondary transition hover:bg-background-tertiary"
            >
              <ChevronLeft className="h-4 w-4" />
              Voltar
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={goNext}
              disabled={!canGoNext()}
              className="flex items-center gap-1.5 rounded-xl bg-secondary px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-secondary-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirmar Corrida
                </>
              )}
            </button>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Step 1 — Select ride type
// ════════════════════════════════════════════════════════════

function StepOne({
  selectedTipo,
  onSelect,
}: {
  selectedTipo: CorridaTipo | null;
  onSelect: (tipo: CorridaTipo) => void;
}) {
  return (
    <div>
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <h2 className="text-xl font-bold text-foreground">
          Escolha o tipo de corrida
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Selecione a melhor opção para o seu trajeto
        </p>
      </motion.div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {CORRIDA_TIPOS.map((tipo, index) => {
          const isSelected = selectedTipo === tipo.value;
          return (
            <motion.button
              key={tipo.value}
              {...fadeUp}
              transition={{ delay: 0.05 + index * 0.04 }}
              onClick={() => onSelect(tipo.value)}
              className={`group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-secondary bg-secondary/5 shadow-md ring-2 ring-secondary/30'
                  : 'border-border bg-surface-elevated hover:border-secondary/40 hover:shadow-sm'
              }`}
            >
              {/* Check indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-white"
                >
                  <Check className="h-3.5 w-3.5" />
                </motion.div>
              )}

              <span className="text-2xl">{tipo.icon}</span>
              <h3
                className={`mt-2 text-sm font-bold leading-tight ${
                  isSelected ? 'text-secondary' : 'text-foreground'
                }`}
              >
                {tipo.label}
              </h3>
              <p className="mt-0.5 text-xs leading-snug text-foreground-muted">
                {tipo.descricao}
              </p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Step 2 — Ride details form
// ════════════════════════════════════════════════════════════

function StepTwo({
  origem,
  setOrigem,
  destino,
  setDestino,
  originCoord,
  destCoord,
  onOriginChange,
  onDestChange,
  passageiros,
  setPassageiros,
  observacoes,
  setObservacoes,
  formaPagamento,
  setFormaPagamento,
  precoEstimado,
}: {
  origem: string;
  setOrigem: (v: string) => void;
  destino: string;
  setDestino: (v: string) => void;
  originCoord: LatLng | null;
  destCoord: LatLng | null;
  onOriginChange: (lat: number, lng: number, address: string) => void;
  onDestChange: (lat: number, lng: number, address: string) => void;
  passageiros: number;
  setPassageiros: (v: number) => void;
  observacoes: string;
  setObservacoes: (v: string) => void;
  formaPagamento: FormaPagamento;
  setFormaPagamento: (v: FormaPagamento) => void;
  precoEstimado: number;
}) {
  return (
    <div className="space-y-5">
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <h2 className="text-xl font-bold text-foreground">
          Detalhes da corrida
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Informe os dados do seu trajeto
        </p>
      </motion.div>

      {/* ── Interactive Map ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.08 }}>
        <RouteMap
          origin={originCoord}
          destination={destCoord}
          onOriginChange={onOriginChange}
          onDestChange={onDestChange}
        />
      </motion.div>

      {/* ── Origem ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground-secondary">
          <MapPin className="h-4 w-4 text-secondary" />
          Origem <span className="text-accent2">*</span>
        </label>
        <input
          type="text"
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
          placeholder="Ex: Av. Ana Costa, 100 — Santos"
          className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted/50 transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none"
        />
      </motion.div>


      {/* ── Destino ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground-secondary">
          <MapPinIcon className="h-4 w-4 text-accent" />
          Destino
        </label>
        <input
          type="text"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          placeholder="Ex: Praia do Gonzaga — Santos (opcional)"
          className="w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted/50 transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none"
        />
      </motion.div>

      {/* ── Passageiros ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground-secondary">
          <Users className="h-4 w-4 text-primary" />
          Número de passageiros
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPassageiros(Math.max(1, passageiros - 1))}
            disabled={passageiros <= 1}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-elevated text-lg font-bold text-foreground transition hover:bg-background-tertiary disabled:cursor-not-allowed disabled:opacity-30"
          >
            −
          </button>
          <div className="flex h-12 w-16 items-center justify-center rounded-xl bg-primary/5 text-xl font-extrabold text-primary">
            {passageiros}
          </div>
          <button
            onClick={() => setPassageiros(Math.min(6, passageiros + 1))}
            disabled={passageiros >= 6}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-elevated text-lg font-bold text-foreground transition hover:bg-background-tertiary disabled:cursor-not-allowed disabled:opacity-30"
          >
            +
          </button>
          <span className="text-sm text-foreground-muted">
            {passageiros === 1 ? 'pessoa' : 'pessoas'}
          </span>
        </div>
      </motion.div>

      {/* ── Observações ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
        <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-foreground-secondary">
          <MessageSquare className="h-4 w-4 text-foreground-muted" />
          Observações
        </label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex: Levo mala grande, tenho pet, etc. (opcional)"
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted/50 transition focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none"
        />
      </motion.div>

      {/* ── Preço estimado ── */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-accent/20 bg-accent/5 p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Preço estimado
        </p>
        <p className="mt-1 text-2xl font-extrabold text-accent-dark">
          R$ {precoEstimado.toFixed(2).replace('.', ',')}
        </p>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Valor sujeito a alteração conforme trajeto real
        </p>
      </motion.div>

      {/* ── Forma de pagamento ── */}
      <motion.div {...fadeUp} transition={{ delay: 0.35 }}>
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground-secondary">
          <CreditCard className="h-4 w-4 text-primary" />
          Forma de pagamento
        </label>
        <div className="grid grid-cols-3 gap-3">
          {PAGAMENTO_OPTIONS.map((opt) => {
            const isSelected = formaPagamento === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setFormaPagamento(opt.value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all duration-200 ${
                  isSelected
                    ? 'border-secondary bg-secondary/5 ring-2 ring-secondary/30'
                    : 'border-border bg-surface-elevated hover:border-secondary/40'
                }`}
              >
                <span
                  className={
                    isSelected ? 'text-secondary' : 'text-foreground-muted'
                  }
                >
                  {opt.icon}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isSelected ? 'text-secondary' : 'text-foreground-secondary'
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Step 3 — Confirmation
// ════════════════════════════════════════════════════════════

function StepThree({
  tipoObj,
  origem,
  destino,
  passageiros,
  observacoes,
  formaPagamento,
  precoEstimado,
}: {
  tipoObj: (typeof CORRIDA_TIPOS)[number];
  origem: string;
  destino: string;
  passageiros: number;
  observacoes: string;
  formaPagamento: (typeof PAGAMENTO_OPTIONS)[number];
  precoEstimado: number;
}) {
  return (
    <div className="space-y-5">
      <motion.div {...fadeUp} transition={{ delay: 0.05 }}>
        <h2 className="text-xl font-bold text-foreground">
          Confirme sua corrida
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          Revise os dados antes de confirmar
        </p>
      </motion.div>

      {/* ── Ride type card ── */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/5 text-2xl">
            {tipoObj.icon}
          </span>
          <div>
            <h3 className="font-bold text-foreground">{tipoObj.label}</h3>
            <p className="text-xs text-foreground-muted">{tipoObj.descricao}</p>
          </div>
        </div>
      </motion.div>

      {/* ── Details ── */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.15 }}
        className="space-y-3 rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm"
      >
        <DetailRow icon={<MapPin className="h-4 w-4 text-secondary" />} label="Origem" value={origem} />
        {destino && (
          <DetailRow icon={<MapPinIcon className="h-4 w-4 text-accent" />} label="Destino" value={destino} />
        )}
        <DetailRow
          icon={<Users className="h-4 w-4 text-primary" />}
          label="Passageiros"
          value={`${passageiros} ${passageiros === 1 ? 'pessoa' : 'pessoas'}`}
        />
        {observacoes && (
          <DetailRow
            icon={<MessageSquare className="h-4 w-4 text-foreground-muted" />}
            label="Observações"
            value={observacoes}
          />
        )}
        <DetailRow
          icon={formaPagamento.icon}
          label="Pagamento"
          value={formaPagamento.label}
        />
      </motion.div>

      {/* ── Price highlight ── */}
      <motion.div
        {...fadeUp}
        transition={{ delay: 0.2 }}
        className="rounded-2xl bg-gradient-to-br from-primary to-primary-light p-6 text-center text-white shadow-lg"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-white/60">
          Valor estimado
        </p>
        <p className="mt-2 text-4xl font-extrabold">
          R$ {precoEstimado.toFixed(2).replace('.', ',')}
        </p>
        <p className="mt-2 text-xs text-white/50">
          O valor final pode variar conforme o trajeto
        </p>
      </motion.div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Helper — Detail row
// ════════════════════════════════════════════════════════════

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-foreground-muted">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
