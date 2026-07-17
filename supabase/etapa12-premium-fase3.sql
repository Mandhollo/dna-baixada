-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 12: MÓDULO PREMIUM (Fase 3)
-- Comunidade + IA + Previsão de Demanda + Metas Inteligentes
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA COMUNIDADE_CATEGORIAS ───
CREATE TABLE IF NOT EXISTS public.comunidade_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  icone TEXT NOT NULL DEFAULT 'message-circle',
  cor_hex TEXT NOT NULL DEFAULT '#0A2463',
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. TABELA COMUNIDADE_TOPICOS (posts do fórum) ───
CREATE TABLE IF NOT EXISTS public.comunidade_topicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES public.comunidade_categorias(id) ON DELETE SET NULL,
  autor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,

  -- Tipo de tópico
  tipo TEXT NOT NULL DEFAULT 'discussao' CHECK (tipo IN (
    'discussao', 'sugestao', 'duvida', 'aviso', 'denuncia', 'grupo_cidade'
  )),

  -- Para sugestões: status de votação
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN (
    'aberto', 'em_analise', 'aprovado', 'recusado', 'implementado', 'fechado'
  )),

  -- Cidade (para grupos por cidade)
  cidade TEXT,

  -- Anexos
  imagem_url TEXT,
  anexos JSONB DEFAULT '[]',

  -- Fixado (destaque)
  fixado BOOLEAN NOT NULL DEFAULT false,

  -- Contadores
  total_votos INTEGER NOT NULL DEFAULT 0,
  total_respostas INTEGER NOT NULL DEFAULT 0,
  total_visualizacoes INTEGER NOT NULL DEFAULT 0,

  ativo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comunidade_topicos_categoria
  ON public.comunidade_topicos(categoria_id, ativo);
CREATE INDEX IF NOT EXISTS idx_comunidade_topicos_autor
  ON public.comunidade_topicos(autor_id);
CREATE INDEX IF NOT EXISTS idx_comunidade_topicos_tipo
  ON public.comunidade_topicos(tipo, ativo);
CREATE INDEX IF NOT EXISTS idx_comunidade_topicos_cidade
  ON public.comunidade_topicos(cidade) WHERE cidade IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comunidade_topicos_recente
  ON public.comunidade_topicos(created_at DESC) WHERE ativo = true;

-- ─── 3. TABELA COMUNIDADE_RESPOSTAS ───
CREATE TABLE IF NOT EXISTS public.comunidade_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topico_id UUID NOT NULL REFERENCES public.comunidade_topicos(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  conteudo TEXT NOT NULL,
  imagem_url TEXT,

  -- Melhor resposta (marca do autor do tópico)
  melhor_resposta BOOLEAN NOT NULL DEFAULT false,

  total_votos INTEGER NOT NULL DEFAULT 0,

  ativo BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comunidade_respostas_topico
  ON public.comunidade_respostas(topico_id, ativo);

-- ─── 4. TABELA COMUNIDADE_VOTOS ───
CREATE TABLE IF NOT EXISTS public.comunidade_votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topico_id UUID REFERENCES public.comunidade_topicos(id) ON DELETE CASCADE,
  resposta_id UUID REFERENCES public.comunidade_respostas(id) ON DELETE CASCADE,

  -- voto = 1 (upvote), -1 (downvote)
  valor INTEGER NOT NULL CHECK (valor IN (1, -1)),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Um voto por usuário por item
  UNIQUE(usuario_id, topico_id),
  UNIQUE(usuario_id, resposta_id)
);

-- ─── 5. TABELA DEMANDA_REGIOES (Previsão de Demanda) ───
CREATE TABLE IF NOT EXISTS public.demanda_regioes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome TEXT NOT NULL,              -- "Centro de Santos", "Praia Grande"
  cidade TEXT NOT NULL,
  bairro TEXT,

  -- Localização (centro da região)
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  raio_km NUMERIC(5,2) NOT NULL DEFAULT 2.0,

  -- Nível de demanda atual (0-100)
  nivel_demanda INTEGER NOT NULL DEFAULT 50 CHECK (nivel_demanda >= 0 AND nivel_demanda <= 100),

  -- Previsão por horário (JSON: {"06": 30, "07": 60, "08": 80, ...})
  demanda_por_hora JSONB DEFAULT '{}',

  -- Melhores horários
  melhores_horarios TEXT[] DEFAULT '{}',

  -- Fatores que influenciam
  fatores TEXT[] DEFAULT '{}',  -- ["Estação", "Shopping", "Universidade", "Porto"]

  -- Eventos próximos que aumentam demanda
  evento_proximo TEXT,
  evento_fim TIMESTAMPTZ,

  -- Previsão de turistas (chegada de cruzeiros)
  aumento_turismo_percentual INTEGER DEFAULT 0,

  -- Cor no mapa de calor
  cor_hex TEXT DEFAULT '#F5A623',

  ativo BOOLEAN NOT NULL DEFAULT true,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demanda_regioes_cidade
  ON public.demanda_regioes(cidade, ativo);
