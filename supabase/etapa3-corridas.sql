-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 3: Tabelas de Corridas, Chat e Avaliações
-- Executar no SQL Editor do Supabase
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA CORRIDAS ───
CREATE TABLE IF NOT EXISTS public.corridas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passageiro_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  motorista_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Tipo de serviço
  tipo TEXT NOT NULL DEFAULT 'urbana' CHECK (tipo IN (
    'urbana', 'executivo', 'transfer_aeroporto', 'transfer_rodoviaria',
    'transfer_hotel', 'transfer_cruzeiro', 'city_tour', 'passeio_turistico'
  )),

  -- Status
  status TEXT NOT NULL DEFAULT 'aguardando' CHECK (status IN (
    'aguardando', 'aceita', 'em_andamento', 'finalizada', 'cancelada'
  )),

  -- Origem
  origem_endereco TEXT NOT NULL,
  origem_lat DOUBLE PRECISION,
  origem_lng DOUBLE PRECISION,

  -- Destino
  destino_endereco TEXT,
  destino_lat DOUBLE PRECISION,
  destino_lng DOUBLE PRECISION,

  -- Preço
  preco_estimado NUMERIC(10,2),
  preco_final NUMERIC(10,2),
  forma_pagamento TEXT CHECK (forma_pagamento IN ('pix', 'dinheiro', 'cartao')),

  -- Detalhes
  distancia_km NUMERIC(6,2),
  duracao_minutos INTEGER,
  observacoes TEXT,
  passageiros INTEGER NOT NULL DEFAULT 1,

  -- Cancelamento
  cancelado_por UUID REFERENCES public.profiles(id),
  motivo_cancelamento TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  aceita_em TIMESTAMPTZ,
  iniciada_em TIMESTAMPTZ,
  finalizada_em TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_corridas_passageiro ON public.corridas(passageiro_id);
CREATE INDEX IF NOT EXISTS idx_corridas_motorista ON public.corridas(motorista_id);
CREATE INDEX IF NOT EXISTS idx_corridas_status ON public.corridas(status);
CREATE INDEX IF NOT EXISTS idx_corridas_tipo ON public.corridas(tipo);
CREATE INDEX IF NOT EXISTS idx_corridas_created ON public.corridas(created_at DESC);

-- ─── 2. TABELA MENSAGENS CHAT ───
CREATE TABLE IF NOT EXISTS public.mensagens_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corrida_id UUID NOT NULL REFERENCES public.corridas(id) ON DELETE CASCADE,
  remetente_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_corrida ON public.mensagens_chat(corrida_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_remetente ON public.mensagens_chat(remetente_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_created ON public.mensagens_chat(corrida_id, created_at ASC);

-- ─── 3. TABELA AVALIACOES ───
CREATE TABLE IF NOT EXISTS public.avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corrida_id UUID NOT NULL REFERENCES public.corridas(id) ON DELETE CASCADE,
  avaliador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  avaliado_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(corrida_id, avaliador_id, avaliado_id)
);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_corrida ON public.avaliacoes(corrida_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_avaliado ON public.avaliacoes(avaliado_id);

-- ─── 4. TRIGGER updated_at ───
CREATE TRIGGER corridas_updated_at
  BEFORE UPDATE ON public.corridas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 5. RLS ───
ALTER TABLE public.corridas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

-- CORRIDAS: passageiro vê suas corridas, motorista vê as que aceitou
CREATE POLICY "Passageiro pode ver proprias corridas"
  ON public.corridas FOR SELECT
  USING (auth.uid() = passageiro_id OR auth.uid() = motorista_id);

CREATE POLICY "Passageiro pode criar corrida"
  ON public.corridas FOR INSERT
  WITH CHECK (auth.uid() = passageiro_id);

CREATE POLICY "Motorista pode aceitar corrida"
  ON public.corridas FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = passageiro_id OR
      auth.uid() = motorista_id OR
      (motorista_id IS NULL AND status = 'aguardando')
    )
  );

-- MENSAGENS: quem tá na corrida pode ver/enviar
CREATE POLICY "Participantes podem ver mensagens"
  ON public.mensagens_chat FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.corridas c
      WHERE c.id = corrida_id
      AND (c.passageiro_id = auth.uid() OR c.motorista_id = auth.uid())
    )
  );

CREATE POLICY "Participantes podem enviar mensagens"
  ON public.mensagens_chat FOR INSERT
  WITH CHECK (
    auth.uid() = remetente_id AND
    EXISTS (
      SELECT 1 FROM public.corridas c
      WHERE c.id = corrida_id
      AND (c.passageiro_id = auth.uid() OR c.motorista_id = auth.uid())
    )
  );

CREATE POLICY "Participantes podem marcar como lida"
  ON public.mensagens_chat FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.corridas c
      WHERE c.id = corrida_id
      AND (c.passageiro_id = auth.uid() OR c.motorista_id = auth.uid())
    )
  );

-- AVALIACOES: participantes podem ver, quem avaliou pode criar
CREATE POLICY "Participantes podem ver avaliacoes"
  ON public.avaliacoes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.corridas c
      WHERE c.id = corrida_id
      AND (c.passageiro_id = auth.uid() OR c.motorista_id = auth.uid())
    )
  );

CREATE POLICY "Participante pode criar avaliacao"
  ON public.avaliacoes FOR INSERT
  WITH CHECK (
    auth.uid() = avaliador_id AND
    EXISTS (
      SELECT 1 FROM public.corridas c
      WHERE c.id = corrida_id
      AND (c.passageiro_id = auth.uid() OR c.motorista_id = auth.uid())
    )
  );

-- ─── 6. FUNÇÃO: Atualizar avaliação média do perfil ───
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET
    avaliacao_media = (
      SELECT COALESCE(AVG(nota)::NUMERIC(3,2), 0) FROM public.avaliacoes WHERE avaliado_id = NEW.avaliado_id
    ),
    total_avaliacoes = (
      SELECT COUNT(*) FROM public.avaliacoes WHERE avaliado_id = NEW.avaliado_id
    )
  WHERE id = NEW.avaliado_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER avaliacoes_update_rating
  AFTER INSERT OR UPDATE ON public.avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_rating();

-- ─── 7. FUNÇÃO: Atualizar total_corridas do motorista ───
CREATE OR REPLACE FUNCTION public.update_motorista_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'finalizada' AND NEW.motorista_id IS NOT NULL THEN
    UPDATE public.motoristas
    SET
      total_corridas = total_corridas + 1,
      ganho_total = ganho_total + COALESCE(NEW.preco_final, 0)
    WHERE id = NEW.motorista_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER corridas_update_motorista_stats
  AFTER UPDATE ON public.corridas
  FOR EACH ROW
  WHEN (NEW.status = 'finalizada' AND OLD.status != 'finalizada')
  EXECUTE FUNCTION public.update_motorista_stats();

-- ═══════════════════════════════════════════════════════════════
-- PRONTO! Etapa 3 completa no banco.
-- ═══════════════════════════════════════════════════════════════
