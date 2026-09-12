import { createElement } from "react";
import { RiGamepadLine, RiRocketLine } from "react-icons/ri";
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
 * três valores: FLAPPY_BIRD, SPACE_SHOOTER e SUBMARINO. Qualquer outro é
 * rejeitado na prescrição, por isso a bolinha deslizante ocupa o slot
 * SUBMARINO em vez de um id próprio.
 */
export const JOGOS: JogoDefinicao[] = [
  {
    id: "FLAPPY_BIRD",
    nome: "Flappy Bio",
    descricao:
      "Motor padrão, ideal para contração rápida (Fast Fibers): uma esfera que expande a cada esforço e recolhe no relaxamento.",
    icone: createElement(RiGamepadLine),
    corTexto: "text-amber-500",
    corFundo: "bg-amber-50",
    componente: EsferaBiofeedback,
    disponivel: true,
  },
  {
    id: "SPACE_SHOOTER",
    nome: "Resistência Espacial",
    descricao:
      "Focado em sustentação (Tônicas). Requer que o paciente mantenha a contração para manter a nave em órbita.",
    icone: createElement(RiRocketLine),
    corTexto: "text-indigo-500",
    corFundo: "bg-indigo-50",
    componente: EsferaBiofeedback,
    disponivel: false,
  },
  {
    id: "SUBMARINO",
    nome: "Trajetória Guiada",
    descricao:
      "Uma bolinha desliza da esquerda para a direita enquanto a contração é sustentada e retorna no relaxamento. A leitura linear mostra ao paciente quanto falta para completar cada repetição.",
    icone: createElement(TbBallTennis),
    corTexto: "text-emerald-500",
    corFundo: "bg-emerald-50",
    componente: BolinhaDeslizante,
    disponivel: true,
  },
];

const POR_ID = new Map(JOGOS.map((jogo) => [jogo.id, jogo]));

/** Motor padrão quando a prescrição não indica um jogo conhecido. */
export const JOGO_PADRAO = JOGOS[0];

/**
 * Resolve um jogo pelo identificador. Aceita a forma do enum do backend
 * (`BOLINHA_DESLIZANTE`) e o slug em minúsculas usado na URL.
 */
export const obterJogo = (id: string | undefined): JogoDefinicao => {
  if (!id) return JOGO_PADRAO;
  return POR_ID.get(id.toUpperCase()) ?? JOGO_PADRAO;
};
