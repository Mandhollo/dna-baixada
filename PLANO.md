# DNA Baixada — Plano de Construção por Etapas

**Prazo final:** Outubro 2026 (antes da temporada de cruzeiros - novembro)
**Início:** Junho 2026
**Tempo estimado:** ~4 meses
**Formato:** Webapp (responsivo, mobile-first)

---

## Tecnologia Escolhida

| Camada | Tecnologia | Motivo |
|--------|-----------|--------|
| Frontend | React + Next.js | Rápido, SEO, mobile-first |
| Backend | Next.js API Routes | Tudo em um projeto |
| Banco de dados | PostgreSQL (Supabase) | Gratuito inicial, escala fácil |
| Autenticação | Supabase Auth | Login social, email, telefone |
| Pagamentos | Pix via Open Pix ou similar | Principal método BR |
| Mapas | Google Maps API ou Leaflet | Rastreamento e rotas |
| Hospedagem | Vercel | Deploy automático, gratuito inicial |
| Estilização | Tailwind CSS | Rápido, responsivo |

---

## ETAPA 1 — Fundação e Estrutura Base (Semana 1-2)

**Objetivo:** Projeto rodando, banco configurado, design system pronto

- [ ] 1.1 Criar repositório e estrutura do projeto Next.js
- [ ] 1.2 Configurar Supabase (banco + auth)
- [ ] 1.3 Criar design system (cores, tipografia, componentes base)
- [ ] 1.4 Layout responsivo mobile-first (header, footer, navegação)
- [ ] 1.5 Landing page da DNA Baixada
- [ ] 1.6 Páginas institucionais (Sobre, Missão, DNA Social)

**Entregável:** Site no ar com cara de DNA Baixada, navegável

---

## ETAPA 2 — Cadastro e Autenticação (Semana 3-4)

**Objetivo:** Usuários podem criar conta e logar

- [ ] 2.1 Tela de cadastro — Passageiro (nome, telefone, email, senha)
- [ ] 2.2 Tela de cadastro — Motorista (dados + CNH, veículo, documentos)
- [ ] 2.3 Tela de cadastro — Parceiro comercial (CNPJ, endereço, categoria)
- [ ] 2.4 Login/Logout (email, telefone, Google)
- [ ] 2.5 Recuperação de senha
- [ ] 2.6 Perfis de usuário (dashboard inicial de cada tipo)
- [ ] 2.7 Validação de motorista (aprovado/pendente/rejeitado)

**Entregável:** Sistema de login/cadastro funcional para os 3 perfis

---

## ETAPA 3 — Mobilidade: Solicitação de Corridas (Semana 5-8)

**Objetivo:** Passageiro pede corrida, motorista recebe e aceita

- [ ] 3.1 Tela de solicitação de corrida (origem, destino, tipo)
- [ ] 3.2 Tipos de serviço:
  - Corrida urbana
  - Transporte executivo
  - Transfer aeroporto (GRU/CGH)
  - Transfer rodoviária
  - Transfer hotel
  - Transfer terminal cruzeiros
  - City tour
  - Passeio turístico
- [ ] 3.3 Cálculo de preço estimado (por tipo e distância)
- [ ] 3.4 Tela do motorista — receber solicitações
- [ ] 3.5 Aceitar/recusar corrida
- [ ] 3.6 Status da corrida (aguardando → a caminho → em andamento → finalizada)
- [ ] 3.7 Chat entre passageiro e motorista
- [ ] 3.8 Integração com mapa (visualização em tempo real)
- [ ] 3.9 Avaliação pós-corrida (passageiro ↔ motorista)

**Entregável:** Sistema de corridas funcional (sem pagamento real ainda)

---

## ETAPA 4 — Pagamentos e Financeiro (Semana 9-10)

**Objetivo:** Cobrança e repasse funcionando

- [ ] 4.1 Integração com Pix (QR Code e Pix Copia e Cola)
- [ ] 4.2 Pagamento em dinheiro (registro)
- [ ] 4.3 Cartão de crédito (fase opcional)
- [ ] 4.4 Painel financeiro do motorista (ganhos, corridas, repasses)
- [ ] 4.5 Painel financeiro do parceiro (vendas, cupons usados)
- [ ] 4.6 Histórico de transações
- [ ] 4.7 Taxa da plataforma e repasse ao motorista

**Entregável:** Sistema de pagamento Pix funcional

---

## ETAPA 5 — Painel do Motorista Parceiro (Semana 11-12)

**Objetivo:** Motorista com dashboard completo

- [ ] 5.1 Dashboard principal (ganhos, corridas, avaliação)
- [ ] 5.2 Sistema de metas e bonificações
- [ ] 5.3 Programa de incentivos (pico, cruzeiros, eventos)
- [ ] 5.4 Ranking de reconhecimento
- [ ] 5.5 Histórico completo de corridas
- [ ] 5.6 Extrato financeiro detalhado
- [ ] 5.7 Notificações de demanda alta
- [ ] 5.8 Perfil do motorista (foto, veículo, avaliação)

**Entregável:** Painel completo do motorista

---

## ETAPA 6 — Turismo e City Tours (Semana 13-14)

**Objetivo:** Módulo de turismo integrado

