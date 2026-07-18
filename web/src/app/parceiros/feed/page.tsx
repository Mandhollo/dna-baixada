'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  Ticket,
  Copy,
  Check,
  Image as ImageIcon,
  Plus,
  Clock,
  MapPin,
  X,
  Loader2,
  Video,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/AuthProvider';
import SeoMeta from '@/components/seo/SeoMeta';
import PremiumBreadcrumb from '@/components/premium/PremiumBreadcrumb';
import type { FeedPost, FeedPostTipo, FeedComentario } from '@/lib/supabase';
import { FEED_POST_TIPO_LABELS } from '@/lib/supabase';

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

/* ══════════════════════════════════════════════════════════
   FALLBACK — Feed mockado (quando tabela não responde)
   ══════════════════════════════════════════════════════════ */

const FALLBACK_FEED: FeedPost[] = [
  {
    id: 'mock-1',
    parceiro_id: 'mock-parceiro-1',
    conteudo: '🍕 Pizza Grande por R$ 29,90! Só hoje!',
    tipo: 'promocao',
    cidade: 'Santos',
    total_curtidas: 12,
    total_comentarios: 3,
    total_compartilhamentos: 2,
    total_visualizacoes: 120,
    ativo: true,
    fixado: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    parceiro: { nome: 'Restaurante do Porto' },
  },
  {
    id: 'mock-2',
    parceiro_id: 'mock-parceiro-2',
    conteudo: '🎉 Inauguramos nova unidade no Gonzaga!',
    tipo: 'novidade',
    cidade: 'Santos',
    total_curtidas: 8,
    total_comentarios: 2,
    total_compartilhamentos: 1,
    total_visualizacoes: 80,
    ativo: true,
    fixado: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    parceiro: { nome: 'Cafeteria Aroma' },
  },
  {
    id: 'mock-3',
    parceiro_id: 'mock-parceiro-3',
    conteudo: '🎫 Cupom DNA15 — 15% OFF em todos os serviços!',
    tipo: 'cupom',
    codigo_cupom: 'DNA15',
    cidade: 'Santos',
    total_curtidas: 45,
    total_comentarios: 12,
    total_compartilhamentos: 8,
    total_visualizacoes: 320,
    ativo: true,
    fixado: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    parceiro: { nome: 'Auto Posto Santos' },
  },
  {
    id: 'mock-4',
    parceiro_id: 'mock-parceiro-4',
    conteudo: '🏖️ Evento: Festival Gastronômico da Orla de Santos!',
    tipo: 'evento',
    cidade: 'Santos',
    total_curtidas: 23,
    total_comentarios: 5,
    total_compartilhamentos: 6,
    total_visualizacoes: 210,
    ativo: true,
    fixado: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    parceiro: { nome: 'Câmara de Santos' },
  },
  {
    id: 'mock-5',
    parceiro_id: 'mock-parceiro-5',
    conteudo: '✨ Novo produto: Linha completa de pneus Pirelli disponível!',
    tipo: 'produto_novo',
    cidade: 'Praia Grande',
    total_curtidas: 5,
    total_comentarios: 1,
    total_compartilhamentos: 0,
    total_visualizacoes: 42,
    ativo: true,
    fixado: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    parceiro: { nome: 'Pneus & Cia' },
  },
];

