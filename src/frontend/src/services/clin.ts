import type {
  ClinicaVinculo,
  PacienteVinculadoClinica,
  ProfissionalVinculado,
} from "@interfaces";
import api from "./http";

interface PermissoesProfissional {
  adminClinica: boolean;
  adminExercicios: boolean;
  adminPacientes: boolean;
  adminProfissionais: boolean;
}

export const clinicasServices = {
  // ==========================================
  // CLÍNICA - CORE
  // ==========================================

  criarClinica: async (dados: {
    nome: string;
    cnpj: string;
    tag: string;
    especialidade: string;
    uf: string;
    cidade: string;
  }) => {
    const { data } = await api.post("/clinica", dados);
    return data;
  },

  listar: async (params?: {
    nome?: string;
    especialidade?: string;
    localizacao?: string;
    page?: number;
    size?: number;
  }) => {
    const { data } = await api.get("/clinica", { params });
    return data;
  },

  /** GET /clinica/tag/{tag} — busca pública de uma clínica pelo código/tag. */
  buscarPorTag: async (tag: string) => {
    const { data } = await api.get(`/clinica/tag/${tag}`);
    return data;
  },

  /**
   * GET /clinica/minhas — clínicas vinculadas ao usuário logado.
   * O backend resolve paciente vs. profissional pelo token, então este é o
   * único método necessário para os dois perfis.
   */
  buscarMinhasClinicas: async (): Promise<ClinicaVinculo[]> => {
    const { data } = await api.get("/clinica/minhas");
    return data;
  },

  /**
   * INEXISTENTE no backend (404).
   * Confirmado: o `ClinicaController` tem `PUT /clinica/{id}` mas nenhum
   * `DELETE`. Clínicas são desativadas pelo campo `ativo`, sem rota exposta.
   */
  deletarClinica: async (clinicaId: string) => {
    const { data } = await api.delete(`/clinica/${clinicaId}`);
    return data;
  },

  editarClinica: async (
    clinicaId: string,
    dados: { nome: string; especialidade: string; uf: string; cidade: string },
  ) => {
    const { data } = await api.put(`/clinica/${clinicaId}`, dados);
    return data;
  },

  // ==========================================
  // VÍNCULOS E LISTAGENS DA CLÍNICA
  // ==========================================

  listarExercicios: async (clinicaId: string) => {
    const { data } = await api.get(`/clinica/${clinicaId}/exercicios`);
    return data;
  },

  listarProfissionais: async (
    clinicaId: string,
  ): Promise<ProfissionalVinculado[]> => {
    const { data } = await api.get(`/clinica/${clinicaId}/profissionais`);
    return data;
  },

  listarPacientes: async (
    clinicaId: string,
  ): Promise<PacienteVinculadoClinica[]> => {
    const { data } = await api.get(`/clinica/${clinicaId}/pacientes`);
    return data;
  },

  // As rotas de exclusão usam o recurso no singular no backend
  // (DELETE /clinica/{id}/profissional/{id}); o plural devolvia 404.
  deletarProfissionalVinculado: async (
    clinicaId: string,
    profissionalId: string,
  ) => {
    const { data } = await api.delete(
      `/clinica/${clinicaId}/profissional/${profissionalId}`,
    );
    return data;
  },

  deletarPacienteVinculado: async (clinicaId: string, pacienteId: string) => {
    const { data } = await api.delete(
      `/clinica/${clinicaId}/paciente/${pacienteId}`,
    );
    return data;
  },

  deletarExercicioVinculado: async (clinicaId: string, exercicioId: string) => {
    const { data } = await api.delete(
      `/clinica/${clinicaId}/exercicio/${exercicioId}`,
    );
    return data;
  },

  atualizarPermissoesProfissional: async (
    clinicaId: string,
    profissionalId: string,
    permissoes: PermissoesProfissional,
  ) => {
    const { data } = await api.put(
      `/clinica/${clinicaId}/profissionais/${profissionalId}/permissoes`,
      permissoes,
    );
    return data;
  },

  // ==========================================
  // SOLICITAÇÕES E PENDÊNCIAS (VIA REST)
  // ==========================================

  responderSolicitacao: async (
    id: string,
    dados: { aprovado: boolean; resposta?: string },
  ) => {
    const { data } = await api.put(`/solicitacao/${id}`, dados);
    return data;
  },

  solicitarVinculoPaciente: async (tagClinica: string) => {
    const { data } = await api.post(`/solicitacao/paciente/${tagClinica}`);
    return data;
  },

  solicitarVinculoProfissional: async (tagClinica: string) => {
    const { data } = await api.post(`/solicitacao/profissional/${tagClinica}`);
    return data;
  },

  /** PUT /clinica/{clinicaId}/aprovacao-automatica — só dono e adminClinica. */
  atualizarAprovacaoAutomatica: async (clinicaId: string, ativo: boolean) => {
    await api.put(`/clinica/${clinicaId}/aprovacao-automatica`, { ativo });
  },

  solicitarExercicio: async (
    clinicaId: string,
    dados: {
      nome: string;
      descricao?: string;
      jogo: string;
      videoUrl?: string;
      mensagem?: string;
      configPadrao: Record<string, unknown>;
    },
  ) => {
    const { data } = await api.post(
      `/solicitacao/exercicio/${clinicaId}`,
      dados,
    );
    return data;
  },
};

export default clinicasServices;
