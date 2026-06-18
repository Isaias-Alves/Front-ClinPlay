import api from "./api";

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
    const response = await api.post("/clinica", dados);
    return response.data;
  },

  listar: async (params?: {
    nome?: string;
    especialidade?: string;
    localizacao?: string;
    page?: number;
    size?: number;
  }) => {
    const response = await api.get("/clinica", { params });
    return response.data;
  },

  buscarPorTag: async (tag: string) => {
    const response = await api.get(`/clinica/tag/${tag}`);
    return response.data;
  },

  buscarMinhasClinicas: async (): Promise<any[]> => {
    const response = await api.get("/clinica/minhas");
    return response.data;
  },

  editarClinica: async (
    clinicaId: string,
    dados: { nome: string; especialidade: string; uf: string; cidade: string },
  ) => {
    const response = await api.put(`/clinica/${clinicaId}`, dados);
    return response.data;
  },

  // ==========================================
  // VÍNCULOS E LISTAGENS DA CLÍNICA
  // ==========================================

  listarExercicios: async (clinicaId: string) => {
    const response = await api.get(`/clinica/${clinicaId}/exercicios`);
    return response.data;
  },

  listarProfissionais: async (clinicaId: string) => {
    const response = await api.get(`/clinica/${clinicaId}/profissionais`);
    return response.data;
  },

  listarPacientes: async (clinicaId: string) => {
    const response = await api.get(`/clinica/${clinicaId}/pacientes`);
    return response.data;
  },

  deletarProfissionalVinculado: async (
    clinicaId: string,
    profissionalId: string,
  ) => {
    const response = await api.delete(
      `/clinica/${clinicaId}/profissionais/${profissionalId}`,
    );
    return response.data;
  },

  deletarPacienteVinculado: async (clinicaId: string, pacienteId: string) => {
    const response = await api.delete(
      `/clinica/${clinicaId}/pacientes/${pacienteId}`,
    );
    return response.data;
  },

  atualizarPermissoesProfissional: async (
    clinicaId: string,
    profissionalId: string,
    permissoes: {
      adminClinica: boolean;
      adminExercicios: boolean;
      adminPacientes: boolean;
      adminProfissionais: boolean;
    },
  ) => {
    const response = await api.put(
      `/clinica/${clinicaId}/profissionais/${profissionalId}/permissoes`,
      permissoes,
    );
    return response.data;
  },

  // ==========================================
  // SOLICITAÇÕES E PENDÊNCIAS (VIA REST)
  // ==========================================

  responderSolicitacao: async (
    id: string,
    dados: { aprovado: boolean; resposta?: string },
  ) => {
    const response = await api.put(`/solicitacao/${id}`, dados);
    return response.data;
  },

  solicitarVinculoPaciente: async (tagClinica: string) => {
    const response = await api.post(`/solicitacao/paciente/${tagClinica}`);
    return response.data;
  },

  solicitarVinculoProfissional: async (tagClinica: string) => {
    const response = await api.post(`/solicitacao/profissional/${tagClinica}`);
    return response.data;
  },

  solicitarExercicio: async (
    clinicaId: string,
    dados: {
      nome: string;
      descricao?: string;
      jogo: string;
      videoUrl?: string;
      mensagem?: string;
      configPadrao: any;
    },
  ) => {
    const response = await api.post(
      `/solicitacao/exercicio/${clinicaId}`,
      dados,
    );
    return response.data;
  },
};
