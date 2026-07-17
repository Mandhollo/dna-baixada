-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 13: MÓDULO PREMIUM (Fase 4)
-- Segurança + Painel Financeiro Pro + Motorista Guia
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA CORRIDA_SOS (Botão SOS) ───
CREATE TABLE IF NOT EXISTS public.corrida_sos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corrida_id UUID REFERENCES public.corridas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  tipo TEXT NOT NULL CHECK (tipo IN (
    'medico', 'policia', 'pane', 'acidente', 'ameaca', 'outro'
  )),

  descricao TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN (
    'ativo', 'resolvido', 'falso_alerta', 'cancelado'
  )),

  atendido_por UUID REFERENCES public.profiles(id),
  atendido_em TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corrida_sos_usuario
  ON public.corrida_sos(usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_corrida_sos_corrida
  ON public.corrida_sos(corrida_id);
CREATE INDEX IF NOT EXISTS idx_corrida_sos_status
  ON public.corrida_sos(status) WHERE status = 'ativo';

-- ─── 2. TABELA CORRIDA_COMPARTILHADA ───
CREATE TABLE IF NOT EXISTS public.corrida_compartilhada (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corrida_id UUID NOT NULL REFERENCES public.corridas(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  contato_nome TEXT NOT NULL,
  contato_telefone TEXT NOT NULL,

  token TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,

  visualizacoes INTEGER NOT NULL DEFAULT 0,
  ultima_visualizacao TIMESTAMPTZ,

  expira_em TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corrida_compartilhada_corrida
  ON public.corrida_compartilhada(corrida_id);
CREATE INDEX IF NOT EXISTS idx_corrida_compartilhada_token
  ON public.corrida_compartilhada(token);

-- ─── 3. TABELA MOTORISTA_GUIA ───
-- Categoria premium para motoristas que fazem passeios turísticos
CREATE TABLE IF NOT EXISTS public.motorista_guia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motorista_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Status do guia
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'aprovado', 'rejeitado', 'suspenso'
  )),

  -- Idiomas falados
  idiomas TEXT[] NOT NULL DEFAULT '{}',

  -- Especialidades
  especialidades TEXT[] NOT NULL DEFAULT '{}',

  -- Conhecimento histórico/cultural
  bio TEXT,
  areas_atuacao TEXT[] DEFAULT '{}',

  -- Certificações
  certificacoes JSONB DEFAULT '[]',

  -- Passeios oferecidos
  passeios JSONB DEFAULT '[]',

  -- Avaliações específicas como guia
  avaliacao_guia NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  total_passeios INTEGER NOT NULL DEFAULT 0,
  ganho_passeios NUMERIC(12,2) NOT NULL DEFAULT 0.00,

  -- Tarifa diferenciada (opcional)
  tarifa_hora NUMERIC(10,2),

  -- Verificação
  verificado BOOLEAN NOT NULL DEFAULT false,
  verificado_em TIMESTAMPTZ,

  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motorista_guia_status
  ON public.motorista_guia(status, ativo);
CREATE INDEX IF NOT EXISTS idx_motorista_guia_idiomas
  ON public.motorista_guia USING GIN(idiomas);

-- ─── 4. TABELA FINANCEIRO_RELATORIOS ───
-- Relatórios mensais salvos para motoristas DNA Pass
CREATE TABLE IF NOT EXISTS public.financeiro_relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motorista_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  periodo TEXT NOT NULL,  -- "2026-07" (ano-mês)

  -- Resumo
  total_corridas INTEGER NOT NULL DEFAULT 0,
  faturamento_bruto NUMERIC(12,2) NOT NULL DEFAULT 0,
  faturamento_liquido NUMERIC(12,2) NOT NULL DEFAULT 0,
  comissao_paga NUMERIC(12,2) NOT NULL DEFAULT 0,
  ticket_medio NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_por_km NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Tempo
  tempo_online_horas NUMERIC(8,2) DEFAULT 0,
  tempo_corrida_horas NUMERIC(8,2) DEFAULT 0,
  tempo_ocioso_horas NUMERIC(8,2) DEFAULT 0,

  -- Breakdown por tipo de corrida
  corridas_por_tipo JSONB DEFAULT '{}',

  -- Comparação
  comparacao_mes_anterior NUMERIC(5,2),  -- % de crescimento/queda

  -- PDF
  pdf_url TEXT,
  gerado_em TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(motorista_id, periodo)
);

CREATE INDEX IF NOT EXISTS idx_financeiro_relatorios_motorista
  ON public.financeiro_relatorios(motorista_id, periodo DESC);

-- ═══════════════════════════════════════════════════════════════
-- SEED — Motorista Guia
-- ═══════════════════════════════════════════════════════════════

-- (Seed de motorista_guia será feito quando houver motoristas reais cadastrados)

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS + RLS
-- ═══════════════════════════════════════════════════════════════

CREATE TRIGGER corrida_sos_updated_at
  BEFORE UPDATE ON public.corrida_sos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER corrida_compartilhada_updated_at
  BEFORE UPDATE ON public.corrida_compartilhada
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER motorista_guia_updated_at
  BEFORE UPDATE ON public.motorista_guia
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.corrida_sos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corrida_compartilhada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorista_guia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_relatorios ENABLE ROW LEVEL SECURITY;

-- SOS
CREATE POLICY "Usuário vê próprios SOS"
  ON public.corrida_sos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuário cria SOS"
  ON public.corrida_sos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admin vê todos SOS"
  ON public.corrida_sos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin atende SOS"
  ON public.corrida_sos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Compartilhamento
CREATE POLICY "Usuário gerencia própria corrida compartilhada"
  ON public.corrida_compartilhada FOR ALL
  USING (auth.uid() = usuario_id);

-- Token público (para o contato visualizar a corrida)
CREATE POLICY "Token de corrida compartilhada é público"
  ON public.corrida_compartilhada FOR SELECT
  USING (ativo = true AND expira_em > now());

-- Motorista Guia
CREATE POLICY "Guias aprovados visíveis para logados"
  ON public.motorista_guia FOR SELECT
  USING (auth.uid() IS NOT NULL AND status = 'aprovado' AND ativo = true);

CREATE POLICY "Motorista vê próprio perfil de guia"
  ON public.motorista_guia FOR SELECT
  USING (auth.uid() = motorista_id);

CREATE POLICY "Motorista cria perfil de guia"
  ON public.motorista_guia FOR INSERT
  WITH CHECK (auth.uid() = motorista_id);

CREATE POLICY "Motorista atualiza próprio perfil de guia"
  ON public.motorista_guia FOR UPDATE
  USING (auth.uid() = motorista_id);

CREATE POLICY "Admin gerencia guias"
  ON public.motorista_guia FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Relatórios Financeiros
CREATE POLICY "Motorista vê próprios relatórios"
  ON public.financeiro_relatorios FOR SELECT
  USING (auth.uid() = motorista_id);

CREATE POLICY "Admin gerencia relatórios"
  ON public.financeiro_relatorios FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ═══════════════════════════════════════════════════════════════
-- FIM — Etapa 13: Módulo Premium (Fase 4)
-- ═══════════════════════════════════════════════════════════════
