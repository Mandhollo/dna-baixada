-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 5: Painel do Motorista
-- Tabelas: notificacoes, metas, meta_progresso, incentivos
-- Views: ranking_motoristas
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA NOTIFICACOES ───
CREATE TABLE IF NOT EXISTS public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'info' CHECK (tipo IN (
    'info', 'corrida_nova', 'corrida_aceita', 'corrida_cancelada',
    'pagamento', 'bonus', 'meta', 'ranking', 'demanda_alta', 'sistema'
  )),

  lida BOOLEAN NOT NULL DEFAULT false,
  lida_em TIMESTAMPTZ,

  -- Link pra onde ir ao clicar
  link TEXT,

  -- Dados extras
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON public.notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON public.notificacoes(usuario_id, lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo ON public.notificacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_notificacoes_created ON public.notificacoes(usuario_id, created_at DESC);

-- ─── 2. TABELA METAS ───
CREATE TABLE IF NOT EXISTS public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,

  -- Tipo de meta
  tipo TEXT NOT NULL CHECK (tipo IN (
    'corridas_dia', 'corridas_semana', 'corridas_mes',
    'faturamento_semana', 'faturamento_mes',
    'avaliacao', 'horario_pico', 'cruzeiro', 'evento'
  )),

  -- Objetivo
  objetivo NUMERIC(10,2) NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'corridas' CHECK (unidade IN ('corridas', 'reais', 'pontos', 'horas')),

  -- Recompensa
  recompensa_tipo TEXT NOT NULL DEFAULT 'bonus' CHECK (recompensa_tipo IN ('bonus', 'pontos', 'badge')),
  recompensa_valor NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Período
  inicio_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  fim_em TIMESTAMPTZ,

  -- Status
  ativa BOOLEAN NOT NULL DEFAULT true,
  recorrente BOOLEAN NOT NULL DEFAULT false,

  -- Para qual público
  tipo_motorista TEXT CHECK (tipo_motorista IN ('todos', 'executivo', 'cruzeiro')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metas_ativa ON public.metas(ativa);
CREATE INDEX IF NOT EXISTS idx_metas_tipo ON public.metas(tipo);

-- ─── 3. TABELA META PROGRESSO ───
CREATE TABLE IF NOT EXISTS public.meta_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID NOT NULL REFERENCES public.metas(id) ON DELETE CASCADE,
  motorista_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  progresso NUMERIC(10,2) NOT NULL DEFAULT 0,
  concluida BOOLEAN NOT NULL DEFAULT false,
  concluida_em TIMESTAMPTZ,
  recompensa_resgatada BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(meta_id, motorista_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_progresso_motorista ON public.meta_progresso(motorista_id);
CREATE INDEX IF NOT EXISTS idx_meta_progresso_meta ON public.meta_progresso(meta_id);

-- ─── 4. TABELA INCENTIVOS ───
CREATE TABLE IF NOT EXISTS public.incentivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,

  tipo TEXT NOT NULL CHECK (tipo IN ('pico', 'cruzeiro', 'evento', 'noite', 'fim_de_semana', 'primeira_corrida')),

  -- Multiplicador (ex: 1.5 = 50% extra)
  multiplicador NUMERIC(3,2) NOT NULL DEFAULT 1.00,

  -- Período de validade
  inicio_em TIMESTAMPTZ NOT NULL,
  fim_em TIMESTAMPTZ,

  -- Horário do dia (opcional)
  horario_inicio TIME,
  horario_fim TIME,

  -- Dias da semana (array, 0=dom, 6=sab)
  dias_semana INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],

  ativo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 5. VIEW: RANKING MOTORISTAS ───
CREATE OR REPLACE VIEW public.ranking_motoristas AS
SELECT
  p.id,
  p.nome,
  p.foto_url,
  p.avaliacao_media,
  p.total_avaliacoes,
  m.veiculo_modelo,
  m.cidade_base,
  m.total_corridas,
  m.ganho_total,
  m.disponivel,
  -- Corridas este mês
  (SELECT COUNT(*) FROM public.corridas c
   WHERE c.motorista_id = p.id
   AND c.status = 'finalizada'
   AND c.finalizada_em >= date_trunc('month', now())) AS corridas_mes,
  -- Ganho este mês
  (SELECT COALESCE(SUM(c.preco_final), 0) FROM public.corridas c
   WHERE c.motorista_id = p.id
   AND c.status = 'finalizada'
   AND c.finalizada_em >= date_trunc('month', now())) AS ganho_mes,
  -- Score (avaliação * corridas_mes * 10 + ganho_mes/100)
  (
    COALESCE(p.avaliacao_media, 0) * 20 +
    COALESCE((SELECT COUNT(*) FROM public.corridas c
     WHERE c.motorista_id = p.id AND c.status = 'finalizada'
     AND c.finalizada_em >= date_trunc('month', now())), 0) * 5
  ) AS score
FROM public.profiles p
JOIN public.motoristas m ON m.id = p.id
WHERE p.role = 'motorista'
AND m.status = 'aprovado'
AND p.ativo = true
ORDER BY score DESC;

-- ─── 6. TRIGGERS ───
CREATE TRIGGER meta_progresso_updated_at
  BEFORE UPDATE ON public.meta_progresso
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 7. FUNÇÃO: Notificar motoristas de demanda alta ───
CREATE OR REPLACE FUNCTION public.notificar_demanda_alta(
  p_titulo TEXT,
  p_mensagem TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notificacoes (usuario_id, titulo, mensagem, tipo, link)
  SELECT id, p_titulo, p_mensagem, 'demanda_alta', p_link
  FROM public.profiles
  WHERE role = 'motorista' AND ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 8. FUNÇÃO: Atualizar progresso de meta ao finalizar corrida ───
CREATE OR REPLACE FUNCTION public.atualizar_meta_progresso()
RETURNS TRIGGER AS $$
DECLARE
  meta_record RECORD;
  existing RECORD;
  new_progress NUMERIC(10,2);
BEGIN
  IF NEW.status = 'finalizada' AND OLD.status != 'finalizada' AND NEW.motorista_id IS NOT NULL THEN
    -- Buscar metas ativas do tipo corridas
    FOR meta_record IN
      SELECT id, tipo, objetivo, unidade
      FROM public.metas
      WHERE ativa = true
      AND tipo IN ('corridas_dia', 'corridas_semana', 'corridas_mes', 'cruzeiro', 'evento')
    LOOP
      -- Verificar se já tem progresso
      SELECT * INTO existing
      FROM public.meta_progresso
      WHERE meta_id = meta_record.id AND motorista_id = NEW.motorista_id;

      IF existing IS NULL THEN
        INSERT INTO public.meta_progresso (meta_id, motorista_id, progresso)
        VALUES (meta_record.id, NEW.motorista_id, 1);
      ELSE
        new_progress := existing.progresso + 1;
        UPDATE public.meta_progresso
        SET progresso = new_progress,
            concluida = (new_progress >= meta_record.objetivo),
            concluida_em = CASE WHEN new_progress >= meta_record.objetivo AND NOT existing.concluida THEN now() ELSE concluida_em END
        WHERE id = existing.id;
      END IF;
    END LOOP;

    -- Metas de faturamento
    FOR meta_record IN
      SELECT id, tipo, objetivo
      FROM public.metas
      WHERE ativa = true
      AND tipo IN ('faturamento_semana', 'faturamento_mes')
    LOOP
      SELECT * INTO existing
      FROM public.meta_progresso
      WHERE meta_id = meta_record.id AND motorista_id = NEW.motorista_id;

      IF existing IS NULL THEN
        INSERT INTO public.meta_progresso (meta_id, motorista_id, progresso)
        VALUES (meta_record.id, NEW.motorista_id, COALESCE(NEW.preco_final, 0));
      ELSE
        new_progress := existing.progresso + COALESCE(NEW.preco_final, 0);
        UPDATE public.meta_progresso
        SET progresso = new_progress,
            concluida = (new_progress >= meta_record.objetivo),
            concluida_em = CASE WHEN new_progress >= meta_record.objetivo AND NOT existing.concluida THEN now() ELSE concluida_em END
        WHERE id = existing.id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER corridas_atualizar_meta
  AFTER UPDATE ON public.corridas
  FOR EACH ROW
  WHEN (NEW.status = 'finalizada' AND OLD.status != 'finalizada')
  EXECUTE FUNCTION public.atualizar_meta_progresso();

-- ─── 9. RLS ───
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incentivos ENABLE ROW LEVEL SECURITY;

-- NOTIFICACOES: usuário vê e gerencia suas notificações
CREATE POLICY "Usuario pode ver proprias notificacoes"
  ON public.notificacoes FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuario pode marcar como lida"
  ON public.notificacoes FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuario pode deletar notificacao"
  ON public.notificacoes FOR DELETE
  USING (auth.uid() = usuario_id);

-- METAS: qualquer logado pode ver metas ativas
CREATE POLICY "Usuarios podem ver metas ativas"
  ON public.metas FOR SELECT
  USING (ativa = true AND auth.uid() IS NOT NULL);

-- META PROGRESSO: motorista vê seu progresso
CREATE POLICY "Motorista ve seu progresso"
  ON public.meta_progresso FOR SELECT
  USING (auth.uid() = motorista_id);

-- INCENTIVOS: qualquer logado pode ver
CREATE POLICY "Usuarios podem ver incentivos"
  ON public.incentivos FOR SELECT
  USING (ativo = true AND auth.uid() IS NOT NULL);

-- RANKING: qualquer logado pode ver
GRANT SELECT ON public.ranking_motoristas TO anon, authenticated;

-- ─── 10. DADOS INICIAIS: Metas padrão ───
INSERT INTO public.metas (nome, descricao, tipo, objetivo, unidade, recompensa_tipo, recompensa_valor, recorrente, ativa) VALUES
  ('Corridas do Dia', 'Complete 5 corridas em um dia', 'corridas_dia', 5, 'corridas', 'bonus', 30, true, true),
  ('Corridas da Semana', 'Complete 20 corridas na semana', 'corridas_semana', 20, 'corridas', 'bonus', 100, true, true),
  ('Corridas do Mês', 'Complete 80 corridas no mês', 'corridas_mes', 80, 'corridas', 'bonus', 400, true, true),
  ('Faturamento Semanal', 'Fature R$ 2.000 na semana', 'faturamento_semana', 2000, 'reais', 'bonus', 150, true, true),
  ('Faturamento Mensal', 'Fature R$ 8.000 no mês', 'faturamento_mes', 8000, 'reais', 'bonus', 500, true, true),
  ('Avaliação 5 Estrelas', 'Mantenha avaliação acima de 4.8', 'avaliacao', 4.8, 'pontos', 'badge', 50, true, true);

-- ─── 11. DADOS INICIAIS: Incentivos ───
INSERT INTO public.incentivos (nome, descricao, tipo, multiplicador, inicio_em, horario_inicio, horario_fim, dias_semana, ativo) VALUES
  ('Horário de Pico Manhã', 'Extra para corridas no pico da manhã', 'pico', 1.30, '2026-01-01', '06:00', '09:00', ARRAY[1,2,3,4,5], true),
  ('Horário de Pico Tarde', 'Extra para corridas no pico da tarde', 'pico', 1.25, '2026-01-01', '17:00', '20:00', ARRAY[1,2,3,4,5], true),
  ('Turno da Noite', 'Extra para corridas noturnas', 'noite', 1.40, '2026-01-01', '22:00', '05:00', ARRAY[0,1,2,3,4,5,6], true),
  ('Fim de Semana', 'Extra para corridas sábado e domingo', 'fim_de_semana', 1.20, '2026-01-01', '08:00', '23:59', ARRAY[0,6], true),
  ('Temporada de Cruzeiros', 'Extra durante temporada de cruzeiros', 'cruzeiro', 1.50, '2026-10-01', NULL, NULL, ARRAY[0,1,2,3,4,5,6], true);

-- ═══════════════════════════════════════════════════════════════
-- PRONTO! Etapa 5 completa no banco.
-- ═══════════════════════════════════════════════════════════════
