-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 8: DNA Social e Recompensas
-- Tabelas: campanhas_sociais, participacoes_sociais,
--          recompensas, resgates_recompensas, historico_pontos
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA CAMPANHAS SOCIAIS ───
CREATE TABLE IF NOT EXISTS public.campanhas_sociais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN (
    'doacao_sangue', 'alimentos', 'meio_ambiente', 'educacao',
    'inverno', 'saude', 'animal', 'cultural', 'outro'
  )),

  -- Meta
  meta_valor NUMERIC(12,2),
  meta_unidade TEXT, -- ex: 'kg', 'litros', 'unidades', 'reais'
  meta_alcancada NUMERIC(12,2) DEFAULT 0,

  -- Período
  data_inicio DATE NOT NULL,
  data_fim DATE,
  recorrente BOOLEAN DEFAULT false,

  -- Mídia
  foto_url TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'encerrada', 'planejada')),
  destaque BOOLEAN DEFAULT false,

  -- Pontos para participantes
  pontos_participacao INTEGER DEFAULT 50,

  -- Local
  local TEXT,
  cidade TEXT DEFAULT 'Santos',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_camp_social_status ON public.campanhas_sociais(status);
CREATE INDEX IF NOT EXISTS idx_camp_social_categoria ON public.campanhas_sociais(categoria);

-- ─── 2. TABELA PARTICIPACOES SOCIAIS ───
CREATE TABLE IF NOT EXISTS public.participacoes_sociais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  campanha_id UUID NOT NULL REFERENCES public.campanhas_sociais(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  tipo TEXT NOT NULL CHECK (tipo IN ('participacao', 'doacao', 'voluntario', 'compartilhou')),
  descricao TEXT,
  valor NUMERIC(12,2),

  pontos_ganhos INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(campanha_id, usuario_id, tipo)
);

CREATE INDEX IF NOT EXISTS idx_part_social_usuario ON public.participacoes_sociais(usuario_id);
CREATE INDEX IF NOT EXISTS idx_part_social_campanha ON public.participacoes_sociais(campanha_id);

-- ─── 3. TABELA RECOMPENSAS ───
CREATE TABLE IF NOT EXISTS public.recompensas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN (
    'desconto_corrida', 'upgrade', 'produto', 'experiencia', 'certificado', 'outro'
  )),

  -- Custo em pontos
  pontos_necessarios INTEGER NOT NULL,

  -- Detalhes
  imagem_url TEXT,
  valor_desconto NUMERIC(10,2),
  codigo TEXT UNIQUE,

  -- Estoque
  quantidade_total INTEGER,
  quantidade_resgatada INTEGER DEFAULT 0,

  ativo BOOLEAN DEFAULT true,
  destaque BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 4. TABELA RESGATES RECOMPENSAS ───
CREATE TABLE IF NOT EXISTS public.resgates_recompensas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  recompensa_id UUID NOT NULL REFERENCES public.recompensas(id),
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  pontos_gastos INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'entregue', 'cancelado')),

  codigo_resgate TEXT UNIQUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resgate_usuario ON public.resgates_recompensas(usuario_id);

-- ─── 5. TABELA HISTORICO PONTOS ───
CREATE TABLE IF NOT EXISTS public.historico_pontos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  tipo TEXT NOT NULL CHECK (tipo IN (
    'corrida', 'avaliacao', 'indicacao', 'campanha_social',
    'login_diario', 'resgate', 'bonus', 'ajuste'
  )),
  pontos INTEGER NOT NULL, -- positivo = ganhou, negativo = gastou
  descricao TEXT NOT NULL,

  referencia_id TEXT, -- ID da corrida, campanha, etc.

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_historico_pontos_usuario ON public.historico_pontos(usuario_id);

-- ─── 6. VIEWS ───
CREATE OR REPLACE VIEW public.ranking_social AS
SELECT
  p.id,
  p.nome,
  p.foto_url,
  p.pontos,
  p.role,
  COUNT(ps.id) AS participacoes,
  COALESCE(SUM(ps.pontos_ganhos), 0) AS pontos_sociais
FROM public.profiles p
LEFT JOIN public.participacoes_sociais ps ON ps.usuario_id = p.id
GROUP BY p.id
ORDER BY p.pontos DESC, participacoes DESC;

-- ─── 7. TRIGGERS ───

-- Auto-update meta_alcancada when participation has valor
CREATE OR REPLACE FUNCTION public.update_meta_campanha()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.valor IS NOT NULL AND NEW.valor > 0 THEN
    UPDATE public.campanhas_sociais
    SET meta_alcancada = COALESCE(meta_alcancada, 0) + NEW.valor
    WHERE id = NEW.campanha_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_meta
  AFTER INSERT ON public.participacoes_sociais
  FOR EACH ROW EXECUTE FUNCTION public.update_meta_campanha();

