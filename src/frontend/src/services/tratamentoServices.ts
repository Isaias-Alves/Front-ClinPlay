import api from "./api";

export const tratamentoServices = {
  /**
   * Cria um novo tratamento para um paciente na clínica.
   * Rota: POST /tratamento/{clinicaId}
   */
  criar: async (
    clinicaId: string,
    dados: {
      clinPacienteId: string;
      descricao: string;
      inicio: string;
      fim?: string | null;
      lembreteConfig: {
        sequencia: boolean;
        exercicios: boolean;
      };
    },
  ) => {
    const response = await api.post(`/tratamento/${clinicaId}`, dados);
    return response.data;
  },

  /**
   * Finaliza um tratamento ativo.
   * Rota: PUT /tratamento/{id}/finalizar
   */
  finalizar: async (id: string) => {
    const response = await api.put(`/tratamento/${id}/finalizar`);
    return response.data;
  },
};
