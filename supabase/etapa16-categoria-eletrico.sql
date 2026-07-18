-- ═══════════════════════════════════════════════════════════════
-- DNA BAIXADA — Etapa 16: Categoria Elétrico/Híbrido
-- Adiciona nova categoria de corrida sustentável
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. ATUALIZAR CONSTRAINT DA COLUNA TIPO EM CORRIDAS ───
-- Remove constraint antigo e cria novo incluindo 'eletrico_hibrido'
ALTER TABLE public.corridas DROP CONSTRAINT IF EXISTS corridas_tipo_check;

ALTER TABLE public.corridas ADD CONSTRAINT corridas_tipo_check
  CHECK (tipo IN (
    'urbana', 'executivo', 'eletrico_hibrido',
    'transfer_aeroporto', 'transfer_rodoviaria',
    'transfer_hotel', 'transfer_cruzeiro',
    'city_tour', 'passeio_turistico'
  ));

-- ─── 2. ADICIONAR LABEL NO CONFIG DE CORRIDAS ───
-- Se existir tabela de configuração de tipos, atualizar
INSERT INTO public.corrida_tipos (tipo, label, descricao, icone, ativo, ordem)
VALUES (
  'eletrico_hibrido',
  'Elétrico/Híbrido',
  'Veículos elétricos e híbridos — mobilidade sustentável com conforto',
  'leaf',
  true,
  3
) ON CONFLICT (tipo) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- FIM — Etapa 16
-- ═══════════════════════════════════════════════════════════════