-- Auto-update profile pontos when historico_pontos is inserted
CREATE OR REPLACE FUNCTION public.update_profile_pontos()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET pontos = COALESCE(pontos, 0) + NEW.pontos
  WHERE id = NEW.usuario_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_pontos
  AFTER INSERT ON public.historico_pontos
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_pontos();

-- Auto-update recompensa quantidade_resgatada
CREATE OR REPLACE FUNCTION public.update_recompensa_estoque()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.recompensas
  SET quantidade_resgatada = quantidade_resgatada + 1
  WHERE id = NEW.recompensa_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_estoque
  AFTER INSERT ON public.resgates_recompensas
  FOR EACH ROW EXECUTE FUNCTION public.update_recompensa_estoque();

-- ─── 8. RLS ───
ALTER TABLE public.campanhas_sociais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participacoes_sociais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recompensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resgates_recompensas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_pontos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campanhas sociais publicas" ON public.campanhas_sociais FOR SELECT USING (true);
CREATE POLICY "Participacoes publicas" ON public.participacoes_sociais FOR SELECT USING (true);
CREATE POLICY "Participacoes usuario cria" ON public.participacoes_sociais FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Recompensas publicas" ON public.recompensas FOR SELECT USING (ativo = true);
CREATE POLICY "Resgates usuario" ON public.resgates_recompensas FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Resgates usuario cria" ON public.resgates_recompensas FOR INSERT WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "Historico pontos usuario" ON public.historico_pontos FOR SELECT USING (usuario_id = auth.uid());
CREATE POLICY "Historico pontos cria" ON public.historico_pontos FOR INSERT WITH CHECK (usuario_id = auth.uid());

-- ─── 9. DADOS INICIAIS: Campanhas Sociais ───
INSERT INTO public.campanhas_sociais (titulo, descricao, categoria, meta_valor, meta_unidade, data_inicio, status, destaque, pontos_participacao, local, cidade) VALUES
('Doação de Sangue - Hemocentro', 'Campanha permanente de doação de sangue em parceria com o Hemocentro de Santos. Cada doação salva até 4 vidas.', 'doacao_sangue', 500, 'doações', '2026-01-01', 'ativa', true, 100, 'Hemocentro de Santos - Rua Dr. Cesário Mota Jr., 115', 'Santos'),
('Arrecadação de Alimentos', 'Arrecadação de alimentos não perecíveis para famílias em situação de vulnerabilidade na Baixada Santista.', 'alimentos', 2000, 'kg', '2026-03-01', 'ativa', true, 50, 'Vários pontos de coleta', 'Santos'),
('Limpeza de Praias 2026', 'Mutirões mensais de limpeza nas praias de Santos, Guarujá e São Vicente. Juntos por um litoral mais limpo.', 'meio_ambiente', 500, 'voluntários', '2026-01-01', 'ativa', true, 75, 'Praias da Baixada Santista', 'Santos'),
('Apoio Educacional', 'Doação de material escolar e apoio a projetos educacionais em comunidades da Baixada Santista.', 'educacao', 1000, 'kits', '2026-02-01', 'ativa', false, 60, 'Comunidades da Baixada', 'Santos'),
('Campanha de Inverno 2026', 'Arrecadação de roupas, cobertores e itens de aquecimento para quem mais precisa nos meses frios.', 'inverno', 3000, 'unidades', '2026-05-01', 'planejada', false, 50, 'Vários pontos de coleta', 'Santos');

-- ─── 10. DADOS INICIAIS: Recompensas ───
INSERT INTO public.recompensas (nome, descricao, categoria, pontos_necessarios, valor_desconto, ativo, destaque) VALUES
('Desconto R$15 na próxima corrida', 'Ganhe R$15 de desconto em qualquer corrida urbana', 'desconto_corrida', 200, 15.00, true, true),
('Desconto R$30 no City Tour', 'R$30 de desconto em qualquer city tour', 'desconto_corrida', 400, 30.00, true, true),
('Upgrade Executivo', 'Upgrade gratuito para corrida executiva (1x)', 'upgrade', 500, 40.00, true, true),
('Desconto R$50 Transfer Aeroporto', 'R$50 de desconto no transfer Guarulhos', 'desconto_corrida', 600, 50.00, true, false),
('Certificado DNA Social', 'Certificado digital de participação nas campanhas sociais', 'certificado', 300, NULL, true, true),
('Camiseta DNA Baixada', 'Camiseta oficial exclusiva do DNA Baixada', 'produto', 1000, NULL, true, false),
('City Tour Gratuito', 'Um city tour completo totalmente grátis', 'experiencia', 2000, 400.00, true, true);

-- ═══════════════════════════════════════════════════════════════
-- PRONTO! Etapa 8 completa no banco.
-- ═══════════════════════════════════════════════════════════════
