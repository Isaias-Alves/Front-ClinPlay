import type { Clinica, ContagensClinica } from "./Clinicas";
import type { TratamentoResponseApi } from "./Tratamentos";

/**
 * Tipos dos vínculos entre usuários e clínicas.
 *
 * Estes formatos vinham do backend como `any` espalhado por seis telas. Os
 * campos opcionais não são preguiça: refletem que `GET /clinica/minhas`
 * devolve recortes diferentes conforme o perfil (paciente recebe
 * `tratamentos`, profissional recebe `permissoes`).
 */

/** Permissões de um profissional dentro de uma clínica. */
export interface PermissoesClinica {
  /** Criador da clínica: tem todas as permissões e não pode ser removido. */
  dono?: boolean;
  adminClinica?: boolean;
  adminExercicios?: boolean;
  adminPacientes?: boolean;
  adminProfissionais?: boolean;
}

/** Permissões que a interface permite alternar (o `dono` não é editável). */
export type ChavePermissao = Exclude<keyof PermissoesClinica, "dono">;

/** Payload de PUT /clinica/{id}/profissionais/{id}/permissoes. */
export type PermissoesRequest = Required<Record<ChavePermissao, boolean>>;

/**
 * Vínculo do usuário logado com uma clínica (GET /clinica/minhas).
 *
 * O identificador chega ora como `id`, ora como `clinicaId`, conforme o DTO
 * usado no backend — daí o `clinicaId` opcional e o padrão `clinicaId ?? id`
 * espalhado pelas telas.
 */
export interface ClinicaVinculo extends Partial<Clinica>, ContagensClinica {
  id: string;
  clinicaId?: string;
  nome: string;

  // Dados cadastrais da clínica. Opcionais porque o recorte devolvido muda
  // conforme o perfil: o paciente não recebe CNPJ nem limites do plano.
  tag?: string;
  cnpj?: string;
  especialidade?: string;
  uf?: string;
  cidade?: string;

  /** Plano contratado da clínica, quando o endpoint o aninha. */
  clinPlan?: { id?: string; nome?: string } | null;

  /** Presente para o profissional. */
  permissoes?: PermissoesClinica;
  /** Presente para o paciente: os tratamentos dele naquela clínica. */
  tratamentos?: TratamentoResponseApi[];
}

/** Profissional vinculado a uma clínica (GET /clinica/{id}/profissionais). */
export interface ProfissionalVinculado extends PermissoesClinica {
  id: string;
  profissionalId: string;
  nome: string;
  avatar?: string | null;
  crefito?: string;
  especialidade?: string;
  email?: string;
  telefone?: string;
}

/** Paciente vinculado a uma clínica (GET /clinica/{id}/pacientes). */
export interface PacienteVinculadoClinica {
  id: string;
  pacienteId: string;
  /**
   * Id do vínculo em si, usado para desvincular e para prescrever. Chega com
   * dois nomes conforme o endpoint, daí os dois campos.
   */
  vinculoId?: string;
  clinPacienteId?: string;
  nome: string;
  avatar?: string | null;
  cpf?: string;
  email?: string;
  telefone?: string;
}

/** Campos comuns a qualquer solicitação pendente. */
interface SolicitacaoBase {
  id: string;
  mensagem?: string | null;
}

export interface SolicitacaoProfissional extends SolicitacaoBase {
  profissionalNome: string;
  profissionalAvatar?: string | null;
  profissionalCrefito?: string | null;
  profissionalEspecialidade?: string | null;
  profissionalEmail?: string | null;
  profissionalTelefone?: string | null;
}

export interface SolicitacaoPaciente extends SolicitacaoBase {
  pacienteNome: string;
  pacienteAvatar?: string | null;
  pacienteCpf?: string | null;
  pacienteEmail?: string | null;
  pacienteTelefone?: string | null;
}

export interface SolicitacaoExercicio extends SolicitacaoBase {
  nome: string;
  solicitanteNome?: string | null;
}

export type TipoSolicitacao = "PROFISSIONAL" | "PACIENTE" | "EXERCICIO";

/**
 * Eventos do tópico `/user/queue/clinica/{id}/solicitacoes`.
 * União discriminada por `evento`: o TypeScript passa a exigir a checagem
 * antes de ler `profissionais`, `paciente` etc.
 */
export type EventoSolicitacoes =
  | {
      evento: "ESTADO_ATUAL";
      profissionais?: SolicitacaoProfissional[];
      pacientes?: SolicitacaoPaciente[];
      exercicios?: SolicitacaoExercicio[];
    }
  | {
      evento: "SOLICITACAO_CRIADA";
      tipo: TipoSolicitacao;
      profissional?: SolicitacaoProfissional;
      paciente?: SolicitacaoPaciente;
      exercicio?: SolicitacaoExercicio;
    }
  | {
      evento: "SOLICITACAO_RESPONDIDA";
      tipo: TipoSolicitacao;
      solicitacaoId: string;
    };
