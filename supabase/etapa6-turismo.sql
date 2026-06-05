-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 6: Turismo e City Tours
-- Tabelas: pontos_turisticos, roteiros, eventos, cruzeiros
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA PONTOS TURISTICOS ───
CREATE TABLE IF NOT EXISTS public.pontos_turisticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao_curta TEXT NOT NULL,
  descricao TEXT NOT NULL,

  -- Localização
  endereco TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  cidade TEXT NOT NULL DEFAULT 'Santos',

  -- Categoria
  categoria TEXT NOT NULL CHECK (categoria IN (
    'historico', 'praia', 'natureza', 'museu', 'religioso',
    'gastronomico', 'entretenimento', 'mirante', 'cultura', 'esporte'
  )),

  -- Mídia
  foto_url TEXT,
  galeria TEXT[] DEFAULT '{}',

  -- Funcionamento
  horario_funcionamento TEXT,
  preco_entrada NUMERIC(10,2) DEFAULT 0,
  gratuito BOOLEAN NOT NULL DEFAULT false,

  -- Dicas
  dicas TEXT,
  tempo_visita_minutos INTEGER,

  -- Rating
  avaliacao_media NUMERIC(3,2) DEFAULT 0,
  total_avaliacoes INTEGER DEFAULT 0,

  -- Controle
  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pontos_slug ON public.pontos_turisticos(slug);
CREATE INDEX IF NOT EXISTS idx_pontos_categoria ON public.pontos_turisticos(categoria);
CREATE INDEX IF NOT EXISTS idx_pontos_cidade ON public.pontos_turisticos(cidade);
CREATE INDEX IF NOT EXISTS idx_pontos_destaque ON public.pontos_turisticos(destaque) WHERE ativo = true;

-- ─── 2. TABELA ROTEIROS ───
CREATE TABLE IF NOT EXISTS public.roteiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,

  -- Tipo de roteiro
  tipo TEXT NOT NULL CHECK (tipo IN ('familia', 'casal', 'aventura', 'cultural', 'gastronomico', 'religioso', 'noturno')),

  -- Duração e preço
  duracao_horas NUMERIC(4,1) NOT NULL DEFAULT 3,
  preco_base NUMERIC(10,2) NOT NULL DEFAULT 400,
  preco_6lugares NUMERIC(10,2),

  -- Pontos incluídos (array de IDs ordenados)
  pontos_ids UUID[] NOT NULL DEFAULT '{}',

  -- Mídia
  foto_url TEXT,

  -- Detalhes
  inclui TEXT[] DEFAULT '{}',
  nao_inclui TEXT[] DEFAULT '{}',
  observacoes TEXT,

  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roteiros_slug ON public.roteiros(slug);
CREATE INDEX IF NOT EXISTS idx_roteiros_tipo ON public.roteiros(tipo);

-- ─── 3. TABELA EVENTOS ───
CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome TEXT NOT NULL,
  descricao TEXT NOT NULL,

  -- Local
  local TEXT NOT NULL,
  endereco TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  cidade TEXT NOT NULL DEFAULT 'Santos',

  -- Data/Hora
  data_inicio DATE NOT NULL,
  data_fim DATE,
  horario_inicio TIME,
  horario_fim TIME,

  -- Categoria
  categoria TEXT NOT NULL CHECK (categoria IN (
    'show', 'feira', 'festival', 'exposicao', 'esportivo',
    'religioso', 'cultural', 'gastronomico', 'comunitario'
  )),

  -- Detalhes
  preco TEXT,
  gratuito BOOLEAN NOT NULL DEFAULT false,
  site_url TEXT,
  foto_url TEXT,

  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_data ON public.eventos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_categoria ON public.eventos(categoria);
CREATE INDEX IF NOT EXISTS idx_eventos_cidade ON public.eventos(cidade);

-- ─── 4. TABELA CRUZEIROS ───
CREATE TABLE IF NOT EXISTS public.cruzeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  navio TEXT NOT NULL,
  companhia TEXT NOT NULL,

  -- Chegada
  data_chegada DATE NOT NULL,
  hora_chegada TIME NOT NULL DEFAULT '07:00',

  -- Saída
  data_saida DATE NOT NULL,
  hora_saida TIME NOT NULL DEFAULT '17:00',

  -- Detalhes
  porto TEXT NOT NULL DEFAULT 'Concais - Santos',
  passageiros INTEGER,
  rota TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'cancelado', 'atrasado')),

  ativo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cruzeiros_chegada ON public.cruzeiros(data_chegada);
