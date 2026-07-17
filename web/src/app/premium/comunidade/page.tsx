'use client';

import SeoMeta from '@/components/seo/SeoMeta';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Users,
  MessageCircle,
  Lightbulb,
  HelpCircle,
  Bell,
  MapPin,
  ChevronUp,
  Pin,
  Clock,
  Plus,
  ArrowLeft,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import type {
  ComunidadeTopico,
  ComunidadeCategoria,
  ComunidadeTopicoTipo,
} from '@/lib/supabase';
import {
  COMUNIDADE_TOPICO_TIPO_LABELS,
  COMUNIDADE_TOPICO_STATUS_LABELS,
} from '@/lib/supabase';

// ─── Fallback data (used quando tabela Supabase está vazia) ───
const FALLBACK_TOPICOS: ComunidadeTopico[] = [
  {
    id: 'fb-1',
    categoria_id: null,
    autor_id: 'fb-user-1',
    titulo: 'Como funciona o repasse semanal?',
    conteudo: 'Gostaria de entender melhor o cronograma de repasses e se há possibilidade de antecipação.',
    tipo: 'duvida',
    status: 'aberto',
    cidade: null,
    imagem_url: null,
    fixado: false,
    total_votos: 12,
    total_respostas: 5,
    total_visualizacoes: 184,
    ativo: true,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    autor: { nome: 'João Silva', foto_url: null },
  },
  {
    id: 'fb-2',
    categoria_id: null,
    autor_id: 'fb-user-2',
    titulo: 'Sugestão: adicionar pagamentos via PIX automático',
    conteudo: 'Seria muito útil ter um sistema de pagamento automático via PIX para o repasse semanal.',
    tipo: 'sugestao',
    status: 'em_analise',
    cidade: null,
    imagem_url: null,
    fixado: false,
    total_votos: 45,
    total_respostas: 18,
    total_visualizacoes: 612,
    ativo: true,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    autor: { nome: 'Maria Santos', foto_url: null },
  },
  {
    id: 'fb-3',
    categoria_id: null,
    autor_id: 'fb-user-3',
    titulo: 'Encontro de motoristas em Santos',
    conteudo: 'Vamos organizar um café da manhã para os motoristas da região de Santos.',
    tipo: 'grupo_cidade',
    status: 'aberto',
    cidade: 'Santos',
    imagem_url: null,
    fixado: false,
    total_votos: 23,
    total_respostas: 8,
    total_visualizacoes: 298,
    ativo: true,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    autor: { nome: 'Pedro Costa', foto_url: null },
  },
  {
    id: 'fb-4',
    categoria_id: null,
    autor_id: 'fb-user-dna',
    titulo: 'Cuidado com golpes na zona do porto',
    conteudo: 'Recebemos relatos de golpistas simulando corridas no porto. Fiquem atentos e confiram sempre a placa.',
    tipo: 'aviso',
    status: 'aberto',
    cidade: null,
    imagem_url: null,
    fixado: true,
    total_votos: 67,
    total_respostas: 12,
    total_visualizacoes: 1240,
    ativo: true,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    autor: { nome: 'DNA Oficial', foto_url: null },
  },
  {
    id: 'fb-5',
    categoria_id: null,
    autor_id: 'fb-user-5',
    titulo: 'Melhor horário para pegar corridas no Guarujá?',
    conteudo: 'Alguém sabe os melhores horários para maximizar as corridas no Guarujá na alta temporada?',
    tipo: 'discussao',
    status: 'aberto',
    cidade: null,
    imagem_url: null,
    fixado: false,
    total_votos: 8,
    total_respostas: 3,
    total_visualizacoes: 142,
    ativo: true,
    created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
    autor: { nome: 'Ana Paula', foto_url: null },
  },
];

// ─── Animations ───
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: 'easeOut' as const },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

// ─── Filtros de categoria ───
type FiltroCategoria = 'todos' | ComunidadeTopicoTipo;

const FILTROS: { id: FiltroCategoria; label: string; tipo?: ComunidadeTopicoTipo }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'discussao', label: 'Discussões', tipo: 'discussao' },
  { id: 'sugestao', label: 'Sugestões', tipo: 'sugestao' },
  { id: 'duvida', label: 'Dúvidas', tipo: 'duvida' },
  { id: 'grupo_cidade', label: 'Grupos por Cidade', tipo: 'grupo_cidade' },
  { id: 'aviso', label: 'Avisos', tipo: 'aviso' },
];

