
# Portfólio dinâmico + Login com perfis

## Objetivo

Criar uma página pública `/portfolio` (fora da landing page, mesmo design system) que exibe projetos da Dimensão Coberturas com foto + comentário, alimentada por um backend real. A página de login passa a oferecer dois caminhos: **Sou Membro** (equipe Dimensão — CRM e administração do site, incluindo cadastro de projetos) e **Sou Cliente** (acesso futuro do cliente final).

## 1. Backend (Lovable Cloud)

Para ter cadastro real de projetos com fotos + autenticação por perfil, ativamos o **Lovable Cloud** (banco, auth e storage gerenciados, sem contas externas).

Estrutura proposta:

- **Auth** — Email/senha + Google. Cadastro inicial do(s) administrador(es) feito manualmente.
- **Tabela `profiles`** — `id` (FK `auth.users`), `display_name`, `avatar_url`, criada via trigger no signup.
- **Enum `app_role`** — `admin` (membro Dimensão), `client`.
- **Tabela `user_roles`** — `user_id`, `role`. Função `has_role()` SECURITY DEFINER (padrão seguro, sem recursão de RLS).
- **Tabela `projects`**:
  - `id`, `title`, `slug`, `description` (comentário do projeto), `location`, `category`, `year`, `cover_image_url`, `published` (bool), `sort_order`, `created_at`, `updated_at`, `created_by`.
- **Tabela `project_images`**:
  - `id`, `project_id` (FK cascade), `image_url`, `caption`, `sort_order`.
- **Storage bucket `portfolio`** (público para leitura) — fotos dos projetos.
- **RLS**:
  - `projects` / `project_images`: SELECT público apenas quando `published = true`; INSERT/UPDATE/DELETE somente `has_role(auth.uid(), 'admin')`.
  - Storage: leitura pública; escrita só para admin.

## 2. Página pública `/portfolio`

Rota `src/routes/portfolio.tsx` (separada da landing, com `head()` próprio para SEO):

- Header e Footer já existentes (mesmo design system: Exo 2, paleta deep/primary/accent, animações `AnimatedSection`).
- Hero curto com título "Portfólio" + subtítulo.
- **Grid de projetos** (responsivo: 1 col mobile, 2 tablet, 3 desktop) com:
  - Imagem de capa, título, categoria, localização, hover com leve elevação (padrão do site).
- Clique no card → `/portfolio/$slug` (rota dinâmica `src/routes/portfolio.$slug.tsx`):
  - Galeria de imagens (grid + lightbox simples), descrição/comentário, ficha técnica (local, categoria, ano).
- Loader busca dados via `createServerFn` (`getPublishedProjects`, `getProjectBySlug`) — `published = true` apenas, usando `supabaseAdmin` para leitura pública (sem expor token de usuário). Sem PII.
- Link "Portfólio" adicionado ao menu do Header (desktop + mobile).

## 3. Página de Login com dois perfis

Reformulação de `src/routes/login.tsx`:

- Tela inicial com headline "Acessar Dimensão" e dois botões grandes lado a lado (empilhados no mobile):
  - **Sou Membro** → `/login/membro`
  - **Sou Cliente** → `/login/cliente`
- `src/routes/login.membro.tsx`:
  - Formulário email/senha + botão "Entrar com Google".
  - Após login, valida `has_role('admin')`. Se sim → redireciona para `/admin`. Caso contrário → mensagem de acesso negado.
- `src/routes/login.cliente.tsx`:
  - Placeholder "Em breve — área do cliente em desenvolvimento" + voltar. (Estrutura pronta para evoluirmos depois.)

## 4. Área administrativa (mínima nesta entrega)

Para que o portfólio seja realmente dinâmico já neste ciclo, entregamos a base do CRM apenas no que o portfólio precisa. O restante do CRM evolui em iterações futuras.

- Layout protegido `src/routes/_authenticated.tsx` (gate via `supabase.auth.getUser()` + `has_role('admin')`, redireciona não-admins).
- `src/routes/_authenticated/admin.tsx` — dashboard simples com card "Portfólio" (e espaço reservado para futuros módulos do CRM).
- `src/routes/_authenticated/admin.portfolio.tsx`:
  - Lista de projetos (tabela) com ações: novo, editar, publicar/despublicar, excluir, reordenar.
- `src/routes/_authenticated/admin.portfolio.$id.tsx`:
  - Formulário do projeto: título, slug (auto), descrição, local, categoria, ano, publicado.
  - Upload de capa + upload múltiplo de imagens (drag-and-drop), legendas e reordenação.
  - Server functions: `upsertProject`, `deleteProject`, `addProjectImages`, `updateProjectImage`, `deleteProjectImage`, todas com `requireSupabaseAuth` + verificação de role admin.

## 5. Header

- "Login" continua discreto no canto superior direito (já está) e leva à nova tela com dois perfis.
- Novo item "Portfólio" no menu principal, entre "Serviços" e "Sobre".

## Detalhes técnicos

- Stack mantida: TanStack Start, Tailwind, Framer Motion, shadcn.
- Imagens servidas via Storage público; otimização básica (`loading="lazy"`, `aspect-ratio`).
- Validação de formulários com `zod` + `react-hook-form` (já no projeto).
- SEO: `head()` por rota (`/portfolio`, `/portfolio/$slug` usando dados do loader para title/description/og:image = imagem de capa do projeto).
- Acessibilidade: alt obrigatório por imagem (`caption` ou título do projeto como fallback).

## Fora de escopo desta entrega

- CRM completo (leads, propostas, contratos, financeiro) — fica para próximos ciclos.
- Área do cliente funcional — só placeholder.
- Editor rich-text na descrição (usaremos textarea simples por ora).

## Confirmações antes de implementar

1. Posso ativar o **Lovable Cloud** agora? (necessário para auth, banco e storage).
2. Quais **categorias de projeto** devemos pré-cadastrar? (ex.: Coberturas Metálicas, Estruturas, Reformas, Industrial). Posso assumir essas 4 e você ajusta depois no admin.
3. Para o login do administrador, prefere **email/senha + Google** ou só **email/senha** nesta primeira versão?