CREATE INDEX IF NOT EXISTS idx_cruzeiros_saida ON public.cruzeiros(data_saida);

-- ─── 5. TRIGGERS ───
CREATE TRIGGER pontos_turisticos_updated_at
  BEFORE UPDATE ON public.pontos_turisticos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 6. RLS ───
ALTER TABLE public.pontos_turisticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roteiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cruzeiros ENABLE ROW LEVEL SECURITY;

-- Todos públicos (qualquer um pode ver)
CREATE POLICY "Pontos turisticos publicos"
  ON public.pontos_turisticos FOR SELECT
  USING (ativo = true);

CREATE POLICY "Roteiros publicos"
  ON public.roteiros FOR SELECT
  USING (ativo = true);

CREATE POLICY "Eventos publicos"
  ON public.eventos FOR SELECT
  USING (ativo = true);

CREATE POLICY "Cruzeiros publicos"
  ON public.cruzeiros FOR SELECT
  USING (ativo = true);

-- ─── 7. DADOS INICIAIS: Pontos Turísticos ───
INSERT INTO public.pontos_turisticos (nome, slug, descricao_curta, descricao, endereco, latitude, longitude, cidade, categoria, horario_funcionamento, preco_entrada, gratuito, dicas, tempo_visita_minutos, destaque, ordem) VALUES
('Bolsa do Café', 'bolsa-do-cafe',
 'Marco histórico de Santos, palco das negociações de café que impulsionaram o Brasil.',
 'A Bolsa Oficial de Café é um dos edifícios mais emblemáticos de Santos. Inaugurada em 1922, foi o centro das negociações cafeeiras que definiram a economia brasileira por décadas. Hoje abriga o Museu do Café, salas de eventos e uma arquitetura impressionante com afrescos e mosaicos originais.',
 'Praça Cel. Fernando Machado, 66 - Centro, Santos', -23.9340, -46.3332, 'Santos', 'historico',
 'Terça a Domingo, 9h às 17h', 20.00, false,
 'Visite o museu do café no mesmo prédio. Degustação inclusa no ingresso.', 60, true, 1),

('Monte Serrat e Bondinho', 'monte-serrat-bondinho',
 'Vista panorâmica 360° de Santos com bondinho histórico e Capela de Santa Cruz.',
 'O Monte Serrat é o ponto mais alto do centro de Santos (147m). O bondinho funciona desde 1923 e oferece uma vista espetacular de toda a cidade, porto e Baixada Santista. No topo, visite a Capela de Santa Cruz (1640) e aproveite o mirante.',
 'Rua Lineu de Paula Machado, 1 - Monte Serrat, Santos', -23.9382, -46.3418, 'Santos', 'mirante',
 'Terça a Domingo, 10h às 18h', 40.00, false,
 'Vá ao pôr do sol para fotos incríveis. O bondinho fecha às segundas.', 90, true, 2),

('Aquário Municipal', 'aquario-municipal',
 'O mais antigo aquário do Brasil com espécies marinhas e tubarões.',
 'Inaugurado em 1945, o Aquário Municipal de Santos é o mais antigo do Brasil em funcionamento. Possui mais de 200 espécies de animais marinhos, incluindo tubarões, arraias, pinguins e tartarugas. Ideal para visitas em família.',
 'Av. Bartolomeu de Gusmão, s/n - Ponta da Praia, Santos', -23.9810, -46.3115, 'Santos', 'entretenimento',
 'Terça a Domingo, 9h às 18h', 30.00, false,
 'Chegue cedo para evitar filas. Alimentação dos tubarões acontece às 15h.', 90, true, 3),