CREATE INDEX IF NOT EXISTS idx_demanda_regioes_nivel
  ON public.demanda_regioes(nivel_demanda DESC);

-- ─── 6. TABELA DEMANDA_EVENTOS (eventos que geram pico de corridas) ───
CREATE TABLE IF NOT EXISTS public.demanda_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome TEXT NOT NULL,
  descricao TEXT,
  cidade TEXT NOT NULL,
  local TEXT,

  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Quando
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,

  -- Tipo
  tipo TEXT NOT NULL CHECK (tipo IN (
    'show', 'jogo', 'feira', 'congresso', 'cruzeiro', 'feriado',
    'clima', 'transito', 'outro'
  )),

  -- Impacto previsto
  aumento_demanda_percentual INTEGER NOT NULL DEFAULT 20,
  corridas_estimadas INTEGER,

  -- Recomendação para motoristas
  recomendacao TEXT,

  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_demanda_eventos_data
  ON public.demanda_eventos(data_inicio, ativo);
CREATE INDEX IF NOT EXISTS idx_demanda_eventos_cidade
  ON public.demanda_eventos(cidade, ativo);

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.comunidade_categorias (nome, slug, descricao, icone, cor_hex, ordem) VALUES
('Discussões Gerais', 'discussoes', 'Converse sobre tudo relacionado à rotina de motorista', 'message-circle', '#0A2463', 1),
('Sugestões', 'sugestoes', 'Proponha melhorias e vote nas ideias dos colegas', 'lightbulb', '#F5A623', 2),
('Dúvidas', 'duvidas', 'Tire suas dúvidas com a comunidade', 'help-circle', '#14A76C', 3),
('Grupos por Cidade', 'grupos', 'Conecte-se com motoristas da sua cidade', 'users', '#7c3aed', 4),
('Avisos', 'avisos', 'Comunicados importantes da plataforma', 'bell', '#E84855', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.demanda_regioes
  (nome, cidade, bairro, latitude, longitude, raio_km, nivel_demanda,
   demanda_por_hora, melhores_horarios, fatores, cor_hex, ativo)
VALUES
('Centro de Santos', 'Santos', 'Centro', -23.9608, -46.3331, 2.0, 75,
 '{"6":40,"7":70,"8":85,"9":60,"10":45,"11":50,"12":65,"13":55,"14":40,"15":45,"16":55,"17":70,"18":90,"19":80,"20":65}',
 ARRAY['08h','18h','19h'], ARRAY['Porto','Shopping','Bancos','Escritórios'], '#E84855', true),
('Praia Grande - Oriçanga', 'Praia Grande', 'Oriçanga', -24.0058, -46.4133, 2.5, 65,
 '{"6":30,"7":50,"8":55,"9":40,"10":35,"11":40,"12":50,"13":45,"14":35,"15":45,"16":60,"17":75,"18":80,"19":70,"20":55}',
 ARRAY['17h','18h','19h'], ARRAY['Shopping','Praia','Residencial'], '#F5A623', true),
('Gonzaga', 'Santos', 'Gonzaga', -23.9815, -46.3138, 1.5, 70,
 '{"6":35,"7":55,"8":65,"9":50,"10":45,"11":55,"12":60,"13":50,"14":45,"15":50,"16":60,"17":75,"18":85,"19":75,"20":60}',
 ARRAY['18h','19h'], ARRAY['Shopping','Hoteis','Restaurantes','Praia'], '#E84855', true),
('São Vicente - Centro', 'São Vicente', 'Centro', -23.9645, -46.3921, 2.0, 55,
 '{"6":25,"7":45,"8":55,"9":40,"10":35,"11":40,"12":50,"13":45,"14":35,"15":40,"16":50,"17":65,"18":70,"19":60,"20":45}',
 ARRAY['17h','18h'], ARRAY['Estação','Comércio','Escolas'], '#F5A623', true),
('Guarujá - Pitangueiras', 'Guarujá', 'Pitangueiras', -23.9810, -46.2560, 1.5, 60,
 '{"6":20,"7":35,"8":45,"9":40,"10":50,"11":60,"12":70,"13":65,"14":55,"15":60,"16":70,"17":80,"18":85,"19":75,"20":60}',
 ARRAY['17h','18h','19h'], ARRAY['Praia','Hoteis','Restaurantes','Turismo'], '#F5A623', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.demanda_eventos
  (nome, descricao, cidade, local, data_inicio, data_fim, tipo,
   aumento_demanda_percentual, corridas_estimadas, recomendacao, ativo)
VALUES
('Chegada de Cruzeiro - MSC', 'Navio MSC com 3.000 passageiros aportando no Concais',
 'Santos', 'Concais - terminal marítimo',
 now() + interval '2 days', now() + interval '2 days 12 hours',
 'cruzeiro', 45, 350,
 'Fique posicionado perto do Concais a partir das 8h. Demanda de transfers para hotéis e aeroporto.', true),
('Jogo no Estádio', 'Santos FC jogando no Estádio da Vila Belmiro',
 'Santos', 'Vila Belmiro',
 now() + interval '5 days 16 hours', now() + interval '5 days 20 hours',
 'jogo', 80, 500,
 'Posicione perto do estádio 1h antes do jogo e 30min após o término. Demanda massiva.', true),
('Feira de Santos', 'Feira de artesanato e gastronomia na orla',
 'Santos', 'Orla da praia',
 now() + interval '3 days', now() + interval '4 days',
 'feira', 25, 120,
 'Horários de pico: sábado à tarde e domingo pela manhã.', true)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS + RLS
-- ═══════════════════════════════════════════════════════════════

CREATE TRIGGER comunidade_topicos_updated_at
  BEFORE UPDATE ON public.comunidade_topicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER comunidade_respostas_updated_at
  BEFORE UPDATE ON public.comunidade_respostas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER demanda_regioes_updated_at
  BEFORE UPDATE ON public.demanda_regioes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Incrementar contador de respostas
CREATE OR REPLACE FUNCTION public.incrementar_resposta_topico()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.comunidade_topicos
  SET total_respostas = total_respostas + 1
  WHERE id = NEW.topico_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_resposta_insert
  AFTER INSERT ON public.comunidade_respostas
  FOR EACH ROW EXECUTE FUNCTION public.incrementar_resposta_topico();

-- RLS
ALTER TABLE public.comunidade_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunidade_topicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunidade_respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comunidade_votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demanda_regioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demanda_eventos ENABLE ROW LEVEL SECURITY;

-- Comunidade: categorias públicas
CREATE POLICY "Categorias da comunidade visíveis para logados"
  ON public.comunidade_categorias FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

-- Tópicos: visíveis para logados
CREATE POLICY "Tópicos visíveis para logados"
  ON public.comunidade_topicos FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

CREATE POLICY "Motorista cria tópicos"
  ON public.comunidade_topicos FOR INSERT
  WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "Autor edita próprio tópico"
  ON public.comunidade_topicos FOR UPDATE
  USING (auth.uid() = autor_id);

CREATE POLICY "Admin gerencia tópicos"
  ON public.comunidade_topicos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Respostas
CREATE POLICY "Respostas visíveis para logados"
  ON public.comunidade_respostas FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

CREATE POLICY "Motorista cria respostas"
  ON public.comunidade_respostas FOR INSERT
  WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "Autor edita própria resposta"
  ON public.comunidade_respostas FOR UPDATE
  USING (auth.uid() = autor_id);

-- Votos
CREATE POLICY "Motorista vê próprios votos"
  ON public.comunidade_votos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Motorista vota"
  ON public.comunidade_votos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Motorista altera próprio voto"
  ON public.comunidade_votos FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Motorista remove próprio voto"
  ON public.comunidade_votos FOR DELETE
  USING (auth.uid() = usuario_id);

-- Demanda regiões: visíveis para logados
CREATE POLICY "Regiões de demanda visíveis para logados"
  ON public.demanda_regioes FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

CREATE POLICY "Admin gerencia regiões de demanda"
  ON public.demanda_regioes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Demanda eventos: visíveis para logados
CREATE POLICY "Eventos de demanda visíveis para logados"
  ON public.demanda_eventos FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

CREATE POLICY "Admin gerencia eventos de demanda"
  ON public.demanda_eventos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ═══════════════════════════════════════════════════════════════
-- FIM — Etapa 12: Módulo Premium (Fase 3)
-- ═══════════════════════════════════════════════════════════════
