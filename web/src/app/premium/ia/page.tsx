'use client';

import SeoMeta from '@/components/seo/SeoMeta';
import PremiumBreadcrumb from '@/components/premium/PremiumBreadcrumb';
import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Clock,
  MapPin,
  Ship,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

/* ─── animation helpers ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

/* ─── tipos ─── */
type ChatRole = 'user' | 'bot';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
}

/* ─── sugestões de perguntas ─── */
interface Suggestion {
  keyword: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    keyword: 'melhor região',
    label: 'Qual é a melhor região neste momento?',
    icon: MapPin,
    color: 'text-violet-600',
  },
  {
    keyword: 'eventos',
    label: 'Quais eventos gerarão maior demanda hoje?',
    icon: Calendar,
    color: 'text-fuchsia-600',
  },
  {
    keyword: 'horário',
    label: 'Qual horário costuma ter mais corridas?',
    icon: Clock,
    color: 'text-indigo-600',
  },
  {
    keyword: 'turistas',
    label: 'Onde há previsão de chegada de turistas?',
    icon: Ship,
    color: 'text-pink-600',
  },
];

/* ─── respostas mockadas baseadas em palavra-chave ─── */
const MOCK_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['melhor região', 'regiao', 'melhor regiao', 'onde trabalhar', 'lucrativa'],
    response:
      'Atualmente, o Gonzaga em Santos tem demanda 85%. O Centro de Santos está em 75%. Recomendo se posicionar perto do Shopping Praiamar.',
  },
  {
    keywords: ['evento', 'eventos'],
    response:
      'Hoje há 2 eventos: chegada de cruzeiro no Concais (+45% demanda) e jogo no estádio (+80%). Posicione-se perto do Concais às 8h.',
  },
  {
    keywords: ['horário', 'horario', 'pico', 'hora', 'melhor hora'],
    response:
      'Os horários de pico são 7h-9h (deslocamento trabalho) e 17h-19h (retorno). Aproveite também o almoço 12h-13h.',
  },
  {
    keywords: ['turista', 'turistas', 'cruzeiro', 'concais'],
    response:
      'Há previsão de 3.000 turistas chegando via cruzeiro MSC no Concais amanhã às 8h. Demanda de transfers aumentará 45%.',
  },
];

const DEFAULT_RESPONSE =
  'Processando dados da plataforma... Com base no histórico, recomendo as regiões do Centro de Santos e Gonzaga para o horário atual.';

/* ─── gerar resposta mockada inteligente ─── */
function getMockResponse(question: string): string {
  const q = question.toLowerCase().trim();
  for (const { keywords, response } of MOCK_RESPONSES) {
    if (keywords.some((k) => q.includes(k))) return response;
  }
  return DEFAULT_RESPONSE;
}

let msgIdCounter = 0;
function nextId() {
  msgIdCounter += 1;
  return `msg-${Date.now()}-${msgIdCounter}`;
}

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */
export default function IAPage() {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Olá! Sou seu assistente inteligente. Pergunte sobre as melhores regiões, eventos, horários de pico ou chegada de turistas em Santos e Baixada Santista. 🚗✨',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── scroll automático ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* ── enviar mensagem ── */
  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = { id: nextId(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // simula "pensando" e responde
    const resposta = getMockResponse(trimmed);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { id: nextId(), role: 'bot', text: resposta }]);
      setIsTyping(false);
    }, 900);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleSuggestionClick(suggestion: Suggestion) {
    setInput(suggestion.label);
    inputRef.current?.focus();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-white">
      <SeoMeta title='IA para Motoristas' description='Assistente de IA para motoristas DNA: melhores regiões, previsão de demanda, eventos e horários de pico em tempo real.' />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-fuchsia-600 px-6 py-20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-10 top-10 h-72 w-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-fuchsia-300 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            <PremiumBreadcrumb current="IA" />
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/20 backdrop-blur-sm"
          >
            <Sparkles className="h-8 w-8 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl font-extrabold leading-tight text-white sm:text-5xl"
          >
            IA para Motoristas
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mx-auto mt-4 max-w-xl text-lg text-white/85"
          >
            Seu assistente inteligente para ganhar mais
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <TrendingUp size={12} />
              Dados em tempo real
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
              <MapPin size={12} />
              Santos & Baixada
            </span>
          </motion.div>
        </div>
      </section>

      {/* ═══ CHAT ═══ */}
      <section className="mx-auto -mt-8 w-full max-w-3xl flex-1 px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex h-full min-h-[600px] flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl"
        >
          {/* ── Header do chat ── */}
          <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-md">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Assistente DNA</p>
              <p className="flex items-center gap-1 text-xs text-secondary">
                <span className="h-2 w-2 rounded-full bg-secondary" />
                Online agora
              </p>
            </div>
          </div>

          {/* ── Mensagens ── */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/50 px-4 py-6 sm:px-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-2.5 ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {msg.role === 'bot' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-sm">
                      <Bot size={16} className="text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      msg.role === 'user'
                        ? 'rounded-tr-sm bg-primary text-white'
                        : 'rounded-tl-sm bg-white text-gray-800 ring-1 ring-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* ── Indicador de digitação ── */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-sm">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* ── Sugestões ── */}
          {messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              variants={stagger}
              className="border-t border-gray-100 bg-white px-4 py-4 sm:px-6"
            >
              <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <Sparkles size={12} className="text-fuchsia-500" />
                Sugestões de perguntas
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <motion.button
                      key={s.keyword}
                      variants={fadeUp}
                      onClick={() => handleSuggestionClick(s)}
                      className="group flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-sm text-gray-700 transition hover:border-violet-300 hover:bg-violet-50"
                    >
                      <Icon size={16} className={`shrink-0 ${s.color}`} />
                      <span className="font-medium leading-tight">{s.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── Input ── */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-gray-100 bg-white p-3 sm:p-4"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta..."
              className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-200"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label="Enviar pergunta"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-md transition hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              <Send size={16} />
            </button>
          </form>
        </motion.div>

        {/* ── Nota de rodapé ── */}
        <p className="mt-4 text-center text-xs text-gray-400">
          🤖 Respostas baseadas em dados históricos de Santos e Baixada Santista. Demonstração.
        </p>
      </section>
    </div>
  );
}
