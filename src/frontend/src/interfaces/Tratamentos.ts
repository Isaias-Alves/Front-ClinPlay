import { ExercicioConfig } from "./Exercicios";

/** Espelha FeedbackView.java. */
export interface FeedbackView {
  id: string;
  avaliacao: number;
  comentario?: string | null;
  criadoEm?: string;
  /** Instante do envio, como devolvido pela sala de tratamento. */
  quando?: string;
  /** `true` depois que o profissional abriu o feedback. */
  visto?: boolean;
  /** Preenchido ao achatar os feedbacks de todas as prescrições numa lista. */
  prescricaoId?: string;
  exercicioNome?: string;
}

/**
 * Espelha PrescricaoView.java — o payload que o paciente recebe ao abrir
 * um exercício. É a entrada dos minigames (ver `src/games`).
 */
export interface PrescricaoView {
  id: string;
  observacao?: string | null;
  objetivo?: string | null;
  disponivel: boolean;
  ordem: number;
  exercicioId: string;
  exercicioNome: string;
  exercicioDescricao?: string | null;
  /** Chave do motor visual; corresponde ao enum Jogo do backend. */
  exercicioJogo: string;
  exercicioVideoUrl?: string | null;
  /** Customização da prescrição; cai para o configPadrao do exercício. */
  customizacao?: Partial<ExercicioConfig> | null;
  feedbacks: FeedbackView[];
}

export interface LembreteConfig {
  sequencia: boolean;
  exercicios: boolean;
}

/** Espelha TratamentoView.java. */
export interface TratamentoResponseApi {
  id: string;
  descricao: string;
  inicio: string; // LocalDate (YYYY-MM-DD)
  fim?: string | null;
  progresso: number;
  sequencia: number;
  ultimaAcao?: string | null;
  lembreteConfig?: LembreteConfig | null;
  prescricoes?: PrescricaoView[];

  // Campos de `ObterTratamento` — o recorte aninhado em `GET /clinica/minhas`,
  // que identifica as partes envolvidas mas não traz descrição, datas,
  // progresso nem prescrições. Esses só chegam pelo `TratamentoView` do
  // WebSocket, em resposta a um `OBTER`.
  clinPacienteId?: string;
  pacienteId?: string;
  pacienteNome?: string;
  pacienteAvatar?: string | null;
  clinProfissionalId?: string | null;
  profissionalId?: string | null;
  profissionalNome?: string | null;
  profissionalAvatar?: string | null;
  profissionalCrefito?: string | null;
  /**
   * Nenhum DTO do backend devolve este campo hoje; ficou declarado porque a
   * tela do paciente tinha um fallback para ele. Mantido opcional apenas
   * para não quebrar essa leitura defensiva.
   */
  protocoloId?: string | null;
}

/** Espelha CadastroTratamento.java. */
export interface CadastroTratamentoRequestApi {
  clinPacienteId: string;
  descricao: string;
  inicio: string; // LocalDate (YYYY-MM-DD)
  lembreteConfig?: LembreteConfig;
}

/**
 * Eventos do tópico `/topic/tratamento/{id}`.
 *
 * União discriminada por `evento`: sem ela o reducer da sala recebia `any` e
 * lia `evento.prescricao`, `evento.feedbackId` e afins sem qualquer garantia
 * de que o campo existe naquele tipo de evento.
 */
export type EventoTratamento =
  | { evento: "ESTADO_ATUAL"; tratamento: TratamentoResponseApi }
  | {
      evento: "TRATAMENTO_EDITADO";
      tratamento: Partial<TratamentoResponseApi>;
    }
  | { evento: "PRESCRICAO_ADICIONADA"; prescricao: PrescricaoView }
  | { evento: "PRESCRICAO_EDITADA"; prescricao: PrescricaoView }
  | { evento: "PRESCRICAO_REMOVIDA"; prescricaoId: string }
  | {
      evento: "FEEDBACK_CRIADO";
      progresso: number;
      /** Dias consecutivos de adesão, recalculado a cada feedback. */
      sequencia?: number;
      ultimaAcao?: string | null;
      feedback: FeedbackView & { prescricaoId: string };
    }
  | { evento: "FEEDBACK_VISTO"; feedbackId: string }
  /** Resposta a `REORDENAR_PRESCRICOES`: a nova ordem, por id. */
  | { evento: "PRESCRICOES_REORDENADAS"; ordem: string[] };

/**
 * Erro devolvido pela fila `/user/queue/erros`.
 * O backend envia um `EventoSaida` com `evento: "ERRO"`.
 */
export interface ErroSocket {
  evento?: "ERRO";
  mensagem?: string;
  codigo?: number;
}

/** Mensagens que o cliente pode enviar para `/app/tratamento/{id}`. */
export type TipoMensagemTratamento =
  | "OBTER"
  | "EDITAR_TRATAMENTO"
  | "ADICIONAR_PRESCRICAO"
  | "REMOVER_PRESCRICAO"
  | "EDITAR_PRESCRICAO"
  | "REORDENAR_PRESCRICOES"
  | "MARCAR_FEEDBACK_VISTO"
  | "CRIAR_FEEDBACK";
