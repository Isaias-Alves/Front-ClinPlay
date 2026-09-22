<!-- REGRA DE OURO: este arquivo entra no contexto a CADA iteração.
     Se passar de ~80 linhas, você está pagando por ele o tempo todo. Corte. -->

## Stack

React 18 + TypeScript + Vite. Estado de servidor via TanStack Query.
Supabase JS (auth + dados) e Firebase Web SDK. Deploy na Vercel.

## Mapa (só o que importa)

- `src/pages/` — uma pasta por rota
- `src/components/` — componentes burros, sem fetch dentro
- `src/features/<dominio>/` — hooks + chamadas de API do domínio
- `src/lib/supabase.ts`, `src/lib/firebase.ts` — clientes, singletons
- `src/test/` — setup do Vitest, handlers do MSW

## Convenções

- Nada de `any`. Tipos derivados do schema, não escritos à mão.
- Fetch só dentro de `src/features/**`. Componente não chama Supabase direto.
- Erro de rede vira estado de UI, nunca `console.log` engolido.
- Componente novo → arquivo novo. Nada de arquivo com 400 linhas.

## Comandos

```bash
npm run dev          # aponta para o .env.local (stack local, ver SETUP.md)
./gate.sh            # o portão: tipos + lint + testes + build
npx vitest run <arq> # teste isolado, durante a iteração
```

## Ambiente local

`npm run dev` e os testes usam **sempre** o Supabase local (`supabase start`,
porta 54321) e os emuladores do Firebase. Nunca aponte para produção.
Em teste unitário, rede é interceptada pelo MSW — se um teste precisa de
internet, o teste está errado.

## Definição de pronto

`./gate.sh` verde + teste cobrindo o comportamento novo + nenhum arquivo fora
do escopo da tarefa modificado.
