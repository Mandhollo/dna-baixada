-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 11: MÓDULO PREMIUM (Fase 2)
-- Central de Benefícios + Saúde e Bem-estar + Educação
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA BENEFICIOS_PARCEIROS (Central de Benefícios) ───
-- Convênios voltados ao motorista: postos, oficinas, autopeças etc.
CREATE TABLE IF NOT EXISTS public.beneficios_parceiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dados do parceiro
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN (
    'combustivel', 'oficina', 'troca_oleo', 'lavagem', 'pneus',
    'auto_eletrica', 'funilaria', 'loja_auto', 'alimentacao',
    'farmacia', 'academia', 'barbearia', 'clinica', 'outro'
  )),

  -- Desconto oferecido aos motoristas DNA
  desconto_descricao TEXT NOT NULL,  -- "15% em combustível"
  desconto_percentual NUMERIC(5,2),  -- 15.00 (opcional, para ordenar)
  condicoes TEXT,                     -- "Válido de seg a sex"

  -- Contato
  telefone TEXT,
  whatsapp TEXT,
  endereco TEXT,
  cidade TEXT NOT NULL DEFAULT 'Santos',

  -- Localização
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Identidade visual
  logo_url TEXT,
  foto_url TEXT,

  -- Exclusivo DNA Pass (desconto maior para assinantes)
  dna_pass_exclusivo BOOLEAN NOT NULL DEFAULT false,
  desconto_dna_pass TEXT,  -- "25% com DNA Pass"

  -- Status
  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  verificado BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beneficios_parceiros_categoria
  ON public.beneficios_parceiros(categoria, ativo);
CREATE INDEX IF NOT EXISTS idx_beneficios_parceiros_cidade
  ON public.beneficios_parceiros(cidade, ativo);
CREATE INDEX IF NOT EXISTS idx_beneficios_parceiros_destaque
  ON public.beneficios_parceiros(destaque, ativo);

-- ─── 2. TABELA PARCEIROS_SAUDE (Saúde e Bem-estar) ───
CREATE TABLE IF NOT EXISTS public.parceiros_saude (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'psicologo', 'nutricionista', 'fisioterapeuta',
    'academia', 'clinica', 'medico', 'outro'
  )),

  -- Descrição do serviço
  descricao TEXT,
  especialidades TEXT[] DEFAULT '{}',  -- ["Ansiedade", "Ergonomia"]

  -- Desconto para motoristas DNA
  desconto_descricao TEXT,
  desconto_percentual NUMERIC(5,2),

  -- Atende por convênio?
  aceita_convenio BOOLEAN NOT NULL DEFAULT false,
  convenios TEXT[] DEFAULT '{}',  -- ["Unimed", "Bradesco Saúde"]

  -- Atendimento online?
  atendimento_online BOOLEAN NOT NULL DEFAULT false,
  atendimento_presencial BOOLEAN NOT NULL DEFAULT true,

  -- Contato
  telefone TEXT,
  whatsapp TEXT,
  endereco TEXT,
  cidade TEXT NOT NULL DEFAULT 'Santos',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  logo_url TEXT,
  foto_url TEXT,

  -- DNA Pass exclusivo
  dna_pass_exclusivo BOOLEAN NOT NULL DEFAULT false,
  desconto_dna_pass TEXT,

  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parceiros_saude_tipo
  ON public.parceiros_saude(tipo, ativo);
CREATE INDEX IF NOT EXISTS idx_parceiros_saude_cidade
  ON public.parceiros_saude(cidade, ativo);

