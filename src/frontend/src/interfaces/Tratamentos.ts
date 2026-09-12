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

  // Presentes em ObterTratamento (REST), ausentes no TratamentoView (WebSocket).
  clinPacienteId?: string;
  pacienteId?: string;
  pacienteNome?: string;
  pacienteAvatar?: string | null;
  clinProfissionalId?: string | null;
  profissionalId?: string | null;
  profissionalNome?: string | null;
  profissionalAvatar?: string | null;
  profissionalCrefito?: string | null;
  protocoloId?: string | null;

  /**
   * Alguns endpoints aninham os dados do profissional em vez de achatá-los
   * em `profissionalNome`/`profissionalCrefito`. Declarado como opcional
   * enquanto os dois formatos coexistirem — a tela do paciente já fazia o
   * fallback para este objeto, só que sem tipo nenhum.
   */
  profissional?: {
    nome?: string;
    crefito?: string;
    avatar?: string | null;
  } | null;
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
      ultimaAcao?: string | null;
      feedback: FeedbackView & { prescricaoId: string };
    }
  | { evento: "FEEDBACK_VISTO"; feedbackId: string };

/** Erro devolvido pela fila `/user/queue/erros`. */
export interface ErroSocket {
  mensagem?: string;
}
