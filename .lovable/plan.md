# CRM de Obras — Edição inline + Gantt redimensionável

## 1. Edição de Projeto / Fase / Item

Os formulários (`ProjetoForm`, `FaseForm`, `PlanejamentoItemForm`) já aceitam um registro existente, mas a aba **Projetos e cronograma** não expõe botões de edição. Vamos adicionar:

- Botão **lápis (Editar)** ao lado do nome do projeto → abre `ProjetoForm` com o projeto.
- Botão **lápis** ao lado do nome da fase → abre `FaseForm` com a fase.
- Botão **lápis** em cada `ItemRow` → abre `PlanejamentoItemForm` com o item.
- Botão **lixeira** em projeto e fase (admin), com `confirm()` e cascade lógica (deletar fase mantém itens com `fase_id = null`; deletar projeto remove fases e itens do projeto).

## 2. Fases com período (início/fim)

Migration (`supabase/migrations/...`):

```sql
ALTER TABLE public.crm_fases
  ADD COLUMN data_inicio date,
  ADD COLUMN data_fim    date;
```

Atualizações:

- `FaseForm`: dois campos `type="date"` para `data_inicio` e `data_fim`.
- **Sincronização fase ↔ itens** (regra escolhida: a fase se adapta automaticamente aos itens, e os itens podem ser fixados dentro da fase):
  - Ao salvar/mover/redimensionar um item com datas fora da fase, a fase é expandida (atualizamos `data_inicio`/`data_fim` da fase para englobar o item).
  - Ao redimensionar uma fase no Gantt, oferecer opção "manter itens proporcionais" (escalar datas dos itens) — implementado como toggle no drag handle (Shift = escalar itens, padrão = só mover/redimensionar fase).
  - Se a fase não tem datas próprias, é calculada dinamicamente como `min(item.data_inicio) → max(item.data_fim)` dos seus itens.

## 3. Nova aba **Gantt** (visualização tipo cronograma)

Nova aba `Gantt` em `_authenticated.admin.crm.obras.$obraId.tsx`, com componente novo `src/components/crm/GanttView.tsx`.

Layout (referência da imagem enviada):

```text
| Etapa | Descrição                       | mai | jun | jul | ago | set |
|   1   | > Fase: Fundação                |#####|     |     |     |     |
|       |    Assinatura de Contrato       |##   |     |     |     |     |
|       |    Compra matéria-prima         |  ###|     |     |     |     |
|   2   | > Fase: Estrutura               |     |#####|#####|     |     |
```

Funcionalidades:

- **Escala**: alternador `Dia / Semana / Mês` (botões no topo da aba). A largura de cada coluna é fixa por escala (ex.: 32 px/dia, 80 px/semana, 120 px/mês).
- **Range temporal**: calculado a partir de `min/max` de todas as fases+itens da obra (com padding de 1 unidade em cada lado). Scroll horizontal.
- **Coluna esquerda fixa**: Etapa (índice), Descrição (nome da fase/item), com botão **▾/▸** para expandir/colapsar itens dentro da fase.
- **Barras**:
  - Fase = barra densa (cor primária).
  - Item = barra mais clara, indentada.
  - Item concluído = barra verde.
  - Sem datas = chip "Sem datas" + ação rápida "Definir datas" abre o form correspondente.
- **Drag / resize** (mouse pointer events nativos, sem libs novas):
  - Arrastar o **corpo** da barra → move (shift `data_inicio` e `data_fim` mantendo duração).
  - Arrastar a **borda esquerda** → ajusta `data_inicio`.
  - Arrastar a **borda direita** → ajusta `data_fim`.
  - Snap à granularidade ativa (dia / semana / mês).
  - On drop: `useMutation` atualiza Supabase (`crm_fases` ou `crm_planejamento_itens`) e invalida `["crm","obra",obraId]`.
  - Optimistic update no cache da query para feedback imediato.
- **Permissões**: drag/resize e edição apenas para `perms.canEdit`; viewers só visualizam.
- **Hoje**: linha vertical destacada.

## 4. Arquivos a criar / editar

```text
supabase/migrations/<ts>_crm_fases_periodo.sql   (NEW)
src/components/crm/GanttView.tsx                  (NEW)
src/components/crm/gantt-utils.ts                 (NEW — date math + snap)
src/components/crm/FaseForm.tsx                   (EDIT — campos de data)
src/routes/_authenticated.admin.crm.obras.$obraId.tsx
  - EDIT: adicionar botões Editar/Excluir em projeto, fase, item
  - EDIT: nova <TabsTrigger value="gantt"> + <TabsContent value="gantt">
```

## 5. Notas técnicas

- Gantt construído com `div` + CSS grid e `transform: translateX` para drag — sem dependências novas.
- Para evitar dessincronia, ao redimensionar item fora da fase: mostrar toast "Fase expandida para englobar o item" e disparar segundo update da fase no mesmo `onSuccess`.
- Tipos do Supabase serão regenerados após a migration (não editar `types.ts` manualmente).
- RLS já existente em `crm_fases` cobre os novos campos (update por `is_obra_coordenador`).

Pronto para implementar quando aprovado.