-- ─── 3. TABELA CURSOS (Educação) ───
CREATE TABLE IF NOT EXISTS public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  titulo TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT NOT NULL,
  descricao_curta TEXT,

  categoria TEXT NOT NULL CHECK (categoria IN (
    'direcao_defensiva', 'atendimento', 'primeiros_socorros',
    'idiomas', 'educacao_financeira', 'marketing', 'gestao', 'outro'
  )),

  -- Conteúdo
  carga_horaria_horas INTEGER NOT NULL DEFAULT 1,
  nivel TEXT NOT NULL DEFAULT 'basico' CHECK (nivel IN ('basico', 'intermediario', 'avancado')),

  -- Módulos (array de objetos JSON)
  modulos JSONB NOT NULL DEFAULT '[]',
  total_modulos INTEGER NOT NULL DEFAULT 0,

  -- Mídia
  imagem_url TEXT,
  video_intro_url TEXT,

  -- Recompensa por conclusão
  pontos_recompensa INTEGER NOT NULL DEFAULT 50,
  certificado_disponivel BOOLEAN NOT NULL DEFAULT true,

  -- Nível mínimo do motorista para acessar (null = todos)
  nivel_minimo TEXT CHECK (nivel_minimo IN ('bronze','prata','ouro','platinum','elite') OR nivel_minimo IS NULL),

  -- DNA Pass exclusivo
  dna_pass_exclusivo BOOLEAN NOT NULL DEFAULT false,

  -- Instrutor
  instrutor_nome TEXT,
  instrutor_bio TEXT,

  ativo BOOLEAN NOT NULL DEFAULT true,
  destaque BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,

  -- Contadores
  total_matriculas INTEGER NOT NULL DEFAULT 0,
  total_concluidos INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cursos_categoria
  ON public.cursos(categoria, ativo);
CREATE INDEX IF NOT EXISTS idx_cursos_destaque
  ON public.cursos(destaque, ativo);

-- ─── 4. TABELA CURSO_PROGRESSO (Matrículas e progresso) ───
CREATE TABLE IF NOT EXISTS public.curso_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  motorista_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'matriculado' CHECK (status IN (
    'matriculado', 'em_andamento', 'concluido', 'abandonado'
  )),

  -- Progresso
  modulos_concluidos INTEGER[] DEFAULT '{}',
  progresso_percentual INTEGER NOT NULL DEFAULT 0 CHECK (progresso_percentual >= 0 AND progresso_percentual <= 100),

  -- Datas
  matriculado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  iniciado_em TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,

  -- Avaliação e certificado
  nota_final NUMERIC(5,2),
  certificado_url TEXT,
  certificado_emitido_em TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(curso_id, motorista_id)
);

CREATE INDEX IF NOT EXISTS idx_curso_progresso_motorista
  ON public.curso_progresso(motorista_id, status);
CREATE INDEX IF NOT EXISTS idx_curso_progresso_curso
  ON public.curso_progresso(curso_id, status);

-- ═══════════════════════════════════════════════════════════════
-- 5. SEED — Benefícios Parceiros
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.beneficios_parceiros
  (nome, categoria, desconto_descricao, desconto_percentual, condicoes,
   telefone, cidade, dna_pass_exclusivo, desconto_dna_pass,
   ativo, destaque, verificado, ordem)