- [ ] 6.1 Catálogo de pontos turísticos da Baixada
- [ ] 6.2 Roteiros personalizados (família, casal, aventura, histórico)
- [ ] 6.3 Booking de city tours (agendamento, escolha de roteiro)
- [ ] 6.4 Páginas de atrações com fotos, descrição, horários
- [ ] 6.5 Integração com corridas (pedir transporte direto do ponto turístico)
- [ ] 6.6 Calendário de eventos culturais, shows, feiras
- [ ] 6.7 Informações de cruzeiros (chegada, saída, navios)
- [ ] 6.8 Condições climáticas em tempo real

**Entregável:** Módulo de turismo completo e integrado

---

## ETAPA 7 — Parceiros Comerciais (Semana 15-16)

**Objetivo:** Vitrine digital de estabelecimentos

- [ ] 7.1 Cadastro de estabelecimento (restaurante, bar, hotel, comércio)
- [ ] 7.2 Página do parceiro (fotos, horários, localização, promoções)
- [ ] 7.3 Sistema de cupons de desconto
- [ ] 7.4 Campanhas promocionais
- [ ] 7.5 Avaliações de estabelecimentos
- [ ] 7.6 Sugestões personalizadas para o passageiro
- [ ] 7.7 Programa de fidelidade parceiro
- [ ] 7.8 Painel de gestão do parceiro

**Entregável:** Vitrine digital de parceiros funcionando

---

## ETAPA 8 — DNA Social e Recompensas (Semana 17-18)

**Objetivo:** Programa social e de pontos

- [ ] 8.1 Página DNA Social (campanhas ativas, relatórios)
- [ ] 8.2 Sistema de pontos (passageiro, motorista, parceiro)
- [ ] 8.3 Acúmulo de pontos por ações (corridas, avaliações, indicações)
- [ ] 8.4 Resgate de recompensas
- [ ] 8.5 Campanhas sociais (doação sangue, alimentos, meio ambiente)
- [ ] 8.6 Relatórios transparentes de prestação de contas
- [ ] 8.7 Rankings de participação social
- [ ] 8.8 Notificações de campanhas

**Entregável:** Sistema social e de recompensas ativo

---

## ETAPA 9 — Painel Admin (Semana 19-20)

**Objetivo:** Controle total da plataforma

- [ ] 9.1 Dashboard administrativo
- [ ] 9.2 Gestão de usuários (passageiros, motoristas, parceiros)
- [ ] 9.3 Aprovação/rejeição de motoristas
- [ ] 9.4 Gestão de corridas e reclamações
- [ ] 9.5 Gestão de parceiros comerciais
- [ ] 9.6 Gestão financeira (taxas, repasses)
- [ ] 9.7 Gestão de campanhas sociais
- [ ] 9.8 Relatórios e métricas
- [ ] 9.9 Configuração de preços e taxas
- [ ] 9.10 Notificações push para usuários

**Entregável:** Painel admin completo

---

## ETAPA 10 — Polimento, Testes e Lançamento (Semana 21-22)

**Objetivo:** Tudo funcionando perfeito para o lançamento

- [ ] 10.1 Testes completos (todas as funcionalidades)
- [ ] 10.2 Testes em celular real (Android e iPhone)
- [ ] 10.3 Otimização de performance
- [ ] 10.4 SEO e meta tags
- [ ] 10.5 Termos de uso e política de privacidade
- [ ] 10.6 Tutorial/onboarding para novos usuários
- [ ] 10.7 Página de suporte/ajuda
- [ ] 10.8 Deploy final em produção
- [ ] 10.9 Testes com motoristas reais (grupo dos 25)
- [ ] 10.10 Lançamento! 🚀

---

## Resumo do Cronograma

| Etapa | Semanas | Status |
|-------|---------|--------|
| 1. Fundação | 1-2 | ⬜ Pendente |
| 2. Cadastro/Auth | 3-4 | ⬜ Pendente |
| 3. Mobilidade/Corridas | 5-8 | ⬜ Pendente |
| 4. Pagamentos | 9-10 | ⬜ Pendente |
| 5. Painel Motorista | 11-12 | ⬜ Pendente |
| 6. Turismo | 13-14 | ⬜ Pendente |
| 7. Parceiros | 15-16 | ⬜ Pendente |
| 8. Social/Recompensas | 17-18 | ⬜ Pendente |
| 9. Painel Admin | 19-20 | ⬜ Pendente |
| 10. Testes/Lançamento | 21-22 | ⬜ Pendente |

**Tempo total:** ~22 semanas (~5.5 meses)
**Margem:** Temos ~4 meses até outubro, então precisamos ser eficientes
**Estratégia:** Priorizar o essencial (Etapas 1-5) e incrementar o resto

---

## Priorização (MVP → Completo)

**MVP (Mínimo Viável) — Até agosto:**
- Etapas 1, 2, 3, 4 (fundação + cadastro + corridas + pagamento)

**Versão Beta — Até setembro:**
- + Etapas 5, 6 (painel motorista + turismo)

**Versão Completa — Até outubro:**
- + Etapas 7, 8, 9, 10 (parceiros + social + admin + testes)

---

*Plano criado em Junho 2026 — DNA Baixada*
*Ecossistema de Mobilidade, Turismo e Impacto Social da Baixada Santista*
