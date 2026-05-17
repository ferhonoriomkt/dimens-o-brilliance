## Diagnóstico

Clicar em **Sou Membro** muda a URL para `/login/membro`, mas a tela do formulário não aparece — fica a impressão de que "o botão não faz nada".

Causa raiz: o roteamento por arquivo do TanStack está usando `src/routes/login.tsx` como **layout pai** de `login.membro.tsx` e `login.cliente.tsx` (confirmado em `routeTree.gen.ts`: `LoginRouteWithChildren`). Quando um arquivo de rota tem filhos, seu componente precisa renderizar `<Outlet />` para mostrar a rota filha. O `LoginPage` atual não tem `<Outlet />` — ele renderiza só a tela de escolha "Sou Membro / Sou Cliente". Resultado: ao navegar para `/login/membro`, o React Router casa a rota, mas a tela continua exibindo o seletor do pai e o formulário do filho nunca aparece.

## Solução

Converter `/login` em uma rota índice independente, sem virar pai dos filhos:

1. Renomear `src/routes/login.tsx` → `src/routes/login.index.tsx` (sem mudar o conteúdo).  
   Isso faz `/login` continuar servindo a tela com os dois cards, mas deixa de ser layout pai de `login.membro` e `login.cliente`.

2. Não é preciso editar `login.membro.tsx`, `login.cliente.tsx`, nem `routeTree.gen.ts` — o plugin do Vite regenera a árvore automaticamente no próximo build.

3. Verificar no preview: clicar em **Sou Membro** deve carregar o formulário de e-mail/senha em `/login/membro`, e **Sou Cliente** o formulário em `/login/cliente`.

## Fora de escopo

- Lógica de autenticação em si (e-mail/senha, Google, reset) — está correta e foi corrigida em ciclos anteriores.
- Tela `/login/cliente` — recebe a mesma correção de tabela como efeito colateral.
