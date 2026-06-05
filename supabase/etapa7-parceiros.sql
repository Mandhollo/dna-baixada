-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 7: Parceiros Comerciais
-- Tabelas: estabelecimentos, avaliacoes_parceiro, campanhas_promocionais
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA ESTABELECIMENTOS ───
CREATE TABLE IF NOT EXISTS public.estabelecimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  parceiro_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN (
    'restaurante', 'bar', 'hotel', 'pousada', 'cafeteria',
    'loja', 'farmacia', 'supermercado', 'salao', 'academia',
    'entretenimento', 'servico', 'outro'
  )),

  -- Contato
  telefone TEXT,
  whatsapp TEXT,
  site_url TEXT,
  instagram TEXT,

  -- Localização
  endereco TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  cidade TEXT NOT NULL DEFAULT 'Santos',
  bairro TEXT,

  -- Mídia
  foto_url TEXT,
  galeria TEXT[] DEFAULT '{}',
  logo_url TEXT,

  -- Funcionamento
  horario_funcionamento JSONB DEFAULT '{}',
  -- Ex: {"seg": "08:00-22:00", "ter": "08:00-22:00", "dom": "fechado"}

  -- Avaliação
  avaliacao_media NUMERIC(3,2) DEFAULT 0,
  total_avaliacoes INTEGER DEFAULT 0,

  -- Programa fidelidade
  pontos_por_real NUMERIC(5,2) DEFAULT 1.00,
  programa_fidelidade_ativo BOOLEAN DEFAULT false,
  descricao_fidelidade TEXT,

  -- Controle
  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  verificado BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estab_slug ON public.estabelecimentos(slug);
CREATE INDEX IF NOT EXISTS idx_estab_categoria ON public.estabelecimentos(categoria);
CREATE INDEX IF NOT EXISTS idx_estab_cidade ON public.estabelecimentos(cidade);
CREATE INDEX IF NOT EXISTS idx_estab_parceiro ON public.estabelecimentos(parceiro_id);

-- ─── 2. TABELA AVALIACOES PARCEIRO ───
CREATE TABLE IF NOT EXISTS public.avaliacoes_parceiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  foto_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(estabelecimento_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_avaliacao_parceiro_estab ON public.avaliacoes_parceiro(estabelecimento_id);

-- ─── 3. TABELA CAMPANHAS PROMOCIONAIS ───
CREATE TABLE IF NOT EXISTS public.campanhas_promocionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  estabelecimento_id UUID NOT NULL REFERENCES public.estabelecimentos(id) ON DELETE CASCADE,

  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'desconto', 'cupom', 'cashback', 'frete_gratis', 'combo', 'happy_hour'
  )),

  -- Regras
  desconto_percentual NUMERIC(5,2),
  desconto_fixo NUMERIC(10,2),
  codigo_cupom TEXT UNIQUE,
  valor_minimo NUMERIC(10,2) DEFAULT 0,

  -- Vigência
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  horario_inicio TIME,
  horario_fim TIME,
  dias_semana INTEGER[] DEFAULT '{}', -- 0=dom, 1=seg...6=sab

  -- Limites
  uso_maximo INTEGER,
  usos_realizados INTEGER DEFAULT 0,
  uso_por_usuario INTEGER DEFAULT 1,

  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campanha_estab ON public.campanhas_promocionais(estabelecimento_id);
CREATE INDEX IF NOT EXISTS idx_campanha_codigo ON public.campanhas_promocionais(codigo_cupom);
CREATE INDEX IF NOT EXISTS idx_campanha_vigencia ON public.campanhas_promocionais(data_inicio, data_fim);

-- ─── 4. TRIGGERS ───
CREATE TRIGGER estabelecimentos_updated_at
  BEFORE UPDATE ON public.estabelecimentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-update avaliação média do estabelecimento
CREATE OR REPLACE FUNCTION public.update_avaliacao_estabelecimento()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.estabelecimentos
  SET
    avaliacao_media = COALESCE((
      SELECT ROUND(AVG(nota)::numeric, 2)
      FROM public.avaliacoes_parceiro
      WHERE estabelecimento_id = NEW.estabelecimento_id
    ), 0),
    total_avaliacoes = (
      SELECT COUNT(*)
      FROM public.avaliacoes_parceiro
      WHERE estabelecimento_id = NEW.estabelecimento_id
    )
  WHERE id = NEW.estabelecimento_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_avaliacao_estab
  AFTER INSERT OR UPDATE ON public.avaliacoes_parceiro
  FOR EACH ROW EXECUTE FUNCTION public.update_avaliacao_estabelecimento();

-- Increment usos_realizados when coupon is used (reuse cupons_usados table)
-- Already handled by etapa4

-- ─── 5. RLS ───
ALTER TABLE public.estabelecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_parceiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campanhas_promocionais ENABLE ROW LEVEL SECURITY;

-- Estabelecimentos: público para leitura
CREATE POLICY "Estabelecimentos publicos"
  ON public.estabelecimentos FOR SELECT
  USING (ativo = true);

-- Estabelecimentos: parceiro gerencia os seus
CREATE POLICY "Parceiro gerencia estabelecimento"
  ON public.estabelecimentos FOR ALL
  USING (parceiro_id = auth.uid());

-- Avaliações: público leitura
CREATE POLICY "Avaliacoes parceiro publicas"
  ON public.avaliacoes_parceiro FOR SELECT
  USING (true);

-- Avaliações: usuário autenticado cria
CREATE POLICY "Usuario cria avaliacao parceiro"
  ON public.avaliacoes_parceiro FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- Campanhas: público leitura
CREATE POLICY "Campanhas publicas"
  ON public.campanhas_promocionais FOR SELECT
  USING (ativo = true);

