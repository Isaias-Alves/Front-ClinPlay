import { createElement } from "react";
import { RiFocus3Line, RiRocketLine } from "react-icons/ri";
import { TbBallTennis } from "react-icons/tb";
import BolinhaDeslizante from "./motores/BolinhaDeslizante";
import EsferaBiofeedback from "./motores/EsferaBiofeedback";
import type { JogoDefinicao } from "./tipos";

/**
 * Registro único dos minigames.
 *
 * É a mesma fonte usada pela vitrine (`JogosPage`) e pela execução
 * (`ExercicioJogarPage`). Antes a vitrine tinha a sua própria lista fixa e a
 * tela de execução ignorava o jogo escolhido, renderizando sempre a esfera —
 * qualquer motor selecionado pelo profissional caía no mesmo visual.
 *
 * Os `id` precisam bater com o enum `Jogo` do backend, que aceita exatamente
 * três valores: FLAPPY_BIRD, SPACE_SHOOTER e SUBMARINO. Esses identificadores
 * ficaram de um esboço anterior e não descrevem o que cada motor desenha hoje,
 * por isso `nome` existe: o id é contrato com a API, o nome é o que a pessoa lê.
 * Trocar o id exigiria migração de banco e mudança no enum do backend.
 */
export const JOGOS: JogoDefinicao[] = [
  {
    id: "FLAPPY_BIRD",
    // Não há pássaro nem voo: o motor desenha uma esfera que pulsa. O nome
    // anterior ("Flappy Bio") prometia um jogo que nunca existiu.
    nome: "Esfera Pulsante",
    resumo: "Leitura radial",
    descricao:
      "Uma esfera cresce enquanto a contração é sustentada e recolhe no relaxamento, mudando de cor a cada fase. A leitura radial é direta e funciona bem em contrações rápidas e repetidas (Fast Fibers).",
    icone: createElement(RiFocus3Line),
    corTexto: "text-amber-500",
    corFundo: "bg-amber-50",
    componente: EsferaBiofeedback,
    escalaPrevia: 0.40,
    disponivel: true,
  },
  {
    id: "SPACE_SHOOTER",
    nome: "Nave Espacial",
    resumo: "Em desenvolvimento",
    // A descrição anterior afirmava que o paciente mantinha "a nave em
    // órbita". Não existe nave: o slot está reservado no enum do backend, mas
    // o motor visual ainda não foi escrito.
    descricao:
      "Motor ainda não desenvolvido. O identificador já existe no servidor, mas não há tela própria para ele — por isso não é possível prescrever um exercício com este motor.",
    icone: createElement(RiRocketLine),
    corTexto: "text-indigo-500",
    corFundo: "bg-indigo-50",
    // Sem componente próprio. `obterJogo` nunca devolve esta entrada para a
    // tela de execução, justamente para não rodar a esfera sob outro nome.
    componente: EsferaBiofeedback,
    escalaPrevia: 0.42,
    disponivel: false,
  },
  {
    id: "SUBMARINO",
    // Não há submarino: o motor desenha uma bolinha numa pista horizontal.
    nome: "Bolinha na Pista",
    resumo: "Leitura linear",
    descricao:
      "A bolinha percorre a pista até o alvo enquanto a contração é sustentada e volta à partida no relaxamento. A leitura linear mostra ao paciente quanto falta para completar cada repetição — útil em sustentações longas.",
    icone: createElement(TbBallTennis),
    corTexto: "text-emerald-500",
    corFundo: "bg-emerald-50",
    componente: BolinhaDeslizante,
    escalaPrevia: 0.68,
    disponivel: true,
  },
];

const POR_ID = new Map(JOGOS.map((jogo) => [jogo.id, jogo]));

/** Motor padrão quando a prescrição não indica um jogo conhecido. */
export const JOGO_PADRAO = JOGOS[0];

/**
 * Resolve o jogo que deve ser *executado* para um identificador.
 *
 * Um id conhecido mas sem motor próprio (SPACE_SHOOTER) cai no padrão. Antes
 * ele devolvia a própria entrada, cujo `componente` era a esfera: o paciente
 * via a esfera rotulada "Resistência Espacial", com a tela prometendo uma
 * nave em órbita. Caindo no padrão, nome e desenho voltam a combinar.
 */
export const obterJogo = (id: string | undefined): JogoDefinicao => {
  if (!id) return JOGO_PADRAO;
  const achado = POR_ID.get(id.toUpperCase());
  return achado?.disponivel ? achado : JOGO_PADRAO;
};

/**
 * Nome legível de um identificador, para listas e etiquetas.
 *
 * O enum do backend vazava cru para oito telas — inclusive as do paciente,
 * que mostravam "SUBMARINO" como o nome do jogo do próprio exercício.
 * Diferente de `obterJogo`, aqui um motor indisponível mantém o seu nome:
 * numa lista, o profissional precisa ver o que foi de fato prescrito.
 */
export const nomeDoJogo = (id: string | undefined): string => {
  if (!id) return "—";
  return POR_ID.get(id.toUpperCase())?.nome ?? id;
};
