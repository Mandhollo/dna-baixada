# 🔍 RELATÓRIO DE AUDITORIA — BACKEND & DATABASE
## Projeto: DNA Baixada | Data: 2026-06-17

Método: análise estática dos 8 arquivos SQL + 19 rotas de API + cliente Supabase (784 linhas),
**com queries reais** no banco de produção via cliente anônimo @supabase/supabase-js.

---

## 📊 SCORE POR ÁREA

| Área | Score | Status |
|---|---|---|
| Schema SQL (tabelas/colunas/tipos) | 7/10 | Bom, mas com divergências de enum |
| RLS Policies | 5/10 | Leitura protegida, mas INSERT/UPDATE faltantes + recursão + vazamento em views |
| Triggers | 7/10 | Funcionais; alguns sem tratamento de reversão |
| Views | 3/10 | 🚨 Vazam PII para anônimos |
| APIs (19 rotas) | 6/10 | Auth boa, mas 4 rotas quebradas e fluxo de pagamento comprometido |
| Tipos TS vs Schema | 5/10 | Divergências de status que causam erros em runtime |
| Integridade referencial | 8/10 | FKs corretas; integridade dos arrays OK |
| Dados Seed | 7/10 | Presentes em turismo/parceiros/social; eventos vazio |
| Storage Buckets | 4/10 | 4 buckets OK, mas o bucket usado pela rota não existe |
| Funções RPC | 8/10 | aplicar_cupom funciona; triggers OK |
| **SCORE GERAL** | **5.5/10** | **Banco funcional para leitura pública; fluxos críticos (pagamento, upload, indicações) quebrados** |

---

## 🚨 PROBLEMAS CRÍTICOS (bloqueiam funcionalidade core)

### C1. Views ADMIN vazam dados sensíveis (PII) para qualquer pessoa, sem login
**Verificado empiricamente.** As views admin rodam com privilégios do owner (bypassam RLS),
e nenhuma restrição de GRANT/role foi aplicada. Um cliente **anônimo** (sem autenticação) recebe:

- `relatorio_motoristas` → expõe **nome, e-mail, telefone e placa** de TODOS os motoristas:
  ```
  {"nome":"Carlos Motorista","email":"motorista.teste@gmail.com","telefone":"13997042065","placa":"ABC1D23"}
  {"nome":"Anderson N Oliveira","email":"mandhollo@hotmail.com","telefone":"(13) 99704-2065","placa":"PENDENTE"}
  ```
- `admin_stats` → expõe métricas internas: total_usuarios=8, total_motoristas, faturamento, etc.
- `relatorio_corridas` / `relatorio_financeiro` → expõem faturamento e totais de transação.
- `ranking_social` → expõe nomes de todos os perfis.

**Impacto:** Violação de LGPD + exposição de dados de motoristas reais cadastrados.
**Correção:** Aplicar `ALTER VIEW ... SET (security_invoker = true)` em todas as views admin
(para honrar o RLS do caller) **ou** revogar SELECT de `anon` e criar `GRANT SELECT apenas para role admin`
via `auth.jwt() >> 'role'` ou função `is_admin()` SECURITY DEFINER. Repetir para: relatorio_motoristas,
relatorio_corridas, relatorio_financeiro, admin_stats.

### C2. Rota `/api/turismo/roteiros` está QUEBRADA (erro 500 garantido)
A query usa `.select('*, pontos:pontos_turisticos!pontos_ids(*)')`, mas `pontos_ids` é uma coluna
`UUID[]` (array), **não uma foreign key**. PostgREST não consegue inferir a relação:
```
PGRST200 Could not find a relationship between 'roteiros' and 'pontos_turisticos'
```
**Correção:** Remover o join da query e buscar pontos separadamente com `.in('id', roteiro.pontos_ids)`
(como já é feito corretamente em outras rotas). A integridade dos IDs foi validada (4/4, 3/3 resolvem).

### C3. Rota `/api/upload` QUEBRADA — bucket `fotos` não existe
A rota faz `supabase.storage.from('fotos')`, mas o `schema.sql` cria apenas: avatars, documentos,
veiculos, parceiros. Teste real: `upload fotos → Bucket not found`. **Nenhum upload de imagem funciona.**
**Correção:** Criar o bucket `fotos` (ou trocar a rota para usar `avatars`/bucket existente) + adicionar
políticas de storage para `fotos`.