-- Campanhas: parceiro gerencia
CREATE POLICY "Parceiro gerencia campanhas"
  ON public.campanhas_promocionais FOR ALL
  USING (estabelecimento_id IN (
    SELECT id FROM public.estabelecimentos WHERE parceiro_id = auth.uid()
  ));

-- ─── 6. DADOS INICIAIS: Estabelecimentos ───
INSERT INTO public.estabelecimentos (nome, slug, descricao, categoria, telefone, whatsapp, endereco, cidade, bairro, horario_funcionamento, destaque, verificado, ordem) VALUES
('Restaurante Caiçara', 'restaurante-caicara',
 'Tradicional restaurante de frutos do mar na orla de Santos. Especialidade em peixe frito, camarão e moqueca baiana.',
 'restaurante', '(13) 3234-5678', '5513987654321',
 'Av. Presidente Wilson, 450 - Gonzaga, Santos', 'Santos', 'Gonzaga',
 '{"seg":"11:00-23:00","ter":"11:00-23:00","qua":"11:00-23:00","qui":"11:00-23:00","sex":"11:00-00:00","sab":"11:00-00:00","dom":"11:00-22:00"}'::jsonb,
 true, true, 1),

('Café do Porto', 'cafe-do-porto',
 'Cafeteria artesanal no centro histórico de Santos. Cafés especiais, bolos caseiros e ambiente aconchegante.',
 'cafeteria', '(13) 3234-1234', '5513912345678',
 'Rua XV de Novembro, 120 - Centro, Santos', 'Santos', 'Centro',
 '{"seg":"07:00-20:00","ter":"07:00-20:00","qua":"07:00-20:00","qui":"07:00-20:00","sex":"07:00-21:00","sab":"08:00-21:00","dom":"08:00-18:00"}'::jsonb,
 true, true, 2),

('Hotel Praia Mar', 'hotel-praia-mar',
 'Hotel 4 estrelas na orla do Gonzaga com vista para o mar. Piscina, café da manhã e estacionamento.',
 'hotel', '(13) 3234-8900', '5513989001234',
 'Av. Presidente Wilson, 800 - Gonzaga, Santos', 'Santos', 'Gonzaga',
 '{"seg":"24h","ter":"24h","qua":"24h","qui":"24h","sex":"24h","sab":"24h","dom":"24h"}'::jsonb,
 true, true, 3),

('Bar do Pescador', 'bar-do-pescador',
 'Bar descontraído na Ponta da Praia com vista para o canal. Porções generosas e cerveja gelada.',
 'bar', '(13) 3234-3456', '5513934567890',
 'Av. Martins Fontes, 200 - Ponta da Praia, Santos', 'Santos', 'Ponta da Praia',
 '{"seg":"16:00-00:00","ter":"16:00-00:00","qua":"16:00-00:00","qui":"16:00-01:00","sex":"16:00-02:00","sab":"12:00-02:00","dom":"12:00-00:00"}'::jsonb,
 false, false, 4),

('Empório da Baixada', 'emporio-da-baixada',
 'Loja de produtos artesanais e souvenirs da Baixada Santista. Presentes únicos e produtos locais.',
 'loja', '(13) 3234-6789', '5513967890123',
 'Rua XV de Novembro, 85 - Centro, Santos', 'Santos', 'Centro',
 '{"seg":"09:00-18:00","ter":"09:00-18:00","qua":"09:00-18:00","qui":"09:00-18:00","sex":"09:00-18:00","sab":"09:00-14:00","dom":"fechado"}'::jsonb,
 false, false, 5),

('Pizzaria Napoli', 'pizzaria-napoli',
 'Pizzaria tradicional com forno a lenha. Massa artesanal e ingredientes selecionados desde 1985.',
 'restaurante', '(13) 3234-2345', '5513923456789',
 'Rua Amelia de Cantoia, 55 - Vila Mathias, Santos', 'Santos', 'Vila Mathias',
 '{"seg":"18:00-23:00","ter":"18:00-23:00","qua":"18:00-23:00","qui":"18:00-23:30","sex":"18:00-00:00","sab":"18:00-00:30","dom":"18:00-23:00"}'::jsonb,
 false, true, 6);

-- ─── 7. DADOS INICIAIS: Campanhas ───
INSERT INTO public.campanhas_promocionais (estabelecimento_id, titulo, descricao, tipo, desconto_percentual, codigo_cupom, data_inicio, data_fim, uso_maximo, destaque) VALUES
((SELECT id FROM public.estabelecimentos WHERE slug='restaurante-caicara'),
 '10% Off para passageiros DNA', 'Desconto exclusivo para quem chegou de DNA Baixada', 'desconto',
 10.00, 'DNA10', '2026-06-01', '2026-12-31', 500, true),

((SELECT id FROM public.estabelecimentos WHERE slug='cafe-do-porto'),
 'Café Dobrado', 'Leve 2 cafés especiais pelo preço de 1', 'combo',
 NULL, 'CAFE2X1', '2026-06-01', '2026-09-30', 200, true),

((SELECT id FROM public.estabelecimentos WHERE slug='bar-do-pescador'),
 'Happy Hour 2x1', 'Terça a quinta, das 16h às 19h, choppe 2 por 1', 'happy_hour',
 NULL, 'HAPPY2X1', '2026-06-01', '2026-12-31', 1000, false),

((SELECT id FROM public.estabelecimentos WHERE slug='emporio-da-baixada'),
 'Souvenir com desconto', '15% de desconto em todos os souvenirs', 'desconto',
 15.00, 'TURISTA15', '2026-06-01', '2026-12-31', 300, false);

-- ═══════════════════════════════════════════════════════════════
-- PRONTO! Etapa 7 completa no banco.
-- ═══════════════════════════════════════════════════════════════