('Orla da Praia', 'orla-da-praia',
 'Maior jardim de orla marítima do mundo com 5,5 km de extensão.',
 'A Orla da Praia de Santos é reconhecida pelo Guinness Book como o maior jardim de orla marítima do mundo. São 5,5 km de jardins, ciclovia, quiosques e praças. Ponto obrigatório para caminhadas e esportes ao ar livre.',
 'Av. Presidente Wilson, Santos', -23.9620, -46.3300, 'Santos', 'praia',
 'Aberto 24 horas', 0.00, true,
 'A ciclovia é ótima para pedalar. Praias com posto de salvamento.', 120, true, 4),

('Praia do Gonzaga', 'praia-do-gonzaga',
 'Uma das praias mais badaladas de Santos com excelente infraestrutura.',
 'A Praia do Gonzaga é o coração da orla santista. Com areia limpa, quiosques, restaurantes e vida noturna vibrante, é o point de moradores e turistas. Próxima ao Shopping Praiamar e aos melhores hotéis.',
 'Av. Presidente Wilson, Gonzaga, Santos', -23.9680, -46.3320, 'Santos', 'praia',
 'Aberto 24 horas', 0.00, true,
 'Melhor para banho na maré baixa. Bares e restaurantes na orla.', 60, false, 5),

('Museu do Café', 'museu-do-cafe',
 'História do café no Brasil com acervo interativo e degustações.',
 'Localizado no Edifício da Bolsa Oficial de Café, o Museu do Café conta a fascinante história do café no Brasil. Com acervo interativo, fotografias históricas e degustação de cafés especiais, é uma experiência cultural imperdível.',
 'Praça Cel. Fernando Machado, 66 - Centro, Santos', -23.9340, -46.3332, 'Santos', 'museu',
 'Terça a Domingo, 9h às 17h', 20.00, false,
 'Ingresso combinado com Bolsa do Café. Degustação de cafés especiais.', 60, true, 6),

('Emissário Submarino', 'emissario-submarino',
 'Obra de engenharia que se tornou ponto turístico com vista para o mar aberto.',
 'O Emissário Submarino é uma obra de engenharia sanitária inaugurada em 1979 que se tornou um cartão postal de Santos. A estrutura avança 4 km mar adentro e oferece uma vista única do litoral.',
 'Av. Presidente Wilson, Ponta da Praia, Santos', -23.9830, -46.3080, 'Santos', 'mirante',
 'Aberto 24 horas (mirante externo)', 0.00, true,
 'Ótimo para fotos ao pôr do sol. Fica próximo ao Aquário.', 30, false, 7),

('Pitangueiras (Guarujá)', 'pitangueiras-guaruja',
 'Praia urbana no Guarujá com águas calmas e vista para a Ilha das Cabras.',
 'A Praia de Pitangueiras é uma das mais frequentadas do Guarujá. Com águas calmas e protecção natural, é ideal para famílias. Vista privilegiada para a Ilha das Cabras e o Forte das Cabras.',
 'Praia de Pitangueiras, Guarujá', -23.9790, -46.2530, 'Guarujá', 'praia',
 'Aberto 24 horas', 0.00, true,
 'Atravessar de balsa é uma experiência. Estacionamento próximo.', 120, false, 8),

('Vila Belmiro (Estádio do Santos FC)', 'vila-belmiro',
 'Casa do Santos FC, onde Pelé jogou e se consagrou o Rei do Futebol.',
 'A Vila Belmiro é o estádio do Santos Futebol Clube, onde Pelé marcou mais de 1000 gols. O estádio oferece visitas guiadas com acesso aos vestiários, campo e museu do clube. Um passeio obrigatório para amantes do futebol.',
 'Rua Princesa Isabel, 77 - Vila Belmiro, Santos', -23.9460, -46.3520, 'Santos', 'esporte',
 'Visitas guiadas: Seg a Sex, 10h e 15h (confirmar)', 50.00, false,
 'Agende com antecedência. Loja do clube no local.', 60, false, 9);

