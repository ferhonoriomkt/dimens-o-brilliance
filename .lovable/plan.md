## Mudanças no Header e CTA

### 1. Logo invertido no topo (pré-scroll)
- Adicionar asset `src/assets/logo-horizontal-invertido.png` (cópia do upload enviado — letras brancas).
- Em `Header.tsx`, alternar o `src` da `<img>` com base no estado `scrolled`:
  - `!scrolled` → `logo-horizontal-invertido.png` (sobre fundo escuro do Hero)
  - `scrolled` → `logo-horizontal.png` (original, sobre faixa branca)

### 2. Links do menu brancos no topo
- Aplicar cor condicional nos links da `<nav>`: `scrolled ? "text-foreground/80" : "text-white/90"` com hover mantendo `text-accent` (ouro) para destaque, em vez do `primary` azul (que sumiria no fundo escuro).

### 3. Botão "Entrar" → "Login", mais discreto
- Renomear label para **Login**.
- Trocar de `Button` primary para `variant="ghost"` `size="sm"`, com cor condicional (branco no topo, foreground após scroll). Manter ícone `LogIn` menor. Posicionar como item discreto no canto direito.

### 4. Remover "Solicite orçamento" do Header
- Remover o botão do header desktop e do menu mobile.
- Adicionar uma **faixa CTA** logo antes do Footer (novo componente `CTASection.tsx`) com fundo `bg-deep` em destaque, título curto ("Pronto para proteger seu empreendimento?") e botão grande "Solicite orçamento" apontando para `#contato`.
- Alternativamente — e mais simples — incluir o botão "Solicite orçamento" como bloco final dentro da seção `Services` ou logo após `Testimonials`. **Proposta**: novo componente `CTASection.tsx` posicionado entre `Testimonials` e `Footer` em `src/routes/index.tsx`.

### Arquivos afetados
- `src/assets/logo-horizontal-invertido.png` (novo)
- `src/components/site/Header.tsx` (lógica de cor condicional, rename, remoção do orçamento)
- `src/components/site/CTASection.tsx` (novo)
- `src/routes/index.tsx` (incluir `<CTASection />`)