VALUES
('Auto Posto Santos', 'combustivel', 'R$ 0,20 de desconto por litro', NULL, 'Todos os dias, 24h', '(13) 3232-1000', 'Santos', true, 'R$ 0,35 por litro', true, true, true, 1),
('Oficina Central Motors', 'oficina', '15% em revisões e manutenções', 15.00, 'Agendamento prévio', '(13) 3222-3456', 'Santos', false, NULL, true, false, true, 2),
('Troca Óleo Express', 'troca_oleo', '20% em troca de óleo e filtros', 20.00, NULL, '(13) 3322-7890', 'São Vicente', false, '30% com DNA Pass', true, true, true, 3),
('Lava Jato Aqua', 'lavagem', '25% em lavagem e polimento', 25.00, 'Seg a Qui', '(13) 3461-1234', 'Praia Grande', false, NULL, true, false, true, 4),
('Pneus & Cia', 'pneus', '10% em pneus novos', 10.00, 'Marcas selecionadas', '(13) 3234-5678', 'Santos', true, '15% com DNA Pass', true, true, true, 5),
('Auto Elétrica Silva', 'auto_eletrica', '15% em serviços elétricos', 15.00, NULL, '(13) 3322-4567', 'Santos', false, NULL, true, false, false, 6),
('Funilaria Premium', 'funilaria', '12% em funilaria e pintura', 12.00, 'Orçamento grátis', '(13) 3221-9988', 'Guarujá', false, NULL, true, false, false, 7),
('Auto Peças Baixada', 'loja_auto', '10% em peças e acessórios', 10.00, NULL, '(13) 3461-5566', 'Praia Grande', false, NULL, true, false, true, 8),
('Restaurante do Porto', 'alimentacao', 'Refeição a R$ 15,90 para motoristas', NULL, 'Almoço, seg a sex', '(13) 3223-7777', 'Santos', true, 'R$ 12,90 com DNA Pass', true, true, true, 9),
('Farmácia Saúde Total', 'farmacia', '12% em medicamentos', 12.00, NULL, '(13) 3322-1100', 'São Vicente', false, NULL, true, false, true, 10)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 6. SEED — Parceiros Saúde
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.parceiros_saude
  (nome, tipo, descricao, especialidades, desconto_descricao, desconto_percentual,
   aceita_convenio, convenios, atendimento_online, atendimento_presencial,
   telefone, whatsapp, cidade, dna_pass_exclusivo, desconto_dna_pass,
   ativo, destaque, ordem)
VALUES
('Dra. Marina Costa — Psicóloga', 'psicologo', 'Atendimento psicológico focado em saúde mental de motoristas de aplicativo',
 ARRAY['Ansiedade', 'Stresse ocupacional', 'Depressão'], '20% nas sessões', 20.00,
 false, ARRAY[]::TEXT[], true, true,
 '(13) 99777-1001', '(13) 99777-1001', 'Santos', true, '30% com DNA Pass', true, true, 1),
('Espaço Nutri Baixada', 'nutricionista', 'Consultoria nutricional para rotina de motorista',
 ARRAY['Emagrecimento', 'Alimentação saudável na estrada'], '15% na consulta', 15.00,
 false, ARRAY[]::TEXT[], true, true,
 '(13) 3322-2002', NULL, 'Santos', false, NULL, true, false, 2),
('Fisio Movimento', 'fisioterapeuta', 'Fisioterapia preventiva e tratamento de dores na coluna',
 ARRAY['Coluna', 'Ergonomia veicular', 'Lombalgia'], '25% nas sessões', 25.00,
 true, ARRAY['Unimed'], false, true,
 '(13) 3234-3003', '(13) 99888-3003', 'São Vicente', false, '35% com DNA Pass', true, true, 3),
('Smart Fit Santos', 'academia', 'Mensalidade reduzida para motoristas DNA',
 ARRAY['Musculação', 'Funcional'], 'Mensalidade R$ 59,90', NULL,
 false, ARRAY[]::TEXT[], false, true,
 '(13) 3222-4004', NULL, 'Santos', true, 'R$ 49,90 com DNA Pass', true, false, 4),
('Clínica Vida Plena', 'clinica', 'Check-ups e exames preventivos com desconto',
 ARRAY['Check-up', 'Exames laboratoriais'], '30% em exames', 30.00,
 true, ARRAY['Unimed', 'Bradesco Saúde', 'SulAmérica'], false, true,
 '(13) 3232-5005', NULL, 'Praia Grande', false, NULL, true, true, 5)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 7. SEED — Cursos
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.cursos
  (titulo, slug, descricao, descricao_curta, categoria,
   carga_horaria_horas, nivel, modulos, total_modulos,
   pontos_recompensa, nivel_minimo, dna_pass_exclusivo,
   instrutor_nome, ativo, destaque, ordem)
