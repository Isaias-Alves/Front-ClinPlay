<!-- REGRA DE OURO: este arquivo entra no contexto a CADA iteração.
     Se passar de ~80 linhas, você está pagando por ele o tempo todo. Corte. -->

## Stack

React 19 + TypeScript + Vite 7 + Tailwind v4. Roteamento com react-router-dom 7.
Formulários com react-hook-form. Sem biblioteca de estado de servidor.
Backend é uma API Spring Boot externa (`VITE_API_URL`, padrão `localhost:8080`),
acessada por axios; tempo real via STOMP/SockJS em `/ws`.
Firebase só para Web Push (FCM). Deploy na Vercel.

## Mapa

Todo o app fica em `src/frontend/`; os caminhos abaixo são relativos a ele.

- `src/pages/` — um arquivo `*Page.tsx` por rota, registrado com `lazy()` em `src/App.tsx`
- `src/components/` — componentes compartilhados + `*.stories.jsx`
- `src/services/` — única camada que faz HTTP; `http.ts` define `api` e `apiComCookies`
- `src/hooks/` — hooks reutilizáveis (auth Google, STOMP, tema, formulário de cadastro)
- `src/contexts/` — `AppContext` global, lido com `useApp()`
- `src/interfaces/` — tipos das respostas da API, escritos à mão
- `src/games/` — minigames; `registro.ts` é a fonte única da lista
- `src/utils/` — funções puras (erros, formatação, datas, tema)
- `src/firebase.ts` — push FCM, SDK carregado sob demanda

## Convenções (as que o código segue hoje)

- HTTP só dentro de `src/services/`, via `api` (Bearer) ou `apiComCookies`
  (OAuth/refresh). Nunca importe axios em página ou componente.
- Páginas chamam os services direto, com `useState` + `useEffect`.
- Imports entre camadas pelos barrels: `@components`, `@services`, `@hooks`,
  `@utils`, `@interfaces`, `@contexts`, `@games`, `@assets`. Exportou algo novo →
  adicione ao `index.ts` da pasta. Não use `@pages` nem `@/` (só funcionam em um
  dos dois, Vite ou tsconfig).
- Erro no `catch`: `catch (erro)` sem tipo, mensagem via
  `mensagemDeErro(erro, "texto padrão")` de `@utils`, exibida com
  `useApp().notificar(msg, "erro")`. Falha ao carregar lista → `<FalhaAoCarregar>`.
- Confirmação: `await useApp().confirmar(...)`.
- Identificadores, textos e comentários em português. Comentário explica o porquê.
- Estilo só com classes Tailwind em `className`.
- Minigame novo: entra em `games/registro.ts`; o `id` precisa existir no enum
  `Jogo` do backend.
- `any` é só warning no ESLint, mas o gate barra qualquer warning.

## Comandos

Rodar dentro de `src/frontend/`:

```bash
npm run dev                 # Vite; lê VITE_API_URL do .env (ver .env.example)
npx tsc --noEmit            # tipos
npx eslint . --max-warnings=0
npx vitest run              # roda as stories no Chromium headless (Playwright)
npm run build
```

`./gate.sh` (na raiz do repo) roda esses quatro em sequência.

## Testes

Não existem testes unitários. O Vitest só roda o projeto `storybook`: cada
story em `src/**/*.stories.*` vira um teste de renderização (+ addon-a11y).
Precisa de `npx playwright install chromium` na primeira vez.

## Definição de pronto

`./gate.sh` verde + nenhum arquivo fora do escopo da tarefa modificado.