-- ─── 8. DADOS INICIAIS: Roteiros ───
INSERT INTO public.roteiros (nome, slug, descricao, tipo, duracao_horas, preco_base, preco_6lugares, pontos_ids, inclui, nao_inclui, observacoes, destaque) VALUES
('City Tour Clássico', 'city-tour-classico',
 'O tour mais completo de Santos: Bolsa do Café, Monte Serrat, Orla e Aquário.',
 'cultural', 3.0, 400.00, 520.00,
 ARRAY[(SELECT id FROM public.pontos_turisticos WHERE slug='bolsa-do-cafe')::UUID,
       (SELECT id FROM public.pontos_turisticos WHERE slug='monte-serrat-bondinho')::UUID,
       (SELECT id FROM public.pontos_turisticos WHERE slug='orla-da-praia')::UUID,
       (SELECT id FROM public.pontos_turisticos WHERE slug='aquario-municipal')::UUID],
 ARRAY['Motorista-guia local', 'Veículo com ar-condicionado', 'Água mineral', 'Saída de qualquer ponto'],
 ARRAY['Ingressos dos atrativos', 'Alimentação'],
 'O roteiro pode ser personalizado. Consulte opções.', true),

('Tour Família', 'tour-familia',
 'Passeio ideal para crianças: Aquário, praias e jardins da orla.',
 'familia', 3.0, 400.00, 520.00,
 ARRAY[(SELECT id FROM public.pontos_turisticos WHERE slug='aquario-municipal')::UUID,
       (SELECT id FROM public.pontos_turisticos WHERE slug='orla-da-praia')::UUID,
       (SELECT id FROM public.pontos_turisticos WHERE slug='praia-do-gonzaga')::UUID],
 ARRAY['Motorista-guia local', 'Veículo com ar-condicionado', 'Cadeirinha disponível (sob consulta)', 'Água mineral'],
 ARRAY['Ingressos dos atrativos', 'Alimentação'],
 'Cadeirinha e bebê-conforto sob disponibilidade.', false),

('Tour Romântico', 'tour-romantico',
 'Pôr do sol no Monte Serrat, Orla e restaurantes à beira-mar.',
 'casal', 4.0, 500.00, 650.00,
 ARRAY[(SELECT id FROM public.pontos_turisticos WHERE slug='monte-serrat-bondinho')::UUID,
       (SELECT id FROM public.pontos_turisticos WHERE slug='emissario-submarino')::UUID,
       (SELECT id FROM public.pontos_turisticos WHERE slug='orla-da-praia')::UUID],
 ARRAY['Motorista-guia local', 'Veículo executivo', 'Água mineral', 'Champagne (opcional)'],
 ARRAY['Alimentação', 'Ingressos'],
 'Recomendado para o período da tarde, para ver o pôr do sol.', false),

('Tour Aventura', 'tour-aventura',
 'Praias do Guarujá, mirantes e esportes aquáticos.',
 'aventura', 5.0, 600.00, 780.00,
 ARRAY[(SELECT id FROM public.pontos_turisticos WHERE slug='pitangueiras-guaruja')::UUID,
       (SELECT id FROM public.pontos_turisticos WHERE slug='emissario-submarino')::UUID,
       (SELECT id FROM public.pontos_turisticos WHERE slug='orla-da-praia')::UUID],
 ARRAY['Motorista-guia local', 'Veículo com ar-condicionado', 'Travessia de balsa inclusa', 'Água mineral'],
 ARRAY['Esportes aquáticos', 'Alimentação', 'Ingressos'],
 'Roteiro pode incluir paradas para surf e stand-up paddle.', false);

-- ─── 9. DADOS INICIAIS: Cruzeiros de exemplo ───
INSERT INTO public.cruzeiros (navio, companhia, data_chegada, hora_chegada, data_saida, hora_saida, passageiros, rota) VALUES
('MSC Seaview', 'MSC Cruzeiros', '2026-11-05', '07:00', '2026-11-05', '17:00', 4200, 'Santos-Buenos Aires'),
('Costa Fascinosa', 'Costa Cruzeiros', '2026-11-08', '08:00', '2026-11-08', '16:00', 3000, 'Santos-Rio-Salvador'),
('MSC Splendida', 'MSC Cruzeiros', '2026-11-12', '07:00', '2026-11-12', '18:00', 3900, 'Santos-Ilhabela-Paraty'),
('Royal Princess', 'Princess Cruises', '2026-11-15', '06:30', '2026-11-15', '17:30', 3600, 'Buenos Aires-Santos-Rio');

-- ═══════════════════════════════════════════════════════════════
-- PRONTO! Etapa 6 completa no banco.
-- ═══════════════════════════════════════════════════════════════
