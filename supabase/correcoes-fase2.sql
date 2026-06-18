-- ═══════════════════════════════════════════════════════════════
-- CORREÇÕES FASE 2 — DNA Baixada
-- Data: 17/06/2026
-- Aplicar no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. ADICIONAR STATUS 'motorista_chegou' AO CHECK CONSTRAINT
-- O código usa esse status mas o constraint não o permite
ALTER TABLE public.corridas
  DROP CONSTRAINT IF EXISTS corridas_status_check;

ALTER TABLE public.corridas
  ADD CONSTRAINT corridas_status_check CHECK (status IN (
    'aguardando', 'aceita', 'motorista_chegou', 'em_andamento', 'finalizada', 'cancelada'
  ));

-- 2. ADICIONAR COLUNA CPF EM PROFILES
-- Necessária para pagamentos PIX (Mercado Pago exige CPF real)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf TEXT;

-- 3. CRIAR STORAGE BUCKETS (se não existirem)
-- O código faz upload mas os buckets nunca foram criados
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('documentos', 'documentos', false),
  ('veiculos', 'veiculos', true),
  ('parceiros', 'parceiros', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage (se não existirem)
DO $$
BEGIN
  -- avatars (público leitura, usuário escreve na própria pasta)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Qualquer um pode ver avatars') THEN
    CREATE POLICY "Qualquer um pode ver avatars"
      ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuario pode upload avatar') THEN
    CREATE POLICY "Usuario pode upload avatar"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuario pode atualizar avatar') THEN
    CREATE POLICY "Usuario pode atualizar avatar"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- documentos (privado)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Motorista pode ver proprios documentos') THEN
    CREATE POLICY "Motorista pode ver proprios documentos"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Motorista pode upload documentos') THEN
    CREATE POLICY "Motorista pode upload documentos"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- veiculos (público leitura)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Qualquer um pode ver fotos de veiculos') THEN
    CREATE POLICY "Qualquer um pode ver fotos de veiculos"
      ON storage.objects FOR SELECT USING (bucket_id = 'veiculos');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Motorista pode upload foto veiculo') THEN
    CREATE POLICY "Motorista pode upload foto veiculo"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'veiculos' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  -- parceiros (público leitura)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Qualquer um pode ver fotos de parceiros') THEN
    CREATE POLICY "Qualquer um pode ver fotos de parceiros"
      ON storage.objects FOR SELECT USING (bucket_id = 'parceiros');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Parceiro pode upload foto') THEN
    CREATE POLICY "Parceiro pode upload foto"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'parceiros' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;

-- 4. RLS POLICIES FALTANTES PARA TRANSACOES
-- O webhook e o fluxo de PIX precisam de INSERT e UPDATE

-- Permitir que usuário crie suas próprias transações
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuario pode criar propria transacao') THEN
    CREATE POLICY "Usuario pode criar propria transacao"
      ON public.transacoes FOR INSERT
      WITH CHECK (auth.uid() = usuario_id);
  END IF;

  -- Permitir que o service role (webhook) atualize transações
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role pode atualizar transacao') THEN
    CREATE POLICY "Service role pode atualizar transacao"
      ON public.transacoes FOR UPDATE
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 5. RLS POLICY FALTANTE PARA NOTIFICACOES (INSERT)
-- O webhook precisa criar notificações para motoristas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuario pode criar propria notificacao') THEN
    CREATE POLICY "Usuario pode criar propria notificacao"
      ON public.notificacoes FOR INSERT
      WITH CHECK (auth.uid() = usuario_id);
  END IF;
END $$;

-- 6. CRIAR TABELAS FALTANTES: indicacoes e push_subscriptions

-- Tabela de indicações (sistema de referral)
CREATE TABLE IF NOT EXISTS public.indicacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  indicado_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  codigo_indicacao TEXT UNIQUE NOT NULL,
  email_indicado TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'cadastrado', 'concluida', 'cancelada')),
  pontos_ganhos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_indicacoes_indicador ON public.indicacoes(indicador_id);
CREATE INDEX IF NOT EXISTS idx_indicacoes_codigo ON public.indicacoes(codigo_indicacao);

ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuario pode ver proprias indicacoes' AND tablename = 'indicacoes') THEN
    CREATE POLICY "Usuario pode ver proprias indicacoes"
      ON public.indicacoes FOR SELECT
      USING (auth.uid() = indicador_id OR auth.uid() = indicado_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuario pode criar indicacao' AND tablename = 'indicacoes') THEN
    CREATE POLICY "Usuario pode criar indicacao"
      ON public.indicacoes FOR INSERT
      WITH CHECK (auth.uid() = indicador_id);
  END IF;
END $$;

-- Tabela de push subscriptions (notificações push web)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_usuario ON public.push_subscriptions(usuario_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuario pode ver proprias push subs' AND tablename = 'push_subscriptions') THEN
    CREATE POLICY "Usuario pode ver proprias push subs"
      ON public.push_subscriptions FOR SELECT
      USING (auth.uid() = usuario_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuario pode criar push sub' AND tablename = 'push_subscriptions') THEN
    CREATE POLICY "Usuario pode criar push sub"
      ON public.push_subscriptions FOR INSERT
      WITH CHECK (auth.uid() = usuario_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuario pode deletar push sub' AND tablename = 'push_subscriptions') THEN
    CREATE POLICY "Usuario pode deletar push sub"
      ON public.push_subscriptions FOR DELETE
      USING (auth.uid() = usuario_id);
  END IF;
END $$;

-- 7. FUNÇÃO is_admin() SECURITY DEFINER (evita recursão infinita em policies admin)
-- Substitui queries que referenciam profiles dentro de policies de profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Trigger para updated_at em indicacoes
CREATE OR REPLACE TRIGGER indicacoes_updated_at
  BEFORE UPDATE ON public.indicacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