VALUES
('Direção Defensiva na Prática', 'direcao-defensiva',
 'Aprenda técnicas de direção defensiva para reduzir acidentes e aumentar sua segurança no trânsito.',
 'Técnicas para dirigir com mais segurança',
 'direcao_defensiva', 4, 'basico',
 '[{"titulo":"Fundamentos da Direção Defensiva","duracao_min":45},{"titulo":"Antecipação e Percepção de Riscos","duracao_min":50},{"titulo":"Condução em Condições Adversas","duracao_min":55},{"titulo":"Postura ao Volante e Ergonomia","duracao_min":40}]',
 4, 80, NULL, false, 'Carlos Mendes — Instrutor DETRAN', true, true, 1),
('Atendimento ao Turista', 'atendimento-turista',
 'Como receber bem turistas, oferecer informações locais e fidelizar passageiros que visitam a Baixada Santista.',
 'Encante passageiros e ganhe mais avaliações 5 estrelas',
 'atendimento', 3, 'basico',
 '[{"titulo":"Primeiras Impressões","duracao_min":35},{"titulo":"Conhecendo a Baixada Santista","duracao_min":50},{"titulo":"Comunicação Eficaz","duracao_min":40}]',
 3, 60, NULL, false, 'Ana Paula Turismo — Guia Certificada', true, true, 2),
('Primeiros Socorros para Motoristas', 'primeiros-socorros',
 'Saiba como agir em emergências enquanto dirige. Conteúdo essencial para qualquer motorista profissional.',
 'Proteja vidas em situações de emergência',
 'primeiros_socorros', 5, 'intermediario',
 '[{"titulo":"Reconhecimento de Emergências","duracao_min":40},{"titulo":"RCP Básico","duracao_min":60},{"titulo":"Hemorragias e Ferimentos","duracao_min":45},{"titulo":"Chamando o SAMU","duracao_min":30},{"titulo":"Primeiros Socorros no Trânsito","duracao_min":55}]',
 5, 100, NULL, false, 'Dr. Roberto Lima — Médico Emergencista', true, false, 3),
('Inglês Básico para Motoristas', 'ingles-basico',
 'Frases essenciais em inglês para atender passageiros estrangeiros e turistas de cruzeiros.',
 'Comunique-se com turistas do mundo todo',
 'idiomas', 6, 'basico',
 '[{"titulo":"Saudações e Apresentações","duracao_min":45},{"titulo":"Direções e Endereços","duracao_min":50},{"titulo":"Conversa Básica","duracao_min":55},{"titulo":"No Aeroporto e Hotel","duracao_min":50},{"titulo":"Números e Pagamentos","duracao_min":40},{"titulo":"Situações Comuns","duracao_min":45}]',
 6, 120, NULL, false, 'Sarah Johnson — Professora CELTA', true, true, 4),
('Educação Financeira: Como Aumentar Ganhos', 'educacao-financeira',
 'Gestão financeira para motoristas de app. Controle seus ganhos, organize despesas e planeje o futuro.',
 'Organize suas finanças e lucre mais',
 'educacao_financeira', 4, 'basico',
 '[{"titulo":"Mapeando seus Ganhos","duracao_min":40},{"titulo":"Controlando Despesas do Veículo","duracao_min":45},{"titulo":"Otimizando Horários Lucrativos","duracao_min":50},{"titulo":"Reserva de Emergência","duracao_min":35}]',
 4, 100, NULL, false, 'Marcos Finance — Consultor Financeiro', true, false, 5),
('Marketing Pessoal para Motoristas', 'marketing-pessoal',
 'Como se destacar entre milhares de motoristas, construir sua marca pessoal e receber avaliações 5 estrelas.',
 'Destaque-se como motorista e construa sua reputação',
 'marketing', 3, 'intermediario',
 '[{"titulo":"Sua Marca é Você","duracao_min":35},{"titulo":"Higiene e Apresentação do Veículo","duracao_min":40},{"titulo":"Redes Sociais para Motoristas","duracao_min":45}]',
 3, 80, 'prata', false, 'Júlia Marketing — Social Media', true, false, 6),
