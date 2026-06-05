-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 4: Pagamentos e Financeiro
-- Tabelas: transacoes, cupons, cupons_usados, resgates_pontos
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA TRANSACOES ───
CREATE TABLE IF NOT EXISTS public.transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corrida_id UUID REFERENCES public.corridas(id) ON DELETE SET NULL,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Tipo e status
  tipo TEXT NOT NULL CHECK (tipo IN (
    'pagamento_corrida', 'repasse_motorista', 'taxa_plataforma',
    'bonus', 'ajuste', 'resgate_pontos', 'cupom_desconto'
  )),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'processando', 'concluido', 'falhou', 'estornado'
  )),

  -- Valores
  valor_bruto NUMERIC(10,2) NOT NULL DEFAULT 0,
  taxa_plataforma NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_liquido NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Forma de pagamento
  forma_pagamento TEXT CHECK (forma_pagamento IN ('pix', 'dinheiro', 'cartao', 'saldo_pontos')),

  -- Pix
  pix_qrcode TEXT,
  pix_copiaecola TEXT,
  pix_txid TEXT,
  pix_pago_em TIMESTAMPTZ,

  -- Cartão
  cartao_brand TEXT,
  cartao_last4 TEXT,

  -- Metadata
  descricao TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transacoes_usuario ON public.transacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_corrida ON public.transacoes(corrida_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON public.transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes(status);
CREATE INDEX IF NOT EXISTS idx_transacoes_created ON public.transacoes(created_at DESC);

-- ─── 2. TABELA CUPONS ───
CREATE TABLE IF NOT EXISTS public.cupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parceiro_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  codigo TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  tipo_desconto TEXT NOT NULL CHECK (tipo_desconto IN ('percentual', 'fixo')),
  valor_desconto NUMERIC(10,2) NOT NULL,

  -- Limites
  usos_maximo INTEGER NOT NULL DEFAULT 1,
  usos_contabilizados INTEGER NOT NULL DEFAULT 0,
  valor_minimo_corrida NUMERIC(10,2),

  -- Validade
  ativo BOOLEAN NOT NULL DEFAULT true,
  valido_de TIMESTAMPTZ NOT NULL DEFAULT now(),
  valido_ate TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON public.cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_cupons_parceiro ON public.cupons(parceiro_id);
CREATE INDEX IF NOT EXISTS idx_cupons_ativo ON public.cupons(ativo);

-- ─── 3. TABELA CUPONS USADOS ───
CREATE TABLE IF NOT EXISTS public.cupons_usados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cupom_id UUID NOT NULL REFERENCES public.cupons(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  corrida_id UUID REFERENCES public.corridas(id) ON DELETE SET NULL,
  desconto_aplicado NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cupom_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_cupons_usados_usuario ON public.cupons_usados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_cupons_usados_cupom ON public.cupons_usados(cupom_id);

-- ─── 4. TABELA CONFIG TAXAS ───
CREATE TABLE IF NOT EXISTS public.config_taxas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_corrida TEXT NOT NULL,
  taxa_percentual NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  taxa_fixa NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tipo_corrida)
);

-- Insert default fees
INSERT INTO public.config_taxas (tipo_corrida, taxa_percentual) VALUES
  ('urbana', 15.00),
  ('executivo', 12.00),
  ('transfer_aeroporto', 10.00),
  ('transfer_rodoviaria', 12.00),
  ('transfer_hotel', 12.00),
  ('transfer_cruzeiro', 10.00),
  ('city_tour', 10.00),
  ('passeio_turistico', 12.00)
ON CONFLICT (tipo_corrida) DO NOTHING;

-- ─── 5. TRIGGER updated_at ───
CREATE TRIGGER transacoes_updated_at
  BEFORE UPDATE ON public.transacoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER config_taxas_updated_at
  BEFORE UPDATE ON public.config_taxas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 6. RLS ───
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons_usados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_taxas ENABLE ROW LEVEL SECURITY;

-- TRANSACOES: usuário vê suas transações
CREATE POLICY "Usuario pode ver proprias transacoes"
  ON public.transacoes FOR SELECT
  USING (auth.uid() = usuario_id);

-- CUPONS: qualquer um logado pode ver cupons ativos
CREATE POLICY "Usuarios podem ver cupons ativos"
  ON public.cupons FOR SELECT
  USING (ativo = true AND auth.uid() IS NOT NULL);

-- Parceiro pode gerenciar seus cupons
CREATE POLICY "Parceiro gerencia seus cupons"
  ON public.cupons FOR ALL
  USING (auth.uid() = parceiro_id);

-- CUPONS USADOS: usuário vê os que usou
CREATE POLICY "Usuario ve seus cupons usados"
  ON public.cupons_usados FOR SELECT
  USING (auth.uid() = usuario_id);

-- Usuario pode registrar uso de cupom
CREATE POLICY "Usuario registra uso de cupom"
  ON public.cupons_usados FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- CONFIG TAXAS: qualquer um logado pode ler
CREATE POLICY "Usuarios podem ver taxas"
  ON public.config_taxas FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ─── 7. FUNÇÃO: Calcular e registrar transação ao finalizar corrida ───
CREATE OR REPLACE FUNCTION public.registrar_transacao_corrida()
RETURNS TRIGGER AS $$
DECLARE
  v_taxa_pct NUMERIC(5,2);
  v_taxa_fixa NUMERIC(10,2);
  v_valor_bruto NUMERIC(10,2);
  v_taxa NUMERIC(10,2);
  v_liquido NUMERIC(10,2);
