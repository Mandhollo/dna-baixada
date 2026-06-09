'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  Car,
  CreditCard,
  Users,
  Clock,
  Star,
  Send,
  X,
  CheckCircle,
  Play,
  Square,
  MessageCircle,
  User,
  Phone,
  AlertTriangle,
} from 'lucide-react';
import { supabase, CORRIDA_STATUS_LABELS, CORRIDA_TIPOS } from '@/lib/supabase';
import type { Corrida, MensagemChat, Profile } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';

// ════════════════════════════════════════════════════════════
// Formatters
// ════════════════════════════════════════════════════════════

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formaPagamentoLabel(fp?: string | null): string {
  switch (fp) {
    case 'pix':
      return 'PIX';
    case 'dinheiro':
      return 'Dinheiro';
    case 'cartao':
      return 'Cartão';
    default:
      return 'A definir';
  }
}

// ════════════════════════════════════════════════════════════
// Main Page Component
// ════════════════════════════════════════════════════════════

export default function CorridaAtivaPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const id = params.id as string;

  const [corrida, setCorrida] = useState<Corrida | null>(null);
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chat state
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rating state
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Action loading states
  const [actionLoading, setActionLoading] = useState(false);

  // ── Load initial data ──
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // Load corrida with joins
      const { data: corridaData, error: corridaErr } = await supabase
        .from('corridas')
        .select(
          '*, passageiro:profiles!corridas_passageiro_id_fkey(*), motorista:profiles!corridas_motorista_id_fkey(*, motoristas(*))',
        )
        .eq('id', id)
        .single();

      if (corridaErr || !corridaData) {
        setError('Corrida não encontrada.');
        setLoading(false);
        return;
      }
      setCorrida(corridaData as Corrida);

      // Load messages
      const { data: msgsData } = await supabase
        .from('mensagens_chat')
        .select('*, remetente:profiles!mensagens_chat_remetente_id_fkey(*)')
        .eq('corrida_id', id)
        .order('created_at', { ascending: true });

      if (msgsData) {
        setMensagens(msgsData as MensagemChat[]);
      }

      // Check if user already rated this ride
      if (corridaData.status === 'finalizada' && user) {
        const { data: existingRating } = await supabase
          .from('avaliacoes')
          .select('id')
          .eq('corrida_id', id)
          .eq('avaliador_id', user.id)
          .maybeSingle();
        if (existingRating) setHasRated(true);
      }

      setLoading(false);
    }

    if (id) load();
  }, [id, user]);

  // ── Real-time subscription for corrida updates ──
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`corrida-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'corridas', filter: `id=eq.${id}` },
        async (payload) => {
          const updated = payload.new as Corrida;
          // Re-fetch joins for updated corrida
          const { data } = await supabase
            .from('corridas')
            .select(
              '*, passageiro:profiles!corridas_passageiro_id_fkey(*), motorista:profiles!corridas_motorista_id_fkey(*, motoristas(*))',
            )
            .eq('id', id)
            .single();
          setCorrida(data ? (data as Corrida) : updated);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // ── Real-time subscription for chat messages ──
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`chat-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens_chat',
          filter: `corrida_id=eq.${id}`,
        },
        async (payload) => {
          const newMsg = payload.new as MensagemChat;
          // Fetch sender profile for the new message
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.remetente_id)
            .single();

          const msgWithSender: MensagemChat = {
            ...newMsg,
            remetente: (senderProfile as Profile) ?? undefined,
          };

          setMensagens((prev) => {
            // Avoid duplicates (in case we inserted it ourselves)
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, msgWithSender];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // ── Auto-scroll chat ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // ── Send message ──
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !user || sendingMsg) return;
    setSendingMsg(true);

    const { data, error: insertErr } = await supabase
      .from('mensagens_chat')
      .insert({
        corrida_id: id,
        remetente_id: user.id,
        mensagem: newMessage.trim(),
        lida: false,
      })
      .select('*, remetente:profiles!mensagens_chat_remetente_id_fkey(*)')
      .single();

    if (!insertErr && data) {
      setMensagens((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data as MensagemChat];
      });
      setNewMessage('');
    }
    setSendingMsg(false);
  }, [newMessage, user, id, sendingMsg]);

  // ── Driver actions ──
  const handleAceitar = useCallback(async () => {
    if (!user || actionLoading) return;
    setActionLoading(true);
    await supabase
      .from('corridas')
      .update({
        motorista_id: user.id,
        status: 'aceita',
        aceita_em: new Date().toISOString(),
      })
      .eq('id', id);
    setActionLoading(false);
  }, [user, id, actionLoading]);

  const handleIniciar = useCallback(async () => {
    if (actionLoading) return;
    setActionLoading(true);
    await supabase
      .from('corridas')
      .update({
        status: 'em_andamento',
        iniciada_em: new Date().toISOString(),
      })
      .eq('id', id);
    setActionLoading(false);
  }, [id, actionLoading]);

  const handleFinalizar = useCallback(async () => {
    if (actionLoading) return;
    setActionLoading(true);
    await supabase
      .from('corridas')
      .update({
        status: 'finalizada',
        finalizada_em: new Date().toISOString(),
      })
      .eq('id', id);
    setActionLoading(false);
  }, [id, actionLoading]);

  // ── Cancel (passageiro) ──
  const handleCancelar = useCallback(async () => {
    if (!user || actionLoading) return;
    setActionLoading(true);
    await supabase
      .from('corridas')
      .update({
        status: 'cancelada',
        cancelado_por: user.id,
        motivo_cancelamento: 'Cancelado pelo passageiro',
      })
      .eq('id', id);
    setActionLoading(false);
  }, [user, id, actionLoading]);

  // ── Submit rating ──
  const handleSubmitRating = useCallback(async () => {
    if (!user || !corrida || rating === 0 || submittingRating) return;
    setSubmittingRating(true);

    const avaliadoId =
      profile?.role === 'passageiro' ? corrida.motorista_id : corrida.passageiro_id;

    if (!avaliadoId) {
      setSubmittingRating(false);
      return;
    }

    await supabase.from('avaliacoes').insert({
      corrida_id: id,
      avaliador_id: user.id,
      avaliado_id: avaliadoId,
      nota: rating,
      comentario: ratingComment.trim() || null,
    });

    setHasRated(true);
    setSubmittingRating(false);
  }, [user, corrida, rating, ratingComment, submittingRating, id, profile]);

  // ════════════════════════════════════════════════════════════
  // Loading state
  // ════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-foreground-muted">Carregando corrida...</p>
        </div>
      </div>
    );
  }

  if (error || !corrida) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background-secondary px-6">
        <AlertTriangle className="h-12 w-12 text-accent2" />
        <p className="text-lg font-semibold text-foreground">{error ?? 'Erro ao carregar corrida.'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-light"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // Derived values
  // ════════════════════════════════════════════════════════════

  const statusInfo = CORRIDA_STATUS_LABELS[corrida.status];
  const tipoInfo = CORRIDA_TIPOS.find((t) => t.value === corrida.tipo);
  const isMotorista = profile?.role === 'motorista';
  const isPassageiro = profile?.role === 'passageiro';
  const motoristaData = corrida.motorista;
  const motoristaVeiculo = (motoristaData as any)?.motoristas?.[0];

  const showChat = corrida.status !== 'cancelada';
  const showRating =
    corrida.status === 'finalizada' && !hasRated && corrida.motorista_id;

  return (
    <div className="flex min-h-screen flex-col bg-background-secondary">
      {/* ════════ Header ════════ */}
      <header className="sticky top-0 z-30 bg-primary text-white shadow-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">{tipoInfo?.icon ?? '🚗'}</span>
              <h1 className="text-base font-bold">{tipoInfo?.label ?? 'Corrida'}</h1>
            </div>
            <p className="text-xs text-white/60">{formatDate(corrida.created_at)}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl flex-1 px-4 pb-4 pt-4">
        {/* ════════ Status Banner ════════ */}
        <AnimatePresence mode="wait">
          <motion.div
            key={corrida.status}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`mb-4 rounded-2xl p-4 ${statusInfo.bg}`}
          >
            <div className="flex items-center gap-3">
              <StatusIcon status={corrida.status} />
              <div>
                <p className={`text-sm font-bold ${statusInfo.color}`}>
                  {statusInfo.label}
                </p>
                {corrida.status === 'aguardando' && (
                  <p className="mt-0.5 text-xs text-foreground-muted animate-pulse">
                    Procurando motorista...
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* ════════ Ride Details Card ════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm"
        >
          {/* Route */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1">
              <div className="h-3 w-3 rounded-full bg-secondary" />
              <div className="w-0.5 flex-1 bg-border-strong/40 my-1" style={{ minHeight: 24 }} />
              <div className="h-3 w-3 rounded-full bg-accent2" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-xs font-medium text-foreground-muted">Origem</p>
                <p className="text-sm font-semibold text-foreground">{corrida.origem_endereco}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground-muted">Destino</p>
                <p className="text-sm font-semibold text-foreground">
                  {corrida.destino_endereco ?? 'A definir'}
                </p>
              </div>
            </div>
          </div>

          {/* Detail chips */}
          <div className="mt-5 flex flex-wrap gap-2">
            <DetailChip
              icon={<CreditCard className="h-3.5 w-3.5" />}
              label={formaPagamentoLabel(corrida.forma_pagamento)}
            />
            <DetailChip
              icon={<Users className="h-3.5 w-3.5" />}
              label={`${corrida.passageiros} passageiro${corrida.passageiros > 1 ? 's' : ''}`}
            />
            {corrida.distancia_km != null && (
              <DetailChip
                icon={<Navigation className="h-3.5 w-3.5" />}
                label={`${corrida.distancia_km.toFixed(1)} km`}
              />
            )}
            {corrida.duracao_minutos != null && (
              <DetailChip
                icon={<Clock className="h-3.5 w-3.5" />}
                label={`~${corrida.duracao_minutos} min`}
              />
            )}
          </div>

          {/* Price */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-background-tertiary px-4 py-3">
            <span className="text-sm font-medium text-foreground-secondary">Valor</span>
            <span className="text-lg font-extrabold text-primary">
              {corrida.preco_final != null
                ? formatBRL(corrida.preco_final)
                : corrida.preco_estimado != null
                  ? `${formatBRL(corrida.preco_estimado)} (est.)`
                  : '—'}
            </span>
          </div>

          {/* Observações */}
          {corrida.observacoes && (
            <p className="mt-3 text-xs text-foreground-muted italic">
              💬 {corrida.observacoes}
            </p>
          )}
        </motion.div>

        {/* ════════ Driver Info ════════ */}
        {motoristaData && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-4 rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm"
          >
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
              <Car className="h-4 w-4 text-secondary" />
              Motorista
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <User className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">{motoristaData.nome}</p>
                {motoristaVeiculo && (
                  <p className="text-xs text-foreground-muted">
                    {motoristaVeiculo.veiculo_modelo} · {motoristaVeiculo.veiculo_cor ?? ''} ·{' '}
                    {motoristaVeiculo.veiculo_placa}
                  </p>
                )}
              </div>
              {motoristaData.telefone && (
                <a
                  href={`tel:${motoristaData.telefone}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary transition hover:bg-secondary/20"
                >
                  <Phone className="h-5 w-5" />
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* ════════ Driver Action Buttons ════════ */}
        {isMotorista && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="mb-4"
          >
            {corrida.status === 'aguardando' && (
              <button
                onClick={handleAceitar}
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-secondary px-6 py-4 text-base font-bold text-white shadow-lg shadow-secondary/20 transition hover:bg-secondary-dark hover:shadow-xl disabled:opacity-50"
              >
                <CheckCircle className="h-5 w-5" />
                {actionLoading ? 'Aceitando...' : 'Aceitar Corrida'}
              </button>
            )}
            {corrida.status === 'aceita' && corrida.motorista_id === user?.id && (
              <button
                onClick={handleIniciar}
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-light hover:shadow-xl disabled:opacity-50"
              >
                <Play className="h-5 w-5" />
                {actionLoading ? 'Iniciando...' : 'Iniciar Corrida'}
              </button>
            )}
            {corrida.status === 'em_andamento' && corrida.motorista_id === user?.id && (
              <button
                onClick={handleFinalizar}
                disabled={actionLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent2 px-6 py-4 text-base font-bold text-white shadow-lg shadow-accent2/20 transition hover:bg-accent2-dark hover:shadow-xl disabled:opacity-50"
              >
                <Square className="h-5 w-5" />
                {actionLoading ? 'Finalizando...' : 'Finalizar Corrida'}
              </button>
            )}
          </motion.div>
        )}

        {/* ════════ Cancel Button (passageiro, aguardando) ════════ */}
        {isPassageiro && corrida.status === 'aguardando' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="mb-4"
          >
            <button
              onClick={handleCancelar}
              disabled={actionLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-accent2/30 bg-accent2/5 px-6 py-3 text-sm font-semibold text-accent2 transition hover:bg-accent2/10 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              {actionLoading ? 'Cancelando...' : 'Cancelar Corrida'}
            </button>
          </motion.div>
        )}

        {/* ════════ Rating Section ════════ */}
        {showRating && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mb-4 rounded-2xl border border-accent/30 bg-accent/5 p-5"
          >
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
              <Star className="h-5 w-5 text-accent" />
              Avalie sua corrida
            </h3>
            <div className="mb-3 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-9 w-9 ${
                      star <= rating
                        ? 'fill-accent text-accent'
                        : 'text-border-strong'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Comentário (opcional)..."
              rows={2}
              className="mb-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-secondary focus:outline-none"
            />
            <button
              onClick={handleSubmitRating}
              disabled={rating === 0 || submittingRating}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-6 py-3 text-sm font-bold text-white transition hover:bg-accent-dark disabled:opacity-50"
            >
              <Star className="h-4 w-4" />
              {submittingRating ? 'Enviando...' : 'Enviar Avaliação'}
            </button>
          </motion.div>
        )}

        {/* ════════ Already rated confirmation ════════ */}
        {corrida.status === 'finalizada' && hasRated && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4"
          >
            <CheckCircle className="h-6 w-6 text-secondary" />
            <p className="text-sm font-semibold text-secondary">Avaliação enviada! Obrigado.</p>
          </motion.div>
        )}

        {/* ════════ Chat Section ════════ */}
        {showChat && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex flex-col rounded-2xl border border-border bg-surface-elevated shadow-sm"
          >
            {/* Chat header */}
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Chat da Corrida</h3>
              <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {mensagens.length} msg{mensagens.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Messages list */}
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ maxHeight: 320, minHeight: 160 }}>
              {mensagens.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-xs text-foreground-muted">
                    Nenhuma mensagem ainda. Diga olá! 👋
                  </p>
                </div>
              )}
              {mensagens.map((msg) => {
                const isOwn = msg.remetente_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-3 flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    <span className="mb-0.5 text-[10px] font-medium text-foreground-muted">
                      {msg.remetente?.nome ?? 'Usuário'}
                    </span>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        isOwn
                          ? 'rounded-br-md bg-primary text-white'
                          : 'rounded-bl-md bg-background-tertiary text-foreground'
                      }`}
                    >
                      {msg.mensagem}
                    </div>
                    <span className="mt-0.5 text-[10px] text-foreground-muted">
                      {formatTime(msg.created_at)}
                    </span>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="flex items-center gap-2 border-t border-border px-3 py-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Digite sua mensagem..."
                className="flex-1 rounded-xl bg-background-tertiary px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendingMsg}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-light disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// Sub-components
// ════════════════════════════════════════════════════════════

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'aguardando':
      return <Clock className="h-6 w-6 text-accent animate-pulse" />;
    case 'aceita':
      return <CheckCircle className="h-6 w-6 text-secondary" />;
    case 'em_andamento':
      return <Car className="h-6 w-6 text-primary" />;
    case 'finalizada':
      return <CheckCircle className="h-6 w-6 text-foreground-muted" />;
    case 'cancelada':
      return <X className="h-6 w-6 text-accent2" />;
    default:
      return null;
  }
}

function DetailChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-background-tertiary px-3 py-1.5 text-xs font-medium text-foreground-secondary">
      {icon}
      {label}
    </span>
  );
}
