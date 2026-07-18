-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 15: Feed Mídia (vídeos + galeria de fotos)
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. ADICIONAR COLUNAS EM PARCEIROS_FEED_POSTS ───
ALTER TABLE public.parceiros_feed_posts
  ADD COLUMN IF NOT EXISTS imagens TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_thumbnail TEXT;

-- ─── 2. CRIAR BUCKET 'feed' NO STORAGE ───
INSERT INTO storage.buckets (id, name, public)
VALUES ('feed', 'feed', true)
ON CONFLICT (id) DO NOTHING;

-- ─── 3. POLÍTICAS DO BUCKET 'feed' ───
-- Upload: apenas usuários autenticados
CREATE POLICY "Feed bucket: upload autenticado"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'feed');

-- Leitura: público
CREATE POLICY "Feed bucket: leitura pública"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'feed');

-- Delete: apenas o dono
CREATE POLICY "Feed bucket: delete dono"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'feed' AND owner = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- FIM — Etapa 15
-- ═══════════════════════════════════════════════════════════════
