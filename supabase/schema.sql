-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Schema do Banco de Dados
-- Executar no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA PROFILES ───
-- Perfil base de todo usuário (passageiro, motorista, parceiro, admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  foto_url TEXT,
  role TEXT NOT NULL DEFAULT 'passageiro' CHECK (role IN ('passageiro', 'motorista', 'parceiro', 'admin')),
  pontos INTEGER NOT NULL DEFAULT 0,
  avaliacao_media NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  total_avaliacoes INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ─── 2. TABELA MOTORISTAS ───
-- Dados específicos do motorista
CREATE TABLE IF NOT EXISTS public.motoristas (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  cnh_numero TEXT NOT NULL,
  cnh_foto_url TEXT,
  veiculo_modelo TEXT NOT NULL,
  veiculo_placa TEXT NOT NULL,
  veiculo_cor TEXT,
  veiculo_ano INTEGER,
  veiculo_lugares INTEGER NOT NULL DEFAULT 4,
  veiculo_foto_url TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'suspenso')),
  cidade_base TEXT NOT NULL DEFAULT 'Santos',
  disponivel BOOLEAN NOT NULL DEFAULT false,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  total_corridas INTEGER NOT NULL DEFAULT 0,
  ganho_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motoristas_status ON public.motoristas(status);
CREATE INDEX IF NOT EXISTS idx_motoristas_disponivel ON public.motoristas(disponivel);
CREATE INDEX IF NOT EXISTS idx_motoristas_cidade ON public.motoristas(cidade_base);

-- ─── 3. TABELA PARCEIROS ───
-- Dados do parceiro comercial
CREATE TABLE IF NOT EXISTS public.parceiros (
  id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  cnpj TEXT,
  nome_fantasia TEXT NOT NULL,
  razao_social TEXT,
  categoria TEXT NOT NULL,
  descricao TEXT,
  endereco TEXT,
  cidade TEXT NOT NULL DEFAULT 'Santos',
  telefone_comercial TEXT,
  site_url TEXT,
  foto_url TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'suspenso')),
  avaliacao_media NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  total_avaliacoes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parceiros_status ON public.parceiros(status);
CREATE INDEX IF NOT EXISTS idx_parceiros_categoria ON public.parceiros(categoria);
CREATE INDEX IF NOT EXISTS idx_parceiros_cidade ON public.parceiros(cidade);

-- ─── 4. FUNÇÃO: Auto-criar profile ao registrar ───
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, telefone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'telefone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'passageiro')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: toda vez que um usuário é criado no auth.users, cria o profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 5. FUNÇÃO: Auto-criar motorista/parceiro conforme role ───
CREATE OR REPLACE FUNCTION public.handle_new_role_profile()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'passageiro');

  -- Só cria na tabela motoristas se o role for motorista
  IF user_role = 'motorista' THEN
    INSERT INTO public.motoristas (id, cnh_numero, veiculo_modelo, veiculo_placa, veiculo_lugares, cidade_base)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'cnh', 'PENDENTE'),
      COALESCE(NEW.raw_user_meta_data->>'veiculo_modelo', 'PENDENTE'),
      COALESCE(NEW.raw_user_meta_data->>'veiculo_placa', 'PENDENTE'),
      COALESCE((NEW.raw_user_meta_data->>'veiculo_lugares')::INTEGER, 4),
      COALESCE(NEW.raw_user_meta_data->>'cidade_base', 'Santos')
    );
  END IF;

  -- Só cria na tabela parceiros se o role for parceiro
  IF user_role = 'parceiro' THEN
    INSERT INTO public.parceiros (id, nome_fantasia, categoria, cidade)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome_fantasia', COALESCE(NEW.raw_user_meta_data->>'nome', '')),
      COALESCE(NEW.raw_user_meta_data->>'categoria', 'outro'),
      COALESCE(NEW.raw_user_meta_data->>'cidade', 'Santos')
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_role_profile();

-- ─── 6. FUNÇÃO: Atualizar updated_at automaticamente ───
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER motoristas_updated_at
  BEFORE UPDATE ON public.motoristas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER parceiros_updated_at
  BEFORE UPDATE ON public.parceiros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- 7. RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motoristas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parceiros ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES: políticas ───

-- Qualquer usuário logado pode ver profiles
CREATE POLICY "Profiles são visíveis para usuários logados"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Usuário pode ver o próprio profile
CREATE POLICY "Usuário pode ver próprio profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuário pode atualizar o próprio profile
CREATE POLICY "Usuário pode atualizar próprio profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profile é criado via trigger (SERVICE_ROLE), não precisa de INSERT policy
-- Mas adicionamos para segurança:
CREATE POLICY "Usuário pode inserir próprio profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── MOTORISTAS: políticas ───

-- Usuários logados podem ver motoristas aprovados
CREATE POLICY "Motoristas aprovados são visíveis"
  ON public.motoristas FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      status = 'aprovado' OR auth.uid() = id
    )
  );

-- Motorista pode atualizar próprio registro
CREATE POLICY "Motorista pode atualizar próprio registro"
  ON public.motoristas FOR UPDATE
  USING (auth.uid() = id);

-- Motorista pode inserir próprio registro (via trigger)
CREATE POLICY "Motorista pode inserir próprio registro"
  ON public.motoristas FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ─── PARCEIROS: políticas ───

-- Usuários logados podem ver parceiros aprovados
CREATE POLICY "Parceiros aprovados são visíveis"
  ON public.parceiros FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      status = 'aprovado' OR auth.uid() = id
    )
  );

-- Parceiro pode atualizar próprio registro
CREATE POLICY "Parceiro pode atualizar próprio registro"
  ON public.parceiros FOR UPDATE
  USING (auth.uid() = id);

-- Parceiro pode inserir próprio registro (via trigger)
CREATE POLICY "Parceiro pode inserir próprio registro"
  ON public.parceiros FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════
-- 8. STORAGE BUCKETS (fotos e documentos)
-- ═══════════════════════════════════════════════════════════════

-- Bucket para fotos de perfil
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- Bucket para documentos (CNH, etc)
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', false) ON CONFLICT DO NOTHING;

-- Bucket para fotos de veículos
INSERT INTO storage.buckets (id, name, public) VALUES ('veiculos', 'veiculos', true) ON CONFLICT DO NOTHING;

-- Bucket para fotos de parceiros
INSERT INTO storage.buckets (id, name, public) VALUES ('parceiros', 'parceiros', true) ON CONFLICT DO NOTHING;

-- Políticas de storage: avatars
CREATE POLICY "Qualquer um pode ver avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Usuário pode upload próprio avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuário pode atualizar próprio avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas de storage: documentos (privado)
CREATE POLICY "Motorista pode ver próprios documentos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Motorista pode upload próprios documentos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documentos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas de storage: veiculos
CREATE POLICY "Qualquer um pode ver fotos de veículos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'veiculos');

CREATE POLICY "Motorista pode upload foto do próprio veículo"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'veiculos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas de storage: parceiros
CREATE POLICY "Qualquer um pode ver fotos de parceiros"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'parceiros');

CREATE POLICY "Parceiro pode upload própria foto"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'parceiros' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ═══════════════════════════════════════════════════════════════
-- PRONTO! Banco configurado.
-- Próximo passo: configurar .env.local com as credenciais
-- ═══════════════════════════════════════════════════════════════
