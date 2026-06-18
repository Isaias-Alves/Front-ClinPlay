import { ExercicioProtocolo } from "./Exercicios"; // Assumindo que a interface Exercicio esteja em Exercicios.ts
import { PacienteVinculado } from "./Usuario"; // Assumindo que PacienteVinculado esteja relacionado a Usuario

// Interface para o DTO de requisição do backend ProtocoloRequest
export interface ProtocoloRequestApi {
  nome: string;
  clinPlanId: string; // UUID como string em JS
  exercicioIds: string[]; // Set<UUID> mapeia para array de string em JS
}

// Interface para o DTO de resposta do backend ProtocoloResponse
export interface ProtocoloResponseApi {
  id: string;
  nome: string;
  criadorId: string; // UUID como string em JS
  clinPlanId: string; // UUID como string em JS
  exercicioIds: string[]; // Set<UUID> mapeia para array de string em JS
}

// Interface para os dados do formulário no frontend
export interface ProtocoloFormData {
  nome: string;
  objetivo: string;
  categoria: string;
  // Adicionar outros campos se fizerem parte do formulário, por exemplo, relacionados a exercícios ou pacientes
  // Por enquanto, mantendo como no arquivo original, mas isso precisará ser mapeado para ProtocoloRequestApi
}

// Interface para o objeto Protocolo detalhado usado na exibição no frontend
export interface Protocolo {
  id: string;
  nome: string;
  objetivo: string;
  categoria: string;
  imagemUrl?: string;
  exercicios: ExercicioProtocolo[];
  pacientes: PacienteVinculado[];
  criadoEm?: string;
  atualizadoEm?: string;
  criadoPor?: string;
}