const FALLBACK_COMENTARIOS: Record<string, FeedComentario[]> = {
  'mock-1': [
    {
      id: 'c1-1',
      post_id: 'mock-1',
      autor_id: 'u1',
      conteudo: 'Aproveitando já!',
      total_curtidas: 2,
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      autor: { nome: 'João Silva' },
    },
    {
      id: 'c1-2',
      post_id: 'mock-1',
      autor_id: 'u2',
      conteudo: 'Qualquer sabor?',
      total_curtidas: 0,
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      autor: { nome: 'Maria Souza' },
    },
    {
      id: 'c1-3',
      post_id: 'mock-1',
      autor_id: 'u3',
      conteudo: 'Vou levar!',
      total_curtidas: 1,
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      autor: { nome: 'Pedro Costa' },
    },
  ],
  'mock-2': [
    {
      id: 'c2-1',
      post_id: 'mock-2',
      autor_id: 'u1',
      conteudo: 'Parabéns!',
      total_curtidas: 0,
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      autor: { nome: 'Ana Lima' },
    },
    {
      id: 'c2-2',
      post_id: 'mock-2',
      autor_id: 'u2',
      conteudo: 'Vou visitar!',
      total_curtidas: 0,
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      autor: { nome: 'Carlos Dias' },
    },
  ],
  'mock-3': [
    {
      id: 'c3-1',
      post_id: 'mock-3',
      autor_id: 'u1',
      conteudo: 'Cupom funcionou perfeitamente!',
      total_curtidas: 4,
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
      autor: { nome: 'Fernanda Rocha' },
    },
    {
      id: 'c3-2',
      post_id: 'mock-3',
      autor_id: 'u2',
      conteudo: 'Válido para fins de semana?',
      total_curtidas: 1,
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      autor: { nome: 'Rafael Alves' },
    },
  ],
  'mock-4': [
    {
      id: 'c4-1',
      post_id: 'mock-4',
      autor_id: 'u1',
      conteudo: 'Vai ter food truck?',
      total_curtidas: 2,
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      autor: { nome: 'Beatriz Nunes' },
    },
    {
      id: 'c4-2',
      post_id: 'mock-4',
      autor_id: 'u2',
      conteudo: 'Que horas começa?',
      total_curtidas: 0,
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      autor: { nome: 'Lucas Pires' },
    },
  ],
  'mock-5': [
    {
      id: 'c5-1',
      post_id: 'mock-5',
      autor_id: 'u1',
      conteudo: 'Tem para SUV?',
      total_curtidas: 0,
      ativo: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      autor: { nome: 'Gustavo Reis' },
    },
  ],
};

/* ══════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════ */

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `há ${d}d`;
  const mes = Math.floor(d / 30);
  if (mes < 12) return `há ${mes} mês${mes > 1 ? 'es' : ''}`;
  return `há ${Math.floor(mes / 12)}a`;
}

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const FILTROS: { value: FeedPostTipo | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'promocao', label: 'Promoções' },
  { value: 'novidade', label: 'Novidades' },
  { value: 'evento', label: 'Eventos' },
  { value: 'cupom', label: 'Cupons' },
  { value: 'produto_novo', label: 'Produtos Novos' },
];

/* ══════════════════════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════════════════════ */

