/**
 * Limites dos parâmetros clínicos de um exercício.
 *
 * Os mesmos números são editados em três lugares — criar o exercício
 * (`ExercicioFormPage`), prescrever para um paciente
 * (`ModalPrescreverExercicio`) e editar o exercício (`ExercicioDetalhesPage`).
 * Antes nenhum dos três tinha limite: um `<input type="number">` sem `min`
 * aceita `-5`, e apagar o campo devolve `""`, que `Number("")` transforma em
 * `0` sem avisar ninguém.
 *
 * O efeito não é cosmético: `tempoPrincipal: 0` faz o motor do jogo rodar uma
 * fase de duração zero, e `series: -3` gera uma sessão que nunca fecha. Como
 * quem preenche é o fisioterapeuta e quem executa é o paciente, o erro só
 * aparece do outro lado.
 *
 * Os tetos são propositalmente largos — não é papel da interface opinar sobre
 * protocolo clínico, só barrar o que é impossível.
 */

export interface LimiteNumerico {
  min: number;
  max: number;
  /** Rótulo usado na mensagem de erro. */
  rotulo: string;
  /** Campos de contagem não aceitam fração. */
  inteiro: boolean;
}

export const LIMITES_EXERCICIO = {
  vezesAoDia: { min: 1, max: 12, rotulo: "Execuções diárias", inteiro: true },
  series: { min: 1, max: 20, rotulo: "Séries", inteiro: true },
  repeticoes: { min: 1, max: 100, rotulo: "Repetições", inteiro: true },
  tempoPrincipal: {
    min: 0.5,
    max: 120,
    rotulo: "Tempo principal",
    inteiro: false,
  },
  tempoSecundario: {
    min: 0.5,
    max: 120,
    rotulo: "Tempo secundário",
    inteiro: false,
  },
  tempoDescanso: { min: 0, max: 300, rotulo: "Descanso", inteiro: false },
  diasInativo: { min: 0, max: 30, rotulo: "Intervalo em dias", inteiro: true },
} as const satisfies Record<string, LimiteNumerico>;

export type CampoLimitado = keyof typeof LIMITES_EXERCICIO;

/**
 * Valida um campo numérico. Devolve `true` quando está bom, ou a mensagem de
 * erro — o formato que o `react-hook-form` espera em `validate`.
 */
export const validarNumero = (
  valor: unknown,
  campo: CampoLimitado,
): true | string => {
  const { min, max, rotulo, inteiro } = LIMITES_EXERCICIO[campo];

  // Campo apagado chega como `""`; `Number("")` é 0 e passaria despercebido.
  if (valor === "" || valor === null || valor === undefined)
    return `${rotulo}: obrigatório`;

  const n = Number(valor);
  if (!Number.isFinite(n)) return `${rotulo}: valor inválido`;
  if (inteiro && !Number.isInteger(n)) return `${rotulo}: use um número inteiro`;
  if (n < min || n > max) return `${rotulo}: informe entre ${min} e ${max}`;

  return true;
};

/** Atributos de `<input type="number">` coerentes com o limite do campo. */
export const atributosNumero = (campo: CampoLimitado) => {
  const { min, max, inteiro } = LIMITES_EXERCICIO[campo];
  return {
    type: "number" as const,
    min,
    max,
    step: inteiro ? 1 : 0.1,
    // `decimal` abre teclado com vírgula onde não cabe fração nenhuma.
    inputMode: (inteiro ? "numeric" : "decimal") as "numeric" | "decimal",
  };
};

/**
 * Valida a pausa entre sessões escrita como HH:MM.
 *
 * A máscara `##:##` aceita `99:99`, que virava 100,65 horas de bloqueio —
 * quatro dias em que o paciente não conseguiria repetir o exercício.
 */
export const validarHHMM = (valor: string | undefined): true | string => {
  const texto = (valor ?? "").trim();
  if (!texto || texto === "00:00") return true;

  const partes = /^(\d{1,2}):(\d{2})$/.exec(texto);
  if (!partes) return "Use o formato HH:MM (ex: 02:30)";

  const horas = Number(partes[1]);
  const minutos = Number(partes[2]);

  if (minutos > 59) return "Os minutos vão de 00 a 59";
  if (horas > 23) return "As horas vão de 00 a 23";

  return true;
};

/**
 * Valida a data de alta contra a de início.
 *
 * Nada impedia marcar a previsão de alta antes do começo do tratamento; o
 * período resultante era negativo e a barra de progresso do paciente saía
 * quebrada.
 */
export const validarPeriodo = (
  inicio: string | undefined,
  fim: string | undefined,
): true | string => {
  if (!fim) return true; // A previsão de alta é opcional.
  if (!inicio) return true; // O erro pertence ao campo de início.
  // Datas ISO (`yyyy-MM-dd`) comparam corretamente como texto.
  return fim >= inicio || "A previsão de alta não pode ser antes do início";
};

/** Data de hoje no fuso do aparelho, no mesmo formato ISO que a API usa. */
export const hojeISO = (): string => new Date().toLocaleDateString("sv-SE");

/**
 * `fim` é a data limite de acesso, e não uma marca de "finalizado": com data
 * no futuro o tratamento segue ativo. Antes, qualquer data preenchida no
 * cadastro escondia o tratamento do paciente no mesmo dia.
 */
export const tratamentoEncerrado = (t: { fim?: string | null }): boolean =>
  Boolean(t.fim && t.fim < hojeISO());
