import type { ComponentType, ReactNode } from "react";

/** Fases do ciclo de um exercício, na ordem em que ocorrem. */
export type FaseExercicio =
  "PREPARANDO" | "ACAO_PRINCIPAL" | "ACAO_SECUNDARIA" | "PAUSA" | "CONCLUIDO";

/** Parâmetros de execução já normalizados a partir da prescrição. */
export interface ConfigMotor {
  acaoPrincipal: string;
  acaoSecundaria: string;
  /** Durações em segundos. */
  tempoPrincipal: number;
  tempoSecundario: number;
  tempoPausa: number;
  seriesTotais: number;
  repeticoesTotais: number;
}

/** Estado observável do motor, consumido pelo shell e pelos jogos. */
export interface EstadoMotor {
  fase: FaseExercicio;
  /** Segundos restantes na fase, arredondados para cima (para exibição). */
  tempoRestante: number;
  /** Progresso dentro da fase atual, de 0 a 1. Base das animações. */
  progresso: number;
  serieAtual: number;
  repAtual: number;
  pausado: boolean;
}

/**
 * Contrato de um minigame. Cada jogo recebe o mesmo estado do motor e é
 * livre para representá-lo visualmente — não controla tempo nem progressão.
 */
export interface PropsMotorVisual {
  estado: EstadoMotor;
  config: ConfigMotor;
}

/** Metadados + componente de um jogo, usados na vitrine e na execução. */
export interface JogoDefinicao {
  /** Deve corresponder a um valor do enum `Jogo` do backend. */
  id: string;
  nome: string;
  descricao: string;
  icone: ReactNode;
  corTexto: string;
  corFundo: string;
  componente: ComponentType<PropsMotorVisual>;
  /**
   * `false` enquanto o motor visual próprio não existir. O id continua no
   * registro porque espelha o enum `Jogo` do backend — o que muda é que a
   * vitrine não deixa prescrever um jogo que renderizaria outra coisa.
   */
  disponivel: boolean;
}