BEGIN
  IF NEW.status = 'finalizada' AND OLD.status != 'finalizada' AND NEW.preco_final IS NOT NULL THEN
    v_valor_bruto := NEW.preco_final;

    -- Busca taxa configurada
    SELECT taxa_percentual, COALESCE(taxa_fixa, 0) INTO v_taxa_pct, v_taxa_fixa
    FROM public.config_taxas
    WHERE tipo_corrida = NEW.tipo AND ativo = true
    LIMIT 1;

    IF v_taxa_pct IS NULL THEN
      v_taxa_pct := 15.00;
      v_taxa_fixa := 0;
    END IF;

    v_taxa := ROUND(v_valor_bruto * (v_taxa_pct / 100) + v_taxa_fixa, 2);
    v_liquido := v_valor_bruto - v_taxa;

    -- Transação do passageiro (pagamento)
    INSERT INTO public.transacoes (corrida_id, usuario_id, tipo, status, valor_bruto, taxa_plataforma, valor_liquido, forma_pagamento, descricao)
    VALUES (
      NEW.id,
      NEW.passageiro_id,
      'pagamento_corrida',
      CASE WHEN NEW.forma_pagamento = 'pix' THEN 'pendente' ELSE 'concluido' END,
      v_valor_bruto,
      v_taxa,
      v_liquido,
      NEW.forma_pagamento,
      'Pagamento corrida #' || LEFT(NEW.id::TEXT, 8)
    );

    -- Transação do motorista (repasse)
    IF NEW.motorista_id IS NOT NULL THEN
      INSERT INTO public.transacoes (corrida_id, usuario_id, tipo, status, valor_bruto, taxa_plataforma, valor_liquido, descricao)
      VALUES (
        NEW.id,
        NEW.motorista_id,
        'repasse_motorista',
        'pendente',
        v_liquido,
        0,
        v_liquido,
        'Repasse corrida #' || LEFT(NEW.id::TEXT, 8)
      );

      -- Taxa da plataforma (registro interno)
      INSERT INTO public.transacoes (corrida_id, usuario_id, tipo, status, valor_bruto, taxa_plataforma, valor_liquido, descricao)
      VALUES (
        NEW.id,
        NEW.motorista_id,
        'taxa_plataforma',
        'concluido',
        v_taxa,
        v_taxa,
        v_taxa,
        'Taxa plataforma corrida #' || LEFT(NEW.id::TEXT, 8)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: ao finalizar corrida, registrar transações
CREATE TRIGGER corridas_registrar_transacao
  AFTER UPDATE ON public.corridas
  FOR EACH ROW
  WHEN (NEW.status = 'finalizada' AND OLD.status != 'finalizada')
  EXECUTE FUNCTION public.registrar_transacao_corrida();

-- ─── 8. FUNÇÃO: Descontar cupom ───
CREATE OR REPLACE FUNCTION public.aplicar_cupom(
  p_cupom_codigo TEXT,
  p_usuario_id UUID,
  p_corrida_id UUID,
  p_valor_corrida NUMERIC
)
RETURNS TABLE (desconto NUMERIC(10,2), mensagem TEXT) AS $$
DECLARE
  v_cupon RECORD;
  v_desconto NUMERIC(10,2);
BEGIN
  SELECT * INTO v_cupon FROM public.cupons WHERE codigo = p_cupom_codigo AND ativo = true;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::NUMERIC(10,2), 'Cupom não encontrado ou inativo'::TEXT;
    RETURN;
  END IF;

  IF v_cupon.valido_ate IS NOT NULL AND v_cupon.valido_ate < now() THEN
    RETURN QUERY SELECT 0::NUMERIC(10,2), 'Cupom expirado'::TEXT;
    RETURN;
  END IF;

  IF v_cupon.valor_minimo_corrida IS NOT NULL AND p_valor_corrida < v_cupon.valor_minimo_corrida THEN
    RETURN QUERY SELECT 0::NUMERIC(10,2), 'Valor mínimo da corrida não atingido'::TEXT;
    RETURN;
  END IF;

  IF v_cupon.usos_contabilizados >= v_cupon.usos_maximo THEN
    RETURN QUERY SELECT 0::NUMERIC(10,2), 'Cupom esgotado'::TEXT;
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.cupons_usados WHERE cupom_id = v_cupon.id AND usuario_id = p_usuario_id) THEN
    RETURN QUERY SELECT 0::NUMERIC(10,2), 'Você já usou este cupom'::TEXT;
    RETURN;
  END IF;

  -- Calcular desconto
  IF v_cupon.tipo_desconto = 'percentual' THEN
    v_desconto := LEAST(ROUND(p_valor_corrida * (v_cupon.valor_desconto / 100), 2), p_valor_corrida);
  ELSE
    v_desconto := LEAST(v_cupon.valor_desconto, p_valor_corrida);
  END IF;

  -- Registrar uso
  INSERT INTO public.cupons_usados (cupom_id, usuario_id, corrida_id, desconto_aplicado)
  VALUES (v_cupon.id, p_usuario_id, p_corrida_id, v_desconto);

  -- Incrementar contador
  UPDATE public.cupons SET usos_contabilizados = usos_contabilizados + 1 WHERE id = v_cupon.id;

  RETURN QUERY SELECT v_desconto, 'Cupom aplicado! Desconto: R$ ' || v_desconto::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════
-- PRONTO! Etapa 4 completa no banco.
-- ═══════════════════════════════════════════════════════════════
