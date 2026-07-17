-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 10: MÓDULO PREMIUM (Fase 1)
-- Tabelas: motoristas_fundadores, motorista_niveis,
--          motorista_nivel_atual, dna_pass_planos,
--          dna_pass_assinaturas, dna_pass_beneficios
-- + Seed data + RLS + Views + Funções
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA MOTORISTAS FUNDADORES ───
-- Programa exclusivo para os primeiros motoristas cadastrados
CREATE TABLE IF NOT EXISTS public.motoristas_fundadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Qual motorista
  motorista_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Número sequencial do fundador (1, 2, 3...)
  numero_fundador INTEGER NOT NULL UNIQUE,

  -- Status do selo
  selo_ativo BOOLEAN NOT NULL DEFAULT true,

  -- Quando entrou no programa
  data_ingresso TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Certificado digital (URL do PDF gerado)
  certificado_url TEXT,

  -- Quando o certificado foi emitido
  certificado_emitido_em TIMESTAMPTZ,

  -- Reconhecimento público (aparece no app)
  reconhecimento_publico BOOLEAN NOT NULL DEFAULT true,

  -- Observações internas (admin)
  observacoes TEXT,

  -- Metadata flexível
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_motoristas_fundadores_motorista
  ON public.motoristas_fundadores(motorista_id);
CREATE INDEX IF NOT EXISTS idx_motoristas_fundadores_numero
  ON public.motoristas_fundadores(numero_fundador);
CREATE INDEX IF NOT EXISTS idx_motoristas_fundadores_ativo
  ON public.motoristas_fundadores(selo_ativo);

-- ─── 2. TABELA MOTORISTA_NIVEIS (definições dos níveis) ───
CREATE TABLE IF NOT EXISTS public.motorista_niveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome TEXT NOT NULL,  -- Bronze, Prata, Ouro, Platinum, Elite
  slug TEXT NOT NULL UNIQUE,

  -- Ordem hierárquica (1 = mais baixo)
  ordem INTEGER NOT NULL,

  -- Identidade visual
  cor_hex TEXT NOT NULL,       -- #CD7F32, #C0C0C0, #FFD700, #E5E4E2, #00CEC9
  cor_gradiente TEXT NOT NULL, -- "from-... to-..." para Tailwind
  icone TEXT NOT NULL,         -- nome do ícone lucide

  -- Critérios mínimos para alcançar este nível
  avaliacao_minima NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  tempo_plataforma_meses INTEGER NOT NULL DEFAULT 0,
  corridas_minimas INTEGER NOT NULL DEFAULT 0,
  taxa_cancelamento_maxima NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  treinamentos_minimos INTEGER NOT NULL DEFAULT 0,

  -- Benefícios deste nível (array)
  beneficios TEXT[] NOT NULL DEFAULT '{}',

  -- Comissão reduzida deste nível (vs padrão)
  comissao_percentual NUMERIC(5,2),  -- ex: 15.00 = 15% de comissão (vs 20% padrão)

  -- Prioridade na distribuição de corridas (1 = mais alta)
  prioridade_corridas INTEGER NOT NULL DEFAULT 5,

  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motorista_niveis_ordem
  ON public.motorista_niveis(ordem);

