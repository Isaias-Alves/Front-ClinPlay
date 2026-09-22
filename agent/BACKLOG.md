<!-- Formato: um bloco por tarefa. O loop pega o PRIMEIRO com [ ].
     [ ] pendente · [x] feita · [!] travada, precisa de você.
     Uma tarefa = uma branch = um PR. Se não cabe em ~5 arquivos, quebre em duas. -->

## [ ] FE-001 — Skeleton de carregamento na lista de agendamentos

**Onde:** `src/pages/agendamentos/`, `src/features/agendamentos/`

**O que:** enquanto a query está `isPending`, renderizar 5 linhas de skeleton
no lugar da tabela. Se der erro, mostrar estado de erro com botão "tentar de novo"
que chama `refetch()`.

**Critério de aceite:**
- [ ] teste: com a query pendente, aparecem 5 elementos `data-testid="skeleton-row"`
- [ ] teste: com o handler do MSW devolvendo 500, aparece o botão e o clique refaz a chamada
- [ ] nenhum componente fora de `agendamentos/` alterado

---

## [ ] FE-002 — <título curto e verbal>

**Onde:** <caminhos>

**O que:** <comportamento observável, não "melhorar X">

**Critério de aceite:**
- [ ] <asserção testável>
- [ ] <asserção testável>
