# Plano — Núcleo inicial do CRM de Obras (Dimensão Coberturas)

## Escopo

Criar o primeiro núcleo funcional do CRM de Obras sem afetar site institucional, portfólio, login e administração existentes. Todas as tabelas novas com prefixo `crm_`. Dados financeiros isolados em tabelas próprias com RLS dedicada.

## 1. Banco de dados (migration Supabase)

### Enums
- `crm_obra_status`, `crm_item_tipo`, `crm_item_status`, `crm_recebivel_status`, `crm_membro_papel`

### Tabelas operacionais
- `crm_obras`, `crm_obra_membros`, `crm_projetos`, `crm_fases`, `crm_planejamento_itens`, `crm_fase_templates`, `crm_fase_template_itens`, `crm_audit_log`

### Tabelas financeiras (RLS restrita)
- `crm_obra_financeiro`, `crm_item_custos`, `crm_recebiveis`

### Funções SECURITY DEFINER
- `is_crm_admin()` — usa `has_role(auth.uid(),'admin')`
- `is_obra_member(_obra_id uuid)` — admin ou linha em `crm_obra_membros`
- `can_view_obra_financial(_obra_id uuid)` — admin ou membro com `can_view_financial = true`

### Triggers
- Reutilizar `public.set_updated_at()` em todas as tabelas com `updated_at`
- `crm_recalc_item_status()` antes de INSERT/UPDATE em `crm_planejamento_itens`:
  - `completed_at IS NOT NULL` → `concluido`
  - senão se `data_inicio` ou `data_fim` → `planejado`
  - senão → `definido`

### RLS (resumo)
- Operacionais: leitura/escrita para admin; membros leem suas obras; coordenador edita projetos/fases/itens da sua obra; colaborador só lê.
- Financeiras: somente admin ou membro com `can_view_financial = true` (SELECT/INSERT/UPDATE/DELETE).
- Membros/templates: admin gerencia; usuário lê o que é seu.

## 2. Rotas (TanStack Router)

Arquivos novos em `src/routes/`:
- `_authenticated.admin.crm.tsx` — lista de obras + métricas + "Nova obra"
- `_authenticated.admin.crm.obras.$obraId.tsx` — detalhe com tabs (Visão geral, Projetos/Cronograma, Kanban, Financeiro, Templates/Fases)

Atualizar:
- `_authenticated.admin.tsx` — card "CRM" passa de placeholder para `<Link to="/admin/crm">` ativo
- `_authenticated.tsx` — incluir item "CRM" no menu superior; ajustar guarda para permitir `admin` e `coordenador` no CRM, mas manter Portfólio/Usuários restritos a `admin`

### Permissões no AuthenticatedLayout
- Manter bloqueio de não-autenticado e sem-role
- Adicionar conceito de "acesso ao CRM" (admin ou qualquer papel em pelo menos uma obra). Portfólio/Usuários continuam admin-only.

## 3. Server functions (`src/lib/crm.functions.ts`)

Todas com `requireSupabaseAuth` + Zod:
- `listObras`, `getObraDetalhe`, `createObra`, `updateObra`
- `listProjetos`, `createProjeto`, `updateProjeto`
- `listFases`, `createFase`, `applyFaseTemplate`
- `listItens`, `createItem`, `updateItem`, `markItemConcluido`
- `listTemplates`, `createTemplate`, `addTemplateItem`
- `getFinanceiroObra`, `upsertObraFinanceiro`, `upsertItemCusto`
- `listRecebiveis`, `createRecebivel`, `updateRecebivel`
- `getDashboardObra` — agrega contagens + curva física (financeira opcional)

RLS é o gate principal; server fn apenas valida input e proxia.

## 4. Componentes (`src/components/crm/`)

- `ObraForm.tsx`, `ProjetoForm.tsx`, `FaseForm.tsx`, `PlanejamentoItemForm.tsx`
- `ObraDashboard.tsx` — cards + Recharts (curva física, curva financeira condicional)
- `CronogramaObra.tsx` — barras horizontais agrupadas por projeto/fase; bloco "Definidos sem data"
- `KanbanObra.tsx` — 3 colunas (Definido/Planejado/Concluído) com drag opcional; botão "Marcar concluído"
- `FinanceiroObra.tsx` — gated por `can_view_obra_financial`; tabela de recebíveis + gráfico
- `TemplateFasesManager.tsx`
- `ExportPlanejamentoButtons.tsx` — XLSX/PDF
- `crm-utils.ts` — formatação BRL, datas pt-BR, agregações
- `useObraPermissions.ts` — hook para `isAdmin`, `isMember`, `canViewFinancial`

## 5. Exportação

Tentar instalar `xlsx`, `jspdf`, `jspdf-autotable`. Se incompatível com runtime Worker durante SSR, restringir o import a client-only (dynamic import dentro do handler de clique). Fallback: CSV + `window.print()` numa página print-friendly.

## 6. Padrões técnicos

- TanStack Query: `queryOptions` + `ensureQueryData` nas loaders sob `_authenticated`; `useMutation` + `invalidateQueries` após escrita
- Sonner para toasts
- shadcn (Card, Tabs, Dialog, Table, Badge, Button, Input, Select, Textarea)
- Tokens semânticos de `src/styles.css` (sem cores hardcoded)
- Estados vazios, loading e erro elegantes
- Formatação pt-BR (`Intl.NumberFormat` BRL, `Intl.DateTimeFormat`)

## 7. Ordem de execução

1. Migration (enums, tabelas, funções, triggers, RLS) — uma única chamada `supabase--migration`
2. `src/lib/crm.functions.ts` + hook de permissões
3. Rotas `_authenticated.admin.crm.*`
4. Componentes CRM (dashboard, cronograma, kanban, financeiro, templates)
5. Atualizar card CRM em `_authenticated.admin.tsx` e menu em `_authenticated.tsx`
6. Exportação
7. QA: criar obra → projeto → fase → item; verificar transições de status; verificar gating financeiro com usuário não-admin

## Riscos / pontos de atenção

- **Não tocar** `src/integrations/supabase/{client,types,client.server,auth-middleware,auth-attacher}.ts` nem `routeTree.gen.ts`
- Não reaproveitar tabela `projects` (portfólio)
- RLS financeira: cuidado para `crm_obra_financeiro` permitir `INSERT` na criação da obra apenas por quem tem permissão; criação da obra (sem financeiro) fica em `crm_obras`
- `xlsx`/`jspdf` podem precisar de import dinâmico no client para evitar problemas no SSR Worker
- Confirmar antes de implementar que coordenador deve ver o menu "CRM" no header autenticado (hoje o layout é admin-only)

## Perguntas para confirmar antes de codar

1. Coordenador/colaborador devem conseguir **fazer login no painel** e ver apenas o CRM (Portfólio/Usuários ocultos)? Hoje `_authenticated.tsx` bloqueia tudo que não é admin.
2. Posso instalar `xlsx`, `jspdf`, `jspdf-autotable` (≈ 600 KB no client, lazy-loaded)?
3. Drag-and-drop no Kanban nesta entrega ou apenas botão "Mover/Marcar concluído"?