-- ─── 3. TABELA MOTORISTA_NIVEL_ATUAL (progresso de cada motorista) ───
CREATE TABLE IF NOT EXISTS public.motorista_nivel_atual (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  motorista_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Nível atual
  nivel_atual TEXT NOT NULL DEFAULT 'Bronze',

  -- Próximo nível (para mostrar progresso)
  nivel_destino TEXT,

  -- Progresso percentual rumo ao próximo nível (0-100)
  progresso_percentual INTEGER NOT NULL DEFAULT 0 CHECK (progresso_percentual >= 0 AND progresso_percentual <= 100),

  -- Métricas atuais do motorista (snapshot)
  avaliacao_atual NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  tempo_plataforma_meses INTEGER NOT NULL DEFAULT 0,
  total_corridas INTEGER NOT NULL DEFAULT 0,
  taxa_cancelamento NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  treinamentos_concluidos INTEGER NOT NULL DEFAULT 0,
  pontualidade_percentual NUMERIC(5,2) NOT NULL DEFAULT 100.00,

  -- Quando subiu de nível
  nivel_alcancado_em TIMESTAMPTZ,

  -- Quando foi atualizado pela última vez (snapshot)
  snapshot_em TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_motorista_nivel_atual_motorista
  ON public.motorista_nivel_atual(motorista_id);
CREATE INDEX IF NOT EXISTS idx_motorista_nivel_atual_nivel
  ON public.motorista_nivel_atual(nivel_atual);

-- ─── 4. TABELA DNA_PASS_PLANOS ───
CREATE TABLE IF NOT EXISTS public.dna_pass_planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome TEXT NOT NULL,        -- Mensal, Trimestral, Anual
  slug TEXT NOT NULL UNIQUE,

  -- Preços
  preco_mensal NUMERIC(10,2) NOT NULL,  -- preço mensal equivalente
  preco_total NUMERIC(10,2) NOT NULL,   -- preço cobrado (total do período)
  desconto_percentual NUMERIC(5,2) NOT NULL DEFAULT 0, -- vs mensal

  -- Período
  periodo_meses INTEGER NOT NULL DEFAULT 1,

  descricao TEXT NOT NULL,
  descricao_curta TEXT,

  -- Destaque visual
  destaque BOOLEAN NOT NULL DEFAULT false,
  badge TEXT,  -- ex: "Mais Popular", "Melhor Custo-Benefício"

  -- Cor do plano
  cor_hex TEXT NOT NULL DEFAULT '#0A2463',

  ativo BOOLEAN NOT NULL DEFAULT true,

  ordem INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dna_pass_planos_ativo
  ON public.dna_pass_planos(ativo, ordem);

-- ─── 5. TABELA DNA_PASS_BENEFICIOS ───
-- Benefícios que vêm com a assinatura DNA Pass
CREATE TABLE IF NOT EXISTS public.dna_pass_beneficios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  icone TEXT NOT NULL DEFAULT 'check',

  -- Se aplicável a um plano específico (null = todos os planos)
  plano_id UUID REFERENCES public.dna_pass_planos(id) ON DELETE SET NULL,

  -- Categoria do benefício
  categoria TEXT NOT NULL DEFAULT 'geral' CHECK (categoria IN (
    'comissao', 'prioridade', 'desconto', 'suporte', 'exclusivo', 'geral'
  )),

  -- Valor associado (ex: "15%" de desconto, "5%" comissão reduzida)
  valor TEXT,

  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dna_pass_beneficios_plano
  ON public.dna_pass_beneficios(plano_id);
CREATE INDEX IF NOT EXISTS idx_dna_pass_beneficios_ativo
  ON public.dna_pass_beneficios(ativo, ordem);

-- ─── 6. TABELA DNA_PASS_ASSINATURAS ───
CREATE TABLE IF NOT EXISTS public.dna_pass_assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  motorista_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plano_id UUID NOT NULL REFERENCES public.dna_pass_planos(id) ON DELETE RESTRICT,

  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN (
    'trial', 'ativa', 'cancelada', 'expirada', 'suspendida'
  )),

  inicio_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  fim_em TIMESTAMPTZ NOT NULL,
  proxima_cobranca TIMESTAMPTZ,

  auto_renovar BOOLEAN NOT NULL DEFAULT true,
  metodo_pagamento TEXT CHECK (metodo_pagamento IN ('pix', 'cartao', 'boleto')),

  -- Preço que foi pago (snapshot do plano no momento da assinatura)
  valor_pago NUMERIC(10,2) NOT NULL,

  -- Dados de cancelamento
  cancelado_em TIMESTAMPTZ,
  motivo_cancelamento TEXT,

  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dna_pass_assinaturas_motorista
  ON public.dna_pass_assinaturas(motorista_id);
CREATE INDEX IF NOT EXISTS idx_dna_pass_assinaturas_status
  ON public.dna_pass_assinaturas(status);
CREATE INDEX IF NOT EXISTS idx_dna_pass_assinaturas_ativa
  ON public.dna_pass_assinaturas(motorista_id, status);


-- ═══════════════════════════════════════════════════════════════
-- 7. SEED DATA — Níveis de Motorista
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.motorista_niveis
  (nome, slug, ordem, cor_hex, cor_gradiente, icone,
   avaliacao_minima, tempo_plataforma_meses, corridas_minimas,
   taxa_cancelamento_maxima, treinamentos_minimos,
   beneficios, comissao_percentual, prioridade_corridas, descricao)
