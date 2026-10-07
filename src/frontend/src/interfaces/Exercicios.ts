/** Configuração de execução de um exercício (espelha ExercicioConfig.java). */
export interface ExercicioConfig {
  vezesAoDia: number;
  series: number;
  repeticoes: number;
  diasInativo: number;
  acaoPrincipal: string;
  acaoSecundaria: string;
  /** Horas que o paciente deve ficar sem repetir o exercício. */
  tempoInativo: number;
  /** Segundos da ação principal. */
  tempoPrincipal: number;
  /** Segundos da ação secundária. */
  tempoSecundario: number;
  /** Segundos de pausa entre uma repetição e a próxima. */
  tempoDescanso: number;
  /**
   * Segundos de pausa entre uma série e a próxima. Nulo nos exercícios e
   * prescrições anteriores ao campo: o motor usa `tempoDescanso` no lugar.
   */
  tempoDescansoSeries?: number | null;
}

export interface Exercicio {
  nome: string;
  descricao: string;
  /** Identificador do motor visual (ver `Jogo.java` e `src/games/registro.ts`). */
  jogo: string;
  videoUrl?: string;
  /**
   * Algumas respostas trazem a URL do vídeo em snake_case. Enquanto o
   * backend não unificar, as telas leem `videoUrl ?? url_video` — antes, a
   * listagem do profissional lia só `url_video` e o tipo declarava só
   * `videoUrl`, divergência que o `any` mantinha invisível.
   */
  url_video?: string;
  configPadrao?: Partial<ExercicioConfig>;
}

export interface ExercicioInfoResponse extends Exercicio {
  id: string;
}

/** Exercício como aparece dentro de um protocolo. */
export interface ExercicioProtocolo extends ExercicioInfoResponse {
  ordem?: number;
}