### C4. Tabelas `indicacoes` e `push_subscriptions` NÃO EXISTEM no banco
Teste real: `PGRST205 Could not find the table`. As rotas `/api/indicacoes` (GET/POST) e
`/api/notificacoes/subscribe` (POST/GET/DELETE) consultam tabelas inexistentes → **erro 500**.
Elas aparecem apenas como comentário DDL no código, nunca executadas.
**Correção:** Criar as tabelas (com FKs para `profiles`/`auth.users`, RLS e INSERT policies).

### C5. Status `motorista_chegou` divergente → corrida quebra ao "motorista chegar"
- TypeScript (`CorridaStatus`) e a validação em `PATCH /api/corridas/[id]` incluem `'motorista_chegou'`.
- O CHECK constraint do SQL só permite: `aguardando, aceita, em_andamento, finalizada, cancelada`.
- Consequência: quando o app envia `status=motorista_chegou`, a validação TS passa, mas o **Postgres rejeita** (CHECK violation).
**Correção:** Adicionar `motorista_chegou` ao CHECK constraint do SQL (e tratar o timestamp).

### C6. Webhook de pagamento NÃO FUNCIONA (usa client anônimo, sem service role)
`/api/pagamento/webhook` usa `createSupabaseServerClient()` (anon key + cookies). Webhooks do
Mercado Pago **não enviam cookies de sessão** → roda como anônimo. Combinado com RLS:
- `transacoes.select` → bloqueado (policy exige `auth.uid() = usuario_id`)
- `transacoes.update` → bloqueado (não há UPDATE policy)
- `motoristas.select` / `notificacoes.insert` → bloqueados
**O webhook nunca consegue confirmar um pagamento.** E `.env.local` sequer tem `SERVICE_ROLE_KEY`.
**Correção:** No webhook, instanciar o client com `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS) + validar
assinatura HMAC (já há esboço) para evitar falsificação.

### C7. Faltam policies de INSERT/UPDATE em `transacoes` e `notificacoes`
Análise das policies mostra que `transacoes` só tem SELECT; `notificacoes` tem SELECT/UPDATE/DELETE mas **sem INSERT**.
Logo, para usuários autenticados (via anon key + cookie):
- `POST /api/pagamento/create` → `transacoes.insert` **BLOQUEADO** pelo RLS → não registra a transação.
- `GET /api/pagamento/status/[id]` → `transacoes.update` **BLOQUEADO** → não confirma pagamento.
- `POST /api/notificacoes` (admin) → `notificacoes.insert` **BLOQUEADO**.
- Notificações de "nova corrida" geradas no webhook → bloqueadas.
Hoje as transações só existem porque o trigger `registrar_transacao_corrida` (SECURITY DEFINER) as cria ao finalizar corrida.
**Correção:** Adicionar policies apropriadas (ex.: INSERT em transacoes com `WITH CHECK (auth.uid() = usuario_id)`),
ou mover toda escrita de transação/notificação para funções RPC SECURITY DEFINER.

---

## 🔶 PROBLEMAS ALTOS

### A1. `admin_stats` usa valores de status INVÁLIDOS → dashboard mostra números errados
A view consulta `status = 'concluida'` (não existe; deveria ser `finalizada`) e
`status = 'solicitada'` (não existe; deveria ser `aguardando`). Resultado real:
`corridas_concluidas=0` e `corridas_ativas=0`, embora existam corridas finalizadas e aguardando.
**Correção:** Trocar para `finalizada` e `aguardando`.

### A2. Risco de recursão infinita nas policies admin de `profiles`
`Admin read/update profiles ... USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role='admin'))`.
Uma policy que referencia a própria tabela sob RLS é o anti-pattern clássico do Supabase →
recursão infinita / erro para usuários autenticados. O mesmo padrão se repete em todas as policies "Admin ...".
**Correção:** Criar `CREATE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$ SELECT EXISTS(SELECT 1 FROM profiles WHERE id=auth.uid() AND role='admin') $$;` e usar `is_admin()` nas policies.

### A3. `participacoes_sociais` com policy `USING (true)` → exposição de dados pessoais
A policy `"Participacoes publicas" FOR SELECT USING (true)` permite que **qualquer um (inclusive anônimo)** veja
todas as participações (quem doou, valores, etc.). Hoje há 0 linhas, mas ao usar o recurso vira vazamento.
**Correção:** Restringir a `auth.uid() = usuario_id` ou exponer apenas dados agregados/anonimizados.

### A4. View `ranking_motoristas` expõe ganhos de motoristas a anônimos
Exibe `ganho_total`, `ganho_mes`, `total_corridas` — informações financeiras sensíveis — sem exigir login.
**Correção:** Exigir autenticação (GRANT só para authenticated) ou remover colunas financeiras do ranking público.

---

## 🟡 PROBLEMAS MÉDIOS

- **M1.** `aplicar_cupom` (etapa4) incrementa `usos_contabilizados` sem `SELECT ... FOR UPDATE` →
  race condition permite uso acima do limite sob concorrência.
- **M2.** Triggers `update_recompensa_estoque` e `update_meta_campanha` só incrementam (INSERT);
  não decrementam em DELETE/cancelamento → estoque e metas ficam inconsistentes.
- **M3.** Policy `Parceiro gerencia campanhas FOR ALL` sem `WITH CHECK` explícito — para FOR ALL o
  WITH CHECK defaulta para USING, ok, mas vale revisar se parceiro não deve criar em estabelecimento de outro.
- **M4.** Profiles tem 2 policies SELECT redundantes (`auth.uid() IS NOT NULL` + `auth.uid()=id`) —
  a primeira já torna a segunda desnecessária para SELECT, mas qualquer usuário logado vê todos os profiles.
  Avaliar se expor e-mail/telefone de todos os usuários a qualquer logado é desejável (hoje é o comportamento).
- **M5.** `eventos` existe no schema mas **não tem seed** (0 linhas) — feature sem dados iniciais.

---

## 🟢 PROBLEMAS BAIXOS / OBSERVAÇÕES

- **B1.** Coluna `parceiros.status` reutiliza o tipo `MotoristaStatus` no TS — funciona, mas semanticamente confuso.
- **B2.** Variável `v_cupon` em `aplicar_cupom` (typo de "cupom") — apenas cosmético.
- **B3.** `update_motorista_stats` dispara junto com `registrar_transacao_corrida` e `atualizar_meta_progresso`
  no mesmo `AFTER UPDATE` — 3 triggers por finalização; considerar consolidar para performance.
- **B4.** `avaliacoes` GET usa join `profiles!avaliador_id` — funciona porque profiles SELECT permite qualquer
  logado ver todos; se a policy de profiles for endurecida (A2/M4), este join quebra.
- **B5.** `documentos` é bucket privado mas a rota de upload pública usa `fotos` — sem rota para upload de CNH.
- **B6.** Todas as rotas usam anon key + cookie (RLS respeitado) — bom padrão; o único que deveria usar service
  role (webhook) é justamente o que não usa (C6).

---

## 📋 TABELA RESUMO: RLS / DADOS / LEITURA ANÔNIMA

| Tabela | RLS | Policies (R/W) | Dados | Leitura anon |
|---|---|---|---|---|
| profiles | ✅ | SELECT+INSERT+UPDATE (logado) | 8 | ❌ bloqueado ✓ |
| motoristas | ✅ | SELECT(aprovados/próprio)+INS+UPD | 2 | ❌ bloqueado ✓ |
| parceiros | ✅ | SELECT(aprovados/próprio)+INS+UPD | 0 | ❌ bloqueado ✓ |
| corridas | ✅ | SELECT+INSERT+UPDATE (participantes/admin) | 5 | ❌ bloqueado ✓ |
| mensagens_chat | ✅ | SELECT+INS+UPD (participantes) | 0 | ❌ bloqueado ✓ |
| avaliacoes | ✅ | SELECT+INSERT (participantes) | 0 | ❌ bloqueado ✓ |
| transacoes | ✅ | SELECT apenas; **SEM INSERT/UPDATE** 🚨 | 3 (via trigger) | ❌ bloqueado ✓ |
| cupons | ✅ | SELECT+FOR ALL(parceiro) | 0 | ❌ (requer login) |
| cupons_usados | ✅ | SELECT+INSERT (usuário) | 0 | ❌ bloqueado ✓ |
| config_taxas | ✅ | SELECT (logado) | 8 | ❌ (requer login) |
| notificacoes | ✅ | SELECT+UPD+DEL; **SEM INSERT** 🚨 | 0 | ❌ bloqueado ✓ |
| metas | ✅ | SELECT (logado, ativas) | 6 | ❌ (requer login) |
| meta_progresso | ✅ | SELECT (motorista) | 0 | ❌ bloqueado ✓ |
| incentivos | ✅ | SELECT (logado, ativos) | 5 | ❌ (requer login) |
| pontos_turisticos | ✅ | SELECT (público, ativos) | 9 | ✅ público (ok) |
| roteiros | ✅ | SELECT (público, ativos) | 4 | ✅ público (ok) |
| eventos | ✅ | SELECT (público, ativos) | **0 (sem seed)** | ✅ vazio |
| cruzeiros | ✅ | SELECT (público, ativos) | 4 | ✅ público (ok) |
| estabelecimentos | ✅ | SELECT(público)+FOR ALL(parceiro/admin) | 6 | ✅ público (ok) |
| avaliacoes_parceiro | ✅ | SELECT(true)+INSERT(user) | 0 | ✅ público |
| campanhas_promocionais | ✅ | SELECT(público)+FOR ALL(parceiro) | 4 | ✅ público (ok) |
| campanhas_sociais | ✅ | SELECT(true)+FOR ALL(admin) | 5 | ✅ público (ok) |
| participacoes_sociais | ✅ | SELECT(**true** 🟡)+INSERT(user) | 0 | ✅ **expõe tudo** |
| recompensas | ✅ | SELECT(público)+FOR ALL(admin) | 7 | ✅ público (ok) |
| resgates_recompensas | ✅ | SELECT+INSERT (usuário) | 0 | ❌ bloqueado ✓ |
| historico_pontos | ✅ | SELECT+INSERT (usuário) | 0 | ❌ bloqueado ✓ |
| logs_admin | ✅ | SELECT+INSERT (admin) | 0 | ❌ bloqueado ✓ |
| **indicacoes** | — | **TABELA INEXISTENTE** 🚨 | — | PGRST205 |
| **push_subscriptions** | — | **TABELA INEXISTENTE** 🚨 | — | PGRST205 |

### Views (acesso anônimo):
| View | Anon pode ler? | Problema |
|---|---|---|
| admin_stats | ✅ 🚨 | Vaza métricas internas + usa status inválidos |
| relatorio_motoristas | ✅ 🚨 | **Vaza e-mail/telefone/placa de motoristas** |
| relatorio_corridas | ✅ 🚨 | Vaza faturamento |
| relatorio_financeiro | ✅ 🚨 | Vaza totais financeiros |
| ranking_motoristas | ✅ 🟡 | Vaza ganhos (intencional, mas sensível) |
| ranking_social | ✅ 🟡 | Vaza nomes de todos os perfis |

### Storage:
| Bucket | Existe? | Anon upload? |
|---|---|---|
| avatars | ✅ | ❌ bloqueado ✓ |
| documentos | ✅ | ❌ bloqueado ✓ |
| veiculos | ✅ | ❌ bloqueado ✓ |
| parceiros | ✅ | ❌ bloqueado ✓ |
| **fotos** | ❌ **NÃO EXISTE** 🚨 | — (rota de upload quebrada) |

---

## ✅ O QUE ESTÁ BOM

- Arquitetura geral do schema é bem modelada (27 tabelas, tipos consistentes, índices apropriados).
- Leitura anônima corretamente bloqueada em todas as tabelas sensíveis (testado empiricamente).
- INSERT anônimo bloqueado em todas as tabelas testadas (erro 42501).
- Auth nas rotas de API é consistente (`getUser()` + check 401).
- Recálculo de preço server-side em `/api/corridas` evita tampering do cliente.
- Whitelist de campos editáveis em `/api/profile` (PATCH).
- Validação de nota, tipo de arquivo, tamanho de upload.
- Função RPC `aplicar_cupom` funciona e valida corretamente.
- Integridade dos arrays `pontos_ids` dos roteiros está 100% íntegra.
- Triggers de updated_at, avaliação média e stats de motorista estão corretos.

---

## 🎯 PRIORIDADE DE CORREÇÃO (top-down)

1. **C1** — Proteger views admin (security_invoker ou GRANT admin-only) — vazamento de PII ativo.
2. **C6+C7** — Corrigir fluxo de pagamento: service role no webhook + policies INSERT/UPDATE em transacoes/notificacoes.
3. **C3** — Criar bucket `fotos` (ou ajustar rota de upload).
4. **C4** — Criar tabelas `indicacoes` e `push_subscriptions`.
5. **C2** — Corrigir join dos roteiros (remover `!pontos_ids`).
6. **C5** — Adicionar `motorista_chegou` ao CHECK de status.
7. **A1+A2** — Corrigir admin_stats e eliminar recursão com `is_admin()`.
8. **A3+A4** — Endurecer policies de participacoes_sociais e ranking.