VALUES
-- Nível 1: Bronze (entrada)
(
  'Bronze', 'bronze', 1,
  '#CD7F32', 'from-orange-700 to-amber-800', 'shield',
  4.00, 0, 0, 100.00, 0,
  ARRAY['Acesso à plataforma', 'Central de Benefícios básica', 'Suporte por chat'],
  20.00, 5,
  'Todos os motoristas começam aqui. O primeiro passo da sua jornada DNA.'
),
-- Nível 2: Prata
(
  'Prata', 'prata', 2,
  '#C0C0C0', 'from-gray-400 to-gray-600', 'shield-check',
  4.30, 1, 50, 15.00, 1,
  ARRAY['Comissão reduzida (18%)', 'Maior visibilidade no app', 'Acesso a cursos básicos', 'Metas personalizadas'],
  18.00, 4,
  'Motorista em evolução, com boas avaliações e dedicação à plataforma.'
),
-- Nível 3: Ouro
(
  'Ouro', 'ouro', 3,
  '#FFD700', 'from-yellow-400 to-amber-600', 'award',
  4.60, 3, 200, 10.00, 3,
  ARRAY['Comissão reduzida (16%)', 'Prioridade em corridas executivas', 'Selo DNA Ouro no perfil', 'Cursos avançados liberados', 'Suporte prioritário'],
  16.00, 3,
  'Motorista de excelência, reconhecido pela qualidade e consistência.'
),
-- Nível 4: Platinum
(
  'Platinum', 'platinum', 4,
  '#E5E4E2', 'from-slate-300 to-slate-500', 'crown',
  4.80, 6, 500, 7.00, 5,
  ARRAY['Comissão reduzida (14%)', 'Acesso a transfer de cruzeiros', 'Destaque na busca de passageiros', 'Convênios premium', 'Motorista Guia liberado', 'Reuniões com a equipe DNA'],
  14.00, 2,
  'Elite dos motoristas DNA. Acesso a oportunidades exclusivas e alta visibilidade.'
),
-- Nível 5: Elite
(
  'Elite', 'elite', 5,
  '#00CEC9', 'from-cyan-400 to-teal-600', 'gem',
  4.90, 12, 1000, 5.00, 8,
  ARRAY['Comissão mínima (12%)', 'Máxima prioridade em todas as corridas', 'Selo DNA Elite exclusivo', 'Acesso a todos os convênios', 'Certificado de Excelência', 'Voto nas decisões da plataforma', 'Eventos exclusivos Elite'],
  12.00, 1,
  'O nível mais alto. Motoristas que representam o melhor da DNA Mobilidade.'
)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 8. SEED DATA — DNA Pass Planos
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.dna_pass_planos
  (nome, slug, preco_mensal, preco_total, desconto_percentual,
   periodo_meses, descricao, descricao_curta, destaque, badge, cor_hex, ordem)
VALUES
(
  'Mensal', 'mensal',
  29.90, 29.90, 0.00, 1,
  'Comece sua jornada DNA Pass sem compromisso de longo prazo. Cancele quando quiser.',
  'Flexível, sem fidelidade',
  false, NULL, '#0A2463', 1
),
(
  'Trimestral', 'trimestral',
  24.90, 74.70, 16.72, 3,
  'Economize 17% com o plano trimestral. Ideal para motoristas que já conhecem o valor da DNA.',
  'Economize 17%',
  true, 'Mais Popular', '#14A76C', 2
),
(
  'Anual', 'anual',
  19.90, 238.80, 33.44, 12,
  'Máxima economia com o plano anual. 33% de desconto para motoristas comprometidos com a DNA.',
  'Economize 33%',
  false, 'Melhor Custo-Benefício', '#F5A623', 3
)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 9. SEED DATA — DNA Pass Benefícios
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.dna_pass_beneficios
  (titulo, descricao, icone, categoria, valor, ordem, ativo)
VALUES
-- Benefícios gerais (todos os planos)
('Comissão Reduzida', 'Pague menos comissão em todas as corridas — de 20% para 15%', 'percent', 'comissao', '5%', 1, true),
('Prioridade em Novidades', 'Seja o primeiro a testar novos recursos e funcionalidades', 'sparkles', 'prioridade', NULL, 2, true),
('Descontos Ampliados', 'Descontos maiores nos parceiros da Central de Benefícios', 'tag', 'desconto', 'até 30%', 3, true),
('Atendimento Prioritário', 'Suporte dedicado com resposta em até 2 horas', 'headphones', 'suporte', '2h', 4, true),
('Painel Financeiro Pro', 'Dashboard avançado com gráficos, exportação e análises', 'bar-chart-3', 'exclusivo', NULL, 5, true),
('Metas Inteligentes', 'Metas personalizadas com previsões baseadas em IA', 'target', 'exclusivo', NULL, 6, true),
('Relatórios de Performance', 'Relatórios mensais detalhados de sua performance', 'file-text', 'exclusivo', NULL, 7, true),
('Selo DNA Pass', 'Selo exclusivo visível no seu perfil para passageiros', 'badge-check', 'exclusivo', NULL, 8, true)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 10. VIEW — Motoristas Fundadores com dados do perfil
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW public.vw_motoristas_fundadores AS
SELECT
  mf.*,
  p.nome,
  p.foto_url,
  p.avaliacao_media,
  p.total_avaliacoes,
  m.veiculo_modelo,
  m.cidade_base,
  m.total_corridas