export default function ParceirosFeedPage() {
  const { user, profile } = useAuth();

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<FeedPostTipo | 'todos'>('todos');
  const [comentariosPorPost, setComentariosPorPost] = useState<
    Record<string, FeedComentario[]>
  >({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  /* ─── carregar feed ─── */
  const carregarFeed = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parceiros_feed_posts')
        .select(
          '*, parceiro:parceiros(nome_fantasia, foto_url), estabelecimento:estabelecimentos(nome, logo_url)',
        )
        .eq('ativo', true)
        .order('fixado', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(30);

      if (error || !data || data.length === 0) {
        setPosts(FALLBACK_FEED);
        return;
      }

      // Normaliza para o tipo FeedPost
      const normalized: FeedPost[] = data.map((p: any) => ({
        ...p,
        cidade: p.cidade ?? '',
        total_curtidas: p.total_curtidas ?? 0,
        total_comentarios: p.total_comentarios ?? 0,
        total_compartilhamentos: p.total_compartilhamentos ?? 0,
        total_visualizacoes: p.total_visualizacoes ?? 0,
        parceiro: p.parceiro
          ? { nome: p.parceiro.nome_fantasia, foto_url: p.parceiro.foto_url }
          : undefined,
        estabelecimento: p.estabelecimento
          ? { nome: p.estabelecimento.nome, logo_url: p.estabelecimento.logo_url }
          : null,
      }));
      setPosts(normalized);
    } catch (e) {
      setPosts(FALLBACK_FEED);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─── carregar comentários de um post ─── */
  const carregarComentarios = useCallback(
    async (postId: string) => {
      if (comentariosPorPost[postId]) return;
      // fallback primeiro
      if (FALLBACK_COMENTARIOS[postId]) {
        setComentariosPorPost((prev) => ({ ...prev, [postId]: FALLBACK_COMENTARIOS[postId]! }));
        return;
      }
      try {
        const { data, error } = await supabase
          .from('parceiros_feed_comentarios')
          .select('*, autor:profiles(nome, foto_url)')
          .eq('post_id', postId)
          .eq('ativo', true)
          .order('created_at', { ascending: true })
          .limit(20);

        if (error || !data) {
          setComentariosPorPost((prev) => ({ ...prev, [postId]: [] }));
          return;
        }
        setComentariosPorPost((prev) => ({ ...prev, [postId]: data as FeedComentario[] }));
      } catch {
        setComentariosPorPost((prev) => ({ ...prev, [postId]: [] }));
      }
    },
    [comentariosPorPost],
  );

  /* ─── verificar curtidas do usuário ─── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase
          .from('parceiros_feed_curtidas')
          .select('post_id')
          .eq('usuario_id', user.id);
        if (data) {
          setLikedPosts(new Set(data.map((d: any) => d.post_id)));
        }
      } catch {
        /* noop */
      }
    })();
  }, [user]);

  useEffect(() => {
    carregarFeed();
  }, [carregarFeed]);

  /* ─── filtros ─── */
  const postsFiltrados = useMemo(() => {
    if (filtro === 'todos') return posts;
    return posts.filter((p) => p.tipo === filtro);
  }, [posts, filtro]);

  /* ─── handlers ─── */
  const toggleLike = useCallback(
    async (post: FeedPost) => {
      if (!user) return;
      const isLiked = likedPosts.has(post.id);
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (isLiked) next.delete(post.id);
        else next.add(post.id);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                total_curtidas: Math.max(0, p.total_curtidas + (isLiked ? -1 : 1)),
              }
            : p,
        ),
      );
      try {
        if (isLiked) {
          await supabase
            .from('parceiros_feed_curtidas')
            .delete()
            .eq('post_id', post.id)
            .eq('usuario_id', user.id);
        } else {
          await supabase.from('parceiros_feed_curtidas').insert({
            post_id: post.id,
            usuario_id: user.id,
          });
        }
      } catch {
        /* rollback silencioso */
      }
    },
    [user, likedPosts],
  );

  const coparCupom = useCallback(async (codigo: string) => {
    try {
      await navigator.clipboard.writeText(codigo);
    } catch {
      /* noop */
    }
    setCopiedCoupon(codigo);
    setTimeout(() => setCopiedCoupon(null), 2000);
  }, []);

  const compartilhar = useCallback(async (post: FeedPost) => {
    const url = `${window.location.origin}/parceiros/feed#${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.parceiro?.nome ?? 'DNA Baixada',
          text: post.conteudo,
          url,
        });
      } catch {
        /* cancelado */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copiado!');
      } catch {
        /* noop */
      }
    }
  }, []);

  const enviarComentario = useCallback(
    async (post: FeedPost, texto: string) => {
      if (!user || !profile || !texto.trim()) return;
      const novo: FeedComentario = {
        id: `tmp-${Date.now()}`,
        post_id: post.id,
        autor_id: user.id,
        conteudo: texto.trim(),
        total_curtidas: 0,
        ativo: true,
        created_at: new Date().toISOString(),
        autor: { nome: profile.nome, foto_url: profile.foto_url },
      };
      setComentariosPorPost((prev) => ({
        ...prev,
        [post.id]: [...(prev[post.id] ?? []), novo],
      }));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, total_comentarios: p.total_comentarios + 1 } : p,
        ),
      );
      try {
        const { error } = await supabase.from('parceiros_feed_comentarios').insert({
          post_id: post.id,
          autor_id: user.id,
          conteudo: texto.trim(),
        });
        if (error) throw error;
      } catch {
        /* mantém otimista */
      }
    },
    [user, profile],
  );

  const isParceiro = profile?.role === 'parceiro';

  /* ══════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════ */

  return (
    <>
      <SeoMeta
        title="Feed dos Parceiros"
        description="Acompanhe promoções, novidades e cupons dos parceiros DNA"
      />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <PremiumBreadcrumb current="Feed" parent="Parceiros" parentHref="/parceiros" />

        {/* ─── Hero ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-6 sm:p-8 mb-6 shadow-lg"
        >
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/5" />
          <div className="relative">
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
              Feed dos Parceiros
            </h1>
            <p className="mt-2 text-sm text-white/90 sm:text-base">
              Acompanhe promoções, novidades e cupons dos parceiros DNA
            </p>
            {isParceiro && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-md transition hover:bg-white/90"
              >
                <Plus className="h-4 w-4" />
                Criar Post
              </button>
            )}
          </div>
        </motion.div>

        {/* ─── Filtros ─── */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTROS.map((f) => {
            const active = filtro === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* ─── Lista de posts ─── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : postsFiltrados.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <MessageCircle className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-gray-500">Nenhum post encontrado neste filtro.</p>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-5">
            {postsFiltrados.map((post, idx) => (
              <PostCard
                key={post.id}
                post={post}
                index={idx}
                liked={likedPosts.has(post.id)}
                onToggleLike={() => toggleLike(post)}
                onCompartilhar={() => compartilhar(post)}
                onCopiarCupom={coparCupom}
                copiedCoupon={copiedCoupon}
                comentarios={comentariosPorPost[post.id]}
                expanded={expandedComments.has(post.id)}
                onExpandComentarios={async () => {
                  await carregarComentarios(post.id);
                  setExpandedComments((prev) => {
                    const next = new Set(prev);
                    if (next.has(post.id)) next.delete(post.id);
                    else next.add(post.id);
                    return next;
                  });
                }}
                onEnviarComentario={(t) => enviarComentario(post, t)}
                isLoggedIn={!!user}
                profileNome={profile?.nome}
                profileFoto={profile?.foto_url}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* ─── Modal criar post ─── */}
      <AnimatePresence>
        {showCreateModal && (
          <CreatePostModal onClose={() => setShowCreateModal(false)} onCreated={carregarFeed} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   POST CARD
   ══════════════════════════════════════════════════════════ */

interface PostCardProps {
  post: FeedPost;
  index: number;
  liked: boolean;
  onToggleLike: () => void;
  onCompartilhar: () => void;
  onCopiarCupom: (codigo: string) => void;
  copiedCoupon: string | null;
  comentarios?: FeedComentario[];
  expanded: boolean;
  onExpandComentarios: () => Promise<void>;
  onEnviarComentario: (texto: string) => void;
  isLoggedIn: boolean;
  profileNome?: string;
  profileFoto?: string | null;
}

function PostCard({
  post,
  index,
  liked,
  onToggleLike,
  onCompartilhar,
  onCopiarCupom,
  copiedCoupon,
  comentarios,
  expanded,
  onExpandComentarios,
  onEnviarComentario,
  isLoggedIn,
  profileNome,
  profileFoto,
}: PostCardProps) {
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [mostrarTodosComentarios, setMostrarTodosComentarios] = useState(false);
  const tipoLabel = FEED_POST_TIPO_LABELS[post.tipo];
  const parceiroNome = post.parceiro?.nome ?? 'Parceiro DNA';
  const parceiroFoto = post.parceiro?.foto_url;
  const comentariosLista = comentarios ?? [];
  const comentariosVisiveis = mostrarTodosComentarios
    ? comentariosLista
    : comentariosLista.slice(0, 2);

  const handleSubmitComentario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentarioTexto.trim()) return;
    onEnviarComentario(comentarioTexto);
    setComentarioTexto('');
  };

  return (
    <motion.article
      id={post.id}
      variants={fadeUp}
      custom={index}
      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary to-secondary">
          {parceiroFoto ? (
            <Image
              src={parceiroFoto}
              alt={parceiroNome}
              fill
              sizes="44px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-white">
              {iniciais(parceiroNome)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-bold text-gray-900">{parceiroNome}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tipoLabel.color}`}
            >
              {tipoLabel.label}
            </span>
            {post.fixado && (
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase text-accent-dark">
                📌 Fixado
              </span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {tempoRelativo(post.created_at)}
            </span>
            {post.cidade && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {post.cidade}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {post.conteudo && (
        <p className="px-4 pb-3 text-[15px] leading-relaxed text-gray-800 whitespace-pre-wrap">
          {post.conteudo}
        </p>
      )}

      {/* Vídeo */}
      {post.video_url && (
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          <video
            src={post.video_url}
            controls
            playsInline
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Galeria de imagens (se não tem vídeo) */}
      {!post.video_url && post.imagens && post.imagens.length > 0 && (
        <div className={`grid gap-0.5 ${post.imagens.length === 1 ? 'grid-cols-1' : post.imagens.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {post.imagens.slice(0, 4).map((img, idx) => (
            <div key={idx} className={`relative overflow-hidden bg-gray-100 ${post.imagens!.length === 3 && idx === 0 ? 'col-span-2 aspect-video' : 'aspect-square'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Foto ${idx + 1} de ${post.parceiro?.nome || ''}`} className="h-full w-full object-cover" />
              {idx === 3 && post.imagens!.length > 4 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="text-xl font-bold text-white">+{post.imagens!.length - 4}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Imagem única (fallback) */}
      {!post.video_url && !post.imagens?.length && post.imagem_url && (
        <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.imagem_url} alt={post.conteudo.slice(0, 60)} className="h-full w-full object-cover" />
        </div>
      )}

      {/* Cupom */}
      {post.codigo_cupom && (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20">
            <Ticket className="h-5 w-5 text-accent-dark" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-dark">
              Cupom de desconto
            </p>
            <p className="truncate font-mono text-lg font-extrabold text-gray-900">
              {post.codigo_cupom}
            </p>
          </div>
          <button
            onClick={() => onCopiarCupom(post.codigo_cupom!)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white transition hover:bg-accent-dark"
          >
            {copiedCoupon === post.codigo_cupom ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer interações */}
      <div className="flex items-center gap-1 border-t border-gray-100 px-2 py-2">
        <button
          onClick={onToggleLike}
          disabled={!isLoggedIn}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            liked ? 'text-accent2' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Heart className={`h-5 w-5 ${liked ? 'fill-accent2' : ''}`} />
          <span>{post.total_curtidas}</span>
        </button>
        <button
          onClick={onExpandComentarios}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          <MessageCircle className="h-5 w-5" />
          <span>{post.total_comentarios}</span>
        </button>
        <button
          onClick={onCompartilhar}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          <Share2 className="h-5 w-5" />
          <span className="hidden sm:inline">Compartilhar</span>
        </button>
      </div>

      {/* Comentários */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-gray-100 bg-gray-50/50"
          >
            <div className="space-y-2 p-4">
              {comentariosLista.length === 0 ? (
                <p className="py-2 text-center text-sm text-gray-400">
                  Seja o primeiro a comentar!
                </p>
              ) : (
                <>
                  {comentariosVisiveis.map((c) => (
                    <ComentarioItem key={c.id} comentario={c} />
                  ))}
                  {comentariosLista.length > 2 && (
                    <button
                      onClick={() => setMostrarTodosComentarios((v) => !v)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {mostrarTodosComentarios
                        ? 'Ver menos'
                        : `Ver todos os ${comentariosLista.length} comentários`}
                    </button>
                  )}
                </>
              )}

              {/* Input comentário */}
              {isLoggedIn && profileNome && (
                <form onSubmit={handleSubmitComentario} className="mt-2 flex items-center gap-2">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary to-secondary">
                    {profileFoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profileFoto}
                        alt={profileNome}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                        {iniciais(profileNome)}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={comentarioTexto}
                    onChange={(e) => setComentarioTexto(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="submit"
                    disabled={!comentarioTexto.trim()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/* ══════════════════════════════════════════════════════════
   COMENTÁRIO ITEM
   ══════════════════════════════════════════════════════════ */

function ComentarioItem({ comentario }: { comentario: FeedComentario }) {
  const autorNome = comentario.autor?.nome ?? 'Anônimo';
  const autorFoto = comentario.autor?.foto_url;
  return (
    <div className="flex items-start gap-2">
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary to-secondary">
        {autorFoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={autorFoto} alt={autorNome} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
            {iniciais(autorNome)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-sm bg-white px-3 py-2 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-bold text-gray-900">{autorNome}</p>
          <p className="text-sm text-gray-700">{comentario.conteudo}</p>
        </div>
        <p className="mt-1 pl-2 text-[10px] text-gray-400">
          {tempoRelativo(comentario.created_at)}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MODAL — Criar Post
   ══════════════════════════════════════════════════════════ */

interface CreatePostModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreatePostModal({ onClose, onCreated }: CreatePostModalProps) {
  const { user, profile } = useAuth();
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState<FeedPostTipo>('promocao');
  const [codigoCupom, setCodigoCupom] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [imagens, setImagens] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null, isVideo: boolean) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setErro(null);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'feed');
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erro no upload');
        }
        const data = await res.json();
        if (isVideo) {
          setVideoUrl(data.url);
        } else {
          setImagens((prev) => [...prev, data.url]);
        }
      }
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro no upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!conteudo.trim()) {
      setErro('Escreva o conteúdo do post.');
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      const payload = {
        parceiro_id: profile.id,
        conteudo: conteudo.trim(),
        tipo,
        imagem_url: imagens[0] || null,
        imagens: imagens.length > 0 ? imagens : null,
        video_url: videoUrl.trim() || null,
        codigo_cupom: codigoCupom.trim().toUpperCase() || null,
        cidade: profile.role === 'parceiro' ? 'Santos' : 'Santos',
        ativo: true,
        fixado: false,
        total_curtidas: 0,
        total_comentarios: 0,
        total_compartilhamentos: 0,
        total_visualizacoes: 0,
      };
      const { error } = await supabase.from('parceiros_feed_posts').insert(payload);
      if (error) throw error;
      onCreated();
      onClose();
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : 'Erro ao publicar post.');
    } finally {
      setSalvando(false);
    }
  };

  const removerImagem = (idx: number) => {
    setImagens((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-gray-900">Criar Post</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Tipo de post</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as FeedPostTipo)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              {(Object.keys(FEED_POST_TIPO_LABELS) as FeedPostTipo[]).map((t) => (
                <option key={t} value={t}>{FEED_POST_TIPO_LABELS[t].label}</option>
              ))}
            </select>
          </div>

          {/* Conteúdo */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Conteúdo</label>
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              rows={4}
              placeholder="O que você quer compartilhar?"
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Galeria de fotos */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              <ImageIcon className="mr-1 inline h-4 w-4" /> Fotos (até 4)
            </label>
            <div className="flex flex-wrap gap-2">
              {imagens.map((url, idx) => (
                <div key={idx} className="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removerImagem(idx)}
                    className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {imagens.length < 4 && (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-primary hover:text-primary">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                  <span className="mt-1 text-[10px]">Foto</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files, false)}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Vídeo */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              <Video className="mr-1 inline h-4 w-4" /> Vídeo (opcional, até 50MB)
            </label>
            {videoUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-gray-200">
                <video src={videoUrl} controls className="h-40 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setVideoUrl('')}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 py-4 text-gray-400 transition hover:border-primary hover:text-primary">
                {uploading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enviando vídeo... </>
                ) : (
                  <><Video className="mr-2 h-5 w-5" /> Selecionar vídeo (MP4, WebM)</>
                )}
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files, true)}
                />
              </label>
            )}
          </div>

          {/* Cupom */}
          {tipo === 'cupom' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                <Ticket className="mr-1 inline h-4 w-4" /> Código do cupom
              </label>
              <input
                type="text"
                value={codigoCupom}
                onChange={(e) => setCodigoCupom(e.target.value.toUpperCase())}
                placeholder="DNA15"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-mono uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}

          {erro && (
            <div className="rounded-xl bg-accent2/10 px-4 py-2.5 text-sm font-semibold text-accent2">{erro}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={salvando || uploading} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
              {salvando ? (<><Loader2 className="h-4 w-4 animate-spin" /> Publicando...</>) : (<><Plus className="h-4 w-4" /> Publicar</>)}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