// ─── Helpers ───
function getTipoIcon(tipo: ComunidadeTopicoTipo) {
  switch (tipo) {
    case 'discussao':
      return MessageCircle;
    case 'sugestao':
      return Lightbulb;
    case 'duvida':
      return HelpCircle;
    case 'aviso':
      return Bell;
    case 'grupo_cidade':
      return MapPin;
    case 'denuncia':
      return Bell;
    default:
      return MessageCircle;
  }
}

function getTipoBadgeClasses(tipo: ComunidadeTopicoTipo) {
  const map: Record<ComunidadeTopicoTipo, string> = {
    discussao: 'bg-blue-50 text-blue-700 ring-blue-200',
    sugestao: 'bg-amber-50 text-amber-700 ring-amber-200',
    duvida: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    aviso: 'bg-red-50 text-red-700 ring-red-200',
    denuncia: 'bg-rose-50 text-rose-700 ring-rose-200',
    grupo_cidade: 'bg-purple-50 text-purple-700 ring-purple-200',
  };
  return map[tipo] ?? 'bg-gray-50 text-gray-700 ring-gray-200';
}

function tempoRelativo(iso: string): string {
  const agora = Date.now();
  const data = new Date(iso).getTime();
  const diff = Math.max(0, agora - data);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  const sem = Math.floor(d / 7);
  if (sem < 4) return `há ${sem}sem`;
  const mes = Math.floor(d / 30);
  if (mes < 12) return `há ${mes}mês`.replace('1mês', '1mês');
  return `há ${Math.floor(d / 365)}a`;
}