FROM public.motoristas_fundadores mf
JOIN public.profiles p ON p.id = mf.motorista_id
LEFT JOIN public.motoristas m ON m.id = mf.motorista_id
WHERE mf.selo_ativo = true
ORDER BY mf.numero_fundador ASC;

-- ═══════════════════════════════════════════════════════════════
-- 11. FUNÇÃO — Calcular nível do motorista automaticamente
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.calcular_nivel_motorista(
  p_motorista_id UUID
)
RETURNS TABLE(
  nivel_atual TEXT,
  nivel_destino TEXT,
  progresso_percentual INTEGER,
  avaliacao NUMERIC(3,2),
  meses_plataforma INTEGER,
  total_corridas INTEGER,
  taxa_cancel NUMERIC(5,2),
  treinamentos INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_avaliacao NUMERIC(3,2);
  v_meses INTEGER;
  v_corridas INTEGER;
  v_cancel NUMERIC(5,2);
  v_treinamentos INTEGER := 0;
  v_nivel_atual TEXT := 'Bronze';
  v_nivel_destino TEXT;
  v_progresso INTEGER := 0;
  v_data_criacao TIMESTAMPTZ;
BEGIN
  -- Buscar dados do motorista
  SELECT p.avaliacao_media, m.total_corridas, p.created_at
  INTO v_avaliacao, v_corridas, v_data_criacao
  FROM public.profiles p
  JOIN public.motoristas m ON m.id = p.id
  WHERE p.id = p_motorista_id;

  -- Calcular meses na plataforma
  v_meses := EXTRACT(YEAR FROM age(now(), v_data_criacao)) * 12 +
             EXTRACT(MONTH FROM age(now(), v_data_criacao));

  -- Calcular taxa de cancelamento aproximada (se houver corridas)
  v_cancel := 0.00; -- placeholder, melhorar com dados reais depois

  -- Determinar nível atual
  IF v_avaliacao >= 4.90 AND v_meses >= 12 AND v_corridas >= 1000 THEN
    v_nivel_atual := 'Elite';
    v_nivel_destino := NULL;
    v_progresso := 100;
  ELSIF v_avaliacao >= 4.80 AND v_meses >= 6 AND v_corridas >= 500 THEN
    v_nivel_atual := 'Platinum';
    v_nivel_destino := 'Elite';
    v_progresso := LEAST(100, (
      GREATEST(v_avaliacao - 4.80, 0) / 0.10 * 30 +
      GREATEST(v_meses - 6, 0) / 6.0 * 35 +
      GREATEST(v_corridas - 500, 0) / 500.0 * 35
    )::INTEGER);
  ELSIF v_avaliacao >= 4.60 AND v_meses >= 3 AND v_corridas >= 200 THEN
    v_nivel_atual := 'Ouro';
    v_nivel_destino := 'Platinum';
    v_progresso := LEAST(100, (
      GREATEST(v_avaliacao - 4.60, 0) / 0.20 * 30 +
      GREATEST(v_meses - 3, 0) / 3.0 * 35 +
      GREATEST(v_corridas - 200, 0) / 300.0 * 35
    )::INTEGER);
  ELSIF v_avaliacao >= 4.30 AND v_meses >= 1 AND v_corridas >= 50 THEN
    v_nivel_atual := 'Prata';
    v_nivel_destino := 'Ouro';
    v_progresso := LEAST(100, (
      GREATEST(v_avaliacao - 4.30, 0) / 0.30 * 30 +
      GREATEST(v_meses - 1, 0) / 2.0 * 35 +
      GREATEST(v_corridas - 50, 0) / 150.0 * 35
    )::INTEGER);
  ELSE
    v_nivel_atual := 'Bronze';
    v_nivel_destino := 'Prata';
    v_progresso := LEAST(100, (
      GREATEST(v_avaliacao, 0) / 4.30 * 30 +
      GREATEST(v_meses, 0) / 1.0 * 35 +
      GREATEST(v_corridas, 0) / 50.0 * 35
    )::INTEGER);
  END IF;

  RETURN QUERY
  SELECT v_nivel_atual, v_nivel_destino, v_progresso,
         v_avaliacao, v_meses, v_corridas, v_cancel, v_treinamentos;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- 12. TRIGGERS — updated_at
-- ═══════════════════════════════════════════════════════════════

CREATE TRIGGER motoristas_fundadores_updated_at
  BEFORE UPDATE ON public.motoristas_fundadores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER motorista_niveis_updated_at
  BEFORE UPDATE ON public.motorista_niveis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER motorista_nivel_atual_updated_at
  BEFORE UPDATE ON public.motorista_nivel_atual
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER dna_pass_planos_updated_at
  BEFORE UPDATE ON public.dna_pass_planos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER dna_pass_assinaturas_updated_at
  BEFORE UPDATE ON public.dna_pass_assinaturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ═══════════════════════════════════════════════════════════════
-- 13. RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.motoristas_fundadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorista_niveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motorista_nivel_atual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dna_pass_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dna_pass_beneficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dna_pass_assinaturas ENABLE ROW LEVEL SECURITY;

-- ─── MOTORISTAS FUNDADORES: políticas ───

-- Qualquer um pode ver fundadores ativos (reconhecimento público)
CREATE POLICY "Fundadores ativos são visíveis publicamente"
  ON public.motoristas_fundadores FOR SELECT
  USING (selo_ativo = true);

-- Motorista pode ver próprio registro de fundador
CREATE POLICY "Motorista vê próprio registro de fundador"
  ON public.motoristas_fundadores FOR SELECT
  USING (motorista_id = auth.uid());

-- Apenas admin pode inserir/atualizar
CREATE POLICY "Admin gerencia fundadores"
  ON public.motoristas_fundadores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── MOTORISTA_NIVEIS: políticas ───

-- Qualquer um logado pode ver os níveis (são definições públicas)
CREATE POLICY "Níveis são visíveis para usuários logados"
  ON public.motorista_niveis FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Apenas admin pode modificar
CREATE POLICY "Admin gerencia níveis"
  ON public.motorista_niveis FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── MOTORISTA_NIVEL_ATUAL: políticas ───

-- Motorista pode ver próprio progresso de nível
CREATE POLICY "Motorista vê próprio progresso de nível"
  ON public.motorista_nivel_atual FOR SELECT
  USING (motorista_id = auth.uid());

-- Outros usuários logados podem ver (para ranking/perfil público)
CREATE POLICY "Progresso de níveis visível para logados"
  ON public.motorista_nivel_atual FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Apenas admin pode inserir/atualizar (via função automática)
CREATE POLICY "Admin atualiza progresso de níveis"
  ON public.motorista_nivel_atual FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── DNA_PASS_PLANOS: políticas ───

-- Qualquer um logado pode ver planos
CREATE POLICY "Planos DNA Pass visíveis para logados"
  ON public.dna_pass_planos FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

-- Apenas admin pode modificar
CREATE POLICY "Admin gerencia planos DNA Pass"
  ON public.dna_pass_planos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── DNA_PASS_BENEFICIOS: políticas ───

CREATE POLICY "Benefícios DNA Pass visíveis para logados"
  ON public.dna_pass_beneficios FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

CREATE POLICY "Admin gerencia benefícios DNA Pass"
  ON public.dna_pass_beneficios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─── DNA_PASS_ASSINATURAS: políticas ───

-- Motorista pode ver própria assinatura
CREATE POLICY "Motorista vê própria assinatura DNA Pass"
  ON public.dna_pass_assinaturas FOR SELECT
  USING (motorista_id = auth.uid());

-- Motorista pode criar própria assinatura
CREATE POLICY "Motorista cria própria assinatura DNA Pass"
  ON public.dna_pass_assinaturas FOR INSERT
  WITH CHECK (motorista_id = auth.uid());

-- Motorista pode atualizar própria assinatura (cancelar, auto-renovar)
CREATE POLICY "Motorista atualiza própria assinatura DNA Pass"
  ON public.dna_pass_assinaturas FOR UPDATE
  USING (motorista_id = auth.uid());

-- Admin pode ver todas
CREATE POLICY "Admin vê todas assinaturas DNA Pass"
  ON public.dna_pass_assinaturas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- FIM — Etapa 10: Módulo Premium (Fase 1)
-- ═══════════════════════════════════════════════════════════════
