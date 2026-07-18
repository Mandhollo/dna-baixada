-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 14: FEED DE PARCEIROS
-- Posts estilo rede social para parceiros publicarem promoções
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA PARCEIROS_FEED_POSTS ───
CREATE TABLE IF NOT EXISTS public.parceiros_feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Quem postou
  parceiro_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  estabelecimento_id UUID REFERENCES public.estabelecimentos(id) ON DELETE SET NULL,

  -- Conteúdo
  conteudo TEXT NOT NULL,
  imagem_url TEXT,

  -- Tipo de post
  tipo TEXT NOT NULL DEFAULT 'promocao' CHECK (tipo IN (
    'promocao', 'novidade', 'evento', 'produto_novo', 'cupom', 'geral'
  )),

  -- Link opcional (para promoção/cupom)
  link TEXT,

  -- Cupom (se aplicável)
  codigo_cupom TEXT,

  -- Localização
  cidade TEXT DEFAULT 'Santos',

  -- Interações
  total_curtidas INTEGER NOT NULL DEFAULT 0,
  total_comentarios INTEGER NOT NULL DEFAULT 0,
  total_compartilhamentos INTEGER NOT NULL DEFAULT 0,
  total_visualizacoes INTEGER NOT NULL DEFAULT 0,

  -- Status
  ativo BOOLEAN NOT NULL DEFAULT true,
  fixado BOOLEAN NOT NULL DEFAULT false,

  -- Denúncias
  denuncias_count INTEGER NOT NULL DEFAULT 0,
  oculto BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_posts_parceiro
  ON public.parceiros_feed_posts(parceiro_id, ativo);
CREATE INDEX IF NOT EXISTS idx_feed_posts_recente
  ON public.parceiros_feed_posts(created_at DESC) WHERE ativo = true;
CREATE INDEX IF NOT EXISTS idx_feed_posts_tipo
  ON public.parceiros_feed_posts(tipo, ativo);
CREATE INDEX IF NOT EXISTS idx_feed_posts_cidade
  ON public.parceiros_feed_posts(cidade, ativo);

-- ─── 2. TABELA PARCEIROS_FEED_CURTIDAS ───
CREATE TABLE IF NOT EXISTS public.parceiros_feed_curtidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.parceiros_feed_posts(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(post_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_curtidas_post
  ON public.parceiros_feed_curtidas(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_curtidas_usuario
  ON public.parceiros_feed_curtidas(usuario_id);

-- ─── 3. TABELA PARCEIROS_FEED_COMENTARIOS ───
CREATE TABLE IF NOT EXISTS public.parceiros_feed_comentarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.parceiros_feed_posts(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  conteudo TEXT NOT NULL,
  imagem_url TEXT,

  total_curtidas INTEGER NOT NULL DEFAULT 0,
  resposta_para UUID REFERENCES public.parceiros_feed_comentarios(id) ON DELETE SET NULL,

  ativo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_comentarios_post
  ON public.parceiros_feed_comentarios(post_id, ativo);
CREATE INDEX IF NOT EXISTS idx_feed_comentarios_autor
  ON public.parceiros_feed_comentarios(autor_id);

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════

-- Usamos um parceiro fictício (profile com role='parceiro')
-- Como não temos IDs reais, criamos posts com parceiro_id NULL permitido via trigger
-- Em produção, os posts são criados pelos próprios parceiros logados

-- Seed não pode ser inserido sem um parceiro_id válido (FK constraint)
-- O seed será populado naturalmente quando parceiros começarem a postar

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════

CREATE TRIGGER feed_posts_updated_at
  BEFORE UPDATE ON public.parceiros_feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER feed_comentarios_updated_at
  BEFORE UPDATE ON public.parceiros_feed_comentarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Incrementar total_curtidas ao curtir
CREATE OR REPLACE FUNCTION public.incrementar_curtida_feed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.parceiros_feed_posts
  SET total_curtidas = total_curtidas + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_feed_curtida_insert
  AFTER INSERT ON public.parceiros_feed_curtidas
  FOR EACH ROW EXECUTE FUNCTION public.incrementar_curtida_feed();

-- Decrementar ao descurtir
CREATE OR REPLACE FUNCTION public.decrementar_curtida_feed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.parceiros_feed_posts
  SET total_curtidas = GREATEST(0, total_curtidas - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_feed_curtida_delete
  AFTER DELETE ON public.parceiros_feed_curtidas
  FOR EACH ROW EXECUTE FUNCTION public.decrementar_curtida_feed();

-- Incrementar total_comentarios ao comentar
CREATE OR REPLACE FUNCTION public.incrementar_comentario_feed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.parceiros_feed_posts
  SET total_comentarios = total_comentarios + 1
  WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_feed_comentario_insert
  AFTER INSERT ON public.parceiros_feed_comentarios
  FOR EACH ROW EXECUTE FUNCTION public.incrementar_comentario_feed();

-- ═══════════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.parceiros_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parceiros_feed_curtidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parceiros_feed_comentarios ENABLE ROW LEVEL SECURITY;

-- Posts: visíveis para logados
CREATE POLICY "Feed posts visíveis para logados"
  ON public.parceiros_feed_posts FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true AND NOT oculto);

-- Parceiro cria/edita próprios posts
CREATE POLICY "Parceiro cria próprios posts"
  ON public.parceiros_feed_posts FOR INSERT
  WITH CHECK (auth.uid() = parceiro_id);

CREATE POLICY "Parceiro edita próprios posts"
  ON public.parceiros_feed_posts FOR UPDATE
  USING (auth.uid() = parceiro_id);

-- Admin gerencia todos os posts
CREATE POLICY "Admin gerencia feed posts"
  ON public.parceiros_feed_posts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Curtidas: qualquer logado pode ver
CREATE POLICY "Curtidas visíveis para logados"
  ON public.parceiros_feed_curtidas FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Usuário curte/descurte
CREATE POLICY "Usuário curte post"
  ON public.parceiros_feed_curtidas FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuário remove curtida"
  ON public.parceiros_feed_curtidas FOR DELETE
  USING (auth.uid() = usuario_id);

-- Comentários: visíveis para logados
CREATE POLICY "Comentários visíveis para logados"
  ON public.parceiros_feed_comentarios FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

-- Usuário cria comentário
CREATE POLICY "Usuário cria comentário"
  ON public.parceiros_feed_comentarios FOR INSERT
  WITH CHECK (auth.uid() = autor_id);

-- Autor edita/removes próprio comentário
CREATE POLICY "Autor edita próprio comentário"
  ON public.parceiros_feed_comentarios FOR UPDATE
  USING (auth.uid() = autor_id);

CREATE POLICY "Autor remove próprio comentário"
  ON public.parceiros_feed_comentarios FOR DELETE
  USING (auth.uid() = autor_id);

-- Admin modera comentários
CREATE POLICY "Admin modera comentários"
  ON public.parceiros_feed_comentarios FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ═══════════════════════════════════════════════════════════════
-- FIM — Etapa 14: FEED DE PARCEIROS
-- ═══════════════════════════════════════════════════════════════