function getInitials(nome: string): string {
  if (!nome) return '?';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// ─── Component: Tópico Card ───
function TopicoCard({
  topico,
  index,
  onUpvote,
  voted,
}: {
  topico: ComunidadeTopico;
  index: number;
  onUpvote: (id: string) => void;
  voted: boolean;
}) {
  const TipoIcon = getTipoIcon(topico.tipo);
  const tipoInfo = COMUNIDADE_TOPICO_TIPO_LABELS[topico.tipo];
  const statusInfo = topico.tipo === 'sugestao' ? COMUNIDADE_TOPICO_STATUS_LABELS[topico.status] : null;
  const autorNome = topico.autor?.nome ?? 'Motorista DNA';
  const isOficial = autorNome.toLowerCase().includes('dna oficial');

  return (
    <motion.article
      custom={index}
      variants={fadeUp}
      className={`relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
        topico.fixado ? 'ring-2 ring-amber-300' : ''
      }`}
    >
      {topico.fixado && (
        <div className="absolute top-0 right-0 bg-amber-400 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
          <Pin className="w-3 h-3" />
          Fixado
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          {/* Upvote */}
          <button
            type="button"
            onClick={() => onUpvote(topico.id)}
            aria-label="Votar"
            className={`flex flex-col items-center justify-center rounded-xl border px-2.5 py-1.5 transition-colors min-w-[52px] ${
              voted
                ? 'bg-secondary text-white border-secondary'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-secondary hover:text-secondary'
            }`}
          >
            <ChevronUp className={`w-5 h-5 ${voted ? 'scale-110' : ''} transition-transform`} />
            <span className="text-sm font-bold tabular-nums">{topico.total_votos}</span>
          </button>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getTipoBadgeClasses(
                  topico.tipo,
                )}`}
              >
                <TipoIcon className="w-3.5 h-3.5" />
                {tipoInfo?.label ?? 'Tópico'}
              </span>
              {statusInfo && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {statusInfo.label}
                </span>
              )}
              {topico.cidade && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                  <MapPin className="w-3 h-3" />
                  {topico.cidade}
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 pr-8">
              {topico.titulo}
            </h3>
            {topico.conteudo && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {topico.conteudo}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              {/* Autor */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                    isOficial
                      ? 'bg-gradient-to-br from-primary to-secondary'
                      : 'bg-gradient-to-br from-secondary to-cyan-500'
                  }`}
                >
                  {getInitials(autorNome)}
                </div>
                <span className="font-medium text-gray-700">{autorNome}</span>
              </div>

              {/* Respostas */}
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {topico.total_respostas} {topico.total_respostas === 1 ? 'resposta' : 'respostas'}
              </span>

              {/* Data */}
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {tempoRelativo(topico.created_at)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Component: Modal Novo Tópico ───
function NovoTopicoModal({
  open,
  onClose,
  onSubmit,
  isLoggedIn,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { titulo: string; conteudo: string; tipo: ComunidadeTopicoTipo }) => Promise<void>;
  isLoggedIn: boolean;
}) {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState<ComunidadeTopicoTipo>('discussao');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setTitulo('');
    setConteudo('');
    setTipo('discussao');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !conteudo.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({ titulo: titulo.trim(), conteudo: conteudo.trim(), tipo });
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-secondary" />
                Novo Tópico
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isLoggedIn ? (
              <div className="p-6 text-center">
                <p className="text-gray-600 mb-4">
                  Você precisa estar logado para criar um tópico na comunidade.
                </p>
                <Link
                  href="/entrar"
                  className="inline-flex items-center gap-2 rounded-full bg-secondary text-white px-6 py-2.5 text-sm font-bold hover:bg-secondary/90 transition-colors"
                >
                  Entrar / Cadastrar
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Tipo de tópico
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as ComunidadeTopicoTipo)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  >
                    {(Object.keys(COMUNIDADE_TOPICO_TIPO_LABELS) as ComunidadeTopicoTipo[])
                      .filter((t) => t !== 'denuncia')
                      .map((t) => (
                        <option key={t} value={t}>
                          {COMUNIDADE_TOPICO_TIPO_LABELS[t].label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Título
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Dúvida sobre repasse semanal"
                    maxLength={120}
                    required
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Conteúdo
                  </label>
                  <textarea
                    value={conteudo}
                    onChange={(e) => setConteudo(e.target.value)}
                    placeholder="Descreva seu tópico..."
                    rows={4}
                    maxLength={2000}
                    required
                    className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !titulo.trim() || !conteudo.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-secondary text-white px-5 py-2.5 text-sm font-bold hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Publicando...' : 'Publicar'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Page ───
export default function ComunidadePage() {
  const { user, loading: authLoading } = useAuth();
  const [topicos, setTopicos] = useState<ComunidadeTopico[]>([]);
  const [categorias, setCategorias] = useState<ComunidadeCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FiltroCategoria>('todos');
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);

  const isLoggedIn = !!user && !authLoading;

  // ─── Fetch tópicos ───
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [{ data, error }, { data: catData }] = await Promise.all([
          supabase
            .from('comunidade_topicos')
            .select(
              '*, autor:motoristas(nome, foto_url), categoria:comunidade_categorias(*)',
            )
            .eq('ativo', true)
            .order('fixado', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('comunidade_categorias')
            .select('*')
            .eq('ativo', true)
            .order('ordem', { ascending: true }),
        ]);

        if (!mounted) return;

        if (!error && data && data.length > 0) {
          setTopicos(data as unknown as ComunidadeTopico[]);
        } else {
          // Fallback se tabela vazia ou erro
          setTopicos(FALLBACK_TOPICOS);
        }
        if (catData && catData.length > 0) {
          setCategorias(catData as ComunidadeCategoria[]);
        }
      } catch {
        if (mounted) setTopicos(FALLBACK_TOPICOS);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ─── Filtragem ───
  const topicosFiltrados = useMemo(() => {
    if (filtro === 'todos') return topicos;
    return topicos.filter((t) => t.tipo === filtro);
  }, [topicos, filtro]);

  // Ordena: fixado primeiro (já vem do DB, mas reforça para fallback)
  const topicosOrdenados = useMemo(() => {
    return [...topicosFiltrados].sort((a, b) => {
      if (a.fixado !== b.fixado) return a.fixado ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [topicosFiltrados]);

  function handleUpvote(id: string) {
    if (votedIds.has(id)) return;
    setVotedIds((prev) => new Set(prev).add(id));
    setTopicos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, total_votos: t.total_votos + 1 } : t)),
    );
    // Persiste no Supabase (best-effort, não bloqueante)
    void (async () => {
      try {
        await supabase.rpc('incrementar_voto_topico', { topico_id: id });
      } catch {
        /* noop — voto é refletido localmente */
      }
    })();
  }

  async function handleNovoTopico(data: {
    titulo: string;
    conteudo: string;
    tipo: ComunidadeTopicoTipo;
  }) {
    if (!user) return;
    const novoPayload = {
      autor_id: user.id,
      titulo: data.titulo,
      conteudo: data.conteudo,
      tipo: data.tipo,
      status: 'aberto' as const,
      fixado: false,
      ativo: true,
    };

    try {
      const { data: inserted, error } = await supabase
        .from('comunidade_topicos')
        .insert(novoPayload)
        .select('*, autor:motoristas(nome, foto_url)')
        .single();

      if (!error && inserted) {
        setTopicos((prev) => [inserted as unknown as ComunidadeTopico, ...prev]);
        return;
      }
      // Se falhar (RLS/tabela ausente), adiciona localmente como fallback
      const localTopico: ComunidadeTopico = {
        id: `local-${Date.now()}`,
        categoria_id: null,
        autor_id: user.id,
        titulo: data.titulo,
        conteudo: data.conteudo,
        tipo: data.tipo,
        status: 'aberto',
        cidade: null,
        imagem_url: null,
        fixado: false,
        total_votos: 0,
        total_respostas: 0,
        total_visualizacoes: 0,
        ativo: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        autor: { nome: 'Você', foto_url: null },
      };
      setTopicos((prev) => [localTopico, ...prev]);
    } catch {
      // noop
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SeoMeta title='Comunidade DNA' description='Comunidade exclusiva de motoristas DNA Mobilidade: fórum, sugestões, votações e grupos por cidade na Baixada Santista.' />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-600 py-16 sm:py-20 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full bg-cyan-300 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Premium
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
          >
            <div>
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
                className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-5"
              >
                <Users className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">
                Área da Comunidade
              </h1>
              <p className="mt-3 max-w-xl text-lg text-white/85">
                Conecte-se com outros motoristas da DNA
              </p>
            </div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white text-teal-700 px-6 py-3 text-sm font-bold shadow-lg hover:bg-teal-50 transition-colors self-start"
            >
              <Plus className="w-4 h-4" />
              Novo Tópico
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ─── Conteúdo ─────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto w-full px-6 py-10 sm:py-12 flex-1">
        {/* ─── Filtros ─── */}
        <div className="mb-6 -mt-16 sm:-mt-20 relative z-10">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-2 flex flex-wrap gap-1.5">
            {FILTROS.map((f) => {
              const active = filtro === f.id;
              const count =
                f.id === 'todos'
                  ? topicos.length
                  : topicos.filter((t) => t.tipo === f.tipo).length;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltro(f.id)}
                  className={`relative px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
                  }`}
                >
                  {f.label}
                  <span
                    className={`ml-1.5 text-xs ${
                      active ? 'text-white/80' : 'text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Login banner se não logado ─── */}
        {!isLoggedIn && !authLoading && (
          <div className="mb-6 rounded-xl bg-teal-50 border border-teal-200 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-teal-800">
              <strong>Conecte-se</strong> para criar tópicos, votar e participar da comunidade.
            </p>
            <Link
              href="/entrar"
              className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 text-white px-4 py-1.5 text-xs font-bold hover:bg-teal-700 transition-colors"
            >
              Entrar / Cadastrar
            </Link>
          </div>
        )}

        {/* ─── Lista de tópicos ─── */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-12 h-16 rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-24 rounded-full bg-gray-200" />
                    <div className="h-5 w-3/4 rounded bg-gray-200" />
                    <div className="h-4 w-1/2 rounded bg-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : topicosOrdenados.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhum tópico encontrado</h3>
            <p className="text-gray-500 text-sm mb-6">
              Seja o primeiro a iniciar uma conversa nesta categoria.
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-teal-600 text-white px-5 py-2.5 text-sm font-bold hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Tópico
            </button>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-4">
            {topicosOrdenados.map((topico, idx) => (
              <TopicoCard
                key={topico.id}
                topico={topico}
                index={idx}
                onUpvote={handleUpvote}
                voted={votedIds.has(topico.id)}
              />
            ))}
          </motion.div>
        )}

        {/* ─── Footer info ─── */}
        <div className="mt-12 text-center">
          <p className="text-xs text-gray-400">
            {topicos.length} {topicos.length === 1 ? 'tópico' : 'tópicos'} ·{' '}
            {categorias.length > 0
              ? `${categorias.length} categorias`
              : 'Comunidade DNA Mobilidade'}
          </p>
        </div>
      </main>

      {/* ─── Modal Novo Tópico ─── */}
      <NovoTopicoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleNovoTopico}
        isLoggedIn={isLoggedIn}
      />
    </div>
  );
}
