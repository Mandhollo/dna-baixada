-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 9: Painel Admin
-- Tabela: logs_admin
-- Views: relatórios administrativos
-- RLS: apenas role=admin
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. TABELA LOGS ADMIN ───
CREATE TABLE IF NOT EXISTS public.logs_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  admin_id UUID NOT NULL REFERENCES public.profiles(id),
  acao TEXT NOT NULL,
  tabela TEXT NOT NULL,
  registro_id TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,

  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_admin_admin ON public.logs_admin(admin_id);
CREATE INDEX IF NOT EXISTS idx_logs_admin_created ON public.logs_admin(created_at DESC);

-- ─── 2. VIEW: RELATÓRIO CORRIDAS ───
CREATE OR REPLACE VIEW public.relatorio_corridas AS
SELECT
  DATE(c.created_at) AS data,
  c.tipo,
  c.status,
  COUNT(*) AS total,
  COALESCE(SUM(c.preco_final), 0) AS faturamento
FROM public.corridas c
GROUP BY DATE(c.created_at), c.tipo, c.status
ORDER BY data DESC;

-- ─── 3. VIEW: RELATÓRIO MOTORISTAS ───
CREATE OR REPLACE VIEW public.relatorio_motoristas AS
SELECT
  p.id,
  p.nome,
  p.email,
  p.telefone,
  p.created_at,
  m.status,
  m.veiculo_modelo,
  m.veiculo_placa,
  p.avaliacao_media,
  m.total_corridas,
  m.disponivel
FROM public.profiles p
JOIN public.motoristas m ON m.id = p.id
ORDER BY p.created_at DESC;

-- ─── 4. VIEW: RELATÓRIO FINANCEIRO ───
CREATE OR REPLACE VIEW public.relatorio_financeiro AS
SELECT
  DATE(t.created_at) AS data,
  t.tipo,
  COUNT(*) AS total_transacoes,
  COALESCE(SUM(t.valor_bruto), 0) AS valor_bruto_total,
  COALESCE(SUM(t.taxa_plataforma), 0) AS taxas_total,
  COALESCE(SUM(t.valor_liquido), 0) AS liquido_total
FROM public.transacoes t
GROUP BY DATE(t.created_at), t.tipo
ORDER BY data DESC;

-- ─── 5. VIEW: STATS GERAIS (para dashboard) ───
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT count(*) FROM public.profiles) AS total_usuarios,
  (SELECT count(*) FROM public.profiles WHERE role = 'passageiro') AS total_passageiros,
  (SELECT count(*) FROM public.profiles WHERE role = 'motorista') AS total_motoristas,
  (SELECT count(*) FROM public.profiles WHERE role = 'parceiro') AS total_parceiros,
  (SELECT count(*) FROM public.corridas) AS total_corridas,
  (SELECT count(*) FROM public.corridas WHERE status = 'concluida') AS corridas_concluidas,
  (SELECT COALESCE(SUM(preco_final), 0) FROM public.corridas WHERE status = 'concluida') AS faturamento_total,
  (SELECT count(*) FROM public.corridas WHERE status = 'solicitada' OR status = 'aceita') AS corridas_ativas,
  (SELECT count(*) FROM public.estabelecimentos) AS total_estabelecimentos,
  (SELECT count(*) FROM public.campanhas_sociais WHERE status = 'ativa') AS campanhas_ativas,
  (SELECT count(*) FROM public.participacoes_sociais) AS total_participacoes,
  (SELECT COALESCE(SUM(pontos), 0) FROM public.historico_pontos WHERE pontos > 0) AS pontos_distribuidos;

-- ─── 6. RLS ───
ALTER TABLE public.logs_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin logs read" ON public.logs_admin FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin logs insert" ON public.logs_admin FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Permitir que admin leia todas as tabelas sensíveis
CREATE POLICY "Admin read corridas" ON public.corridas FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin update corridas" ON public.corridas FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin read transacoes" ON public.transacoes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin manage motoristas" ON public.motoristas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin manage estabelecimentos" ON public.estabelecimentos FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin manage campanhas_sociais" ON public.campanhas_sociais FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin manage recompensas" ON public.recompensas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin manage config_taxas" ON public.config_taxas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admin read profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admin update profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ═══════════════════════════════════════════════════════════════
-- PRONTO! Etapa 9 completa no banco.
-- ═══════════════════════════════════════════════════════════════