('Espanhol Básico para Motoristas', 'espanhol-basico',
 'Comunique-se com passageiros hispano-americanos. Frases práticas para o dia a dia.',
 'Atenda passageiros de toda a América Latina',
 'idiomas', 5, 'basico',
 '[{"titulo":"Saludos y Presentaciones","duracao_min":40},{"titulo":"Direcciones y Ubicaciones","duracao_min":45},{"titulo":"Conversación Básica","duracao_min":50},{"titulo":"Números y Pagos","duracao_min":35},{"titulo":"Situaciones Comunes","duracao_min":40}]',
 5, 100, NULL, false, 'Carmen Ruiz — Profesora DELE', true, false, 7)
ON CONFLICT (slug) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- 8. TRIGGERS — updated_at
-- ═══════════════════════════════════════════════════════════════

CREATE TRIGGER beneficios_parceiros_updated_at
  BEFORE UPDATE ON public.beneficios_parceiros
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER parceiros_saude_updated_at
  BEFORE UPDATE ON public.parceiros_saude
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER cursos_updated_at
  BEFORE UPDATE ON public.cursos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER curso_progresso_updated_at
  BEFORE UPDATE ON public.curso_progresso
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── Função: incrementar matrículas ao se matricular ───
CREATE OR REPLACE FUNCTION public.incrementar_matricula()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.cursos
  SET total_matriculas = total_matriculas + 1
  WHERE id = NEW.curso_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_curso_progresso_insert
  AFTER INSERT ON public.curso_progresso
  FOR EACH ROW EXECUTE FUNCTION public.incrementar_matricula();

-- ─── Função: incrementar conclusões ao concluir curso ───
CREATE OR REPLACE FUNCTION public.atualizar_conclusao_curso()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    UPDATE public.cursos
    SET total_concluidos = total_concluidos + 1
    WHERE id = NEW.curso_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_curso_progresso_concluido
  AFTER UPDATE OF status ON public.curso_progresso
  FOR EACH ROW EXECUTE FUNCTION public.atualizar_conclusao_curso();

-- ═══════════════════════════════════════════════════════════════
-- 9. RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.beneficios_parceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parceiros_saude ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curso_progresso ENABLE ROW LEVEL SECURITY;

-- ─── Benefícios Parceiros: públicos ativos ───
CREATE POLICY "Benefícios ativos visíveis para logados"
  ON public.beneficios_parceiros FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

CREATE POLICY "Admin gerencia benefícios parceiros"
  ON public.beneficios_parceiros FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Parceiros Saúde: públicos ativos ───
CREATE POLICY "Parceiros saúde ativos visíveis para logados"
  ON public.parceiros_saude FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

CREATE POLICY "Admin gerencia parceiros saúde"
  ON public.parceiros_saude FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Cursos: públicos ativos ───
CREATE POLICY "Cursos ativos visíveis para logados"
  ON public.cursos FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

CREATE POLICY "Admin gerencia cursos"
  ON public.cursos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Curso Progresso: motorista vê e edita próprio progresso ───
CREATE POLICY "Motorista vê próprio progresso de cursos"
  ON public.curso_progresso FOR SELECT
  USING (motorista_id = auth.uid());

CREATE POLICY "Motorista matricula-se em cursos"
  ON public.curso_progresso FOR INSERT
  WITH CHECK (motorista_id = auth.uid());

CREATE POLICY "Motorista atualiza próprio progresso"
  ON public.curso_progresso FOR UPDATE
  USING (motorista_id = auth.uid());

CREATE POLICY "Admin vê todo progresso de cursos"
  ON public.curso_progresso FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ═══════════════════════════════════════════════════════════════
-- FIM — Etapa 11: Módulo Premium (Fase 2)
-- ═══════════════════════════════════════════════════════════════
