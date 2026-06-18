import api from "./api";

export const assinaturaServices = {
  /**
   * Associa um plano a uma clínica.
   * Rota: POST /clinica/{clinicaId}/plano
   */
  aderir: async (
    clinicaId: string,
    dados: { planoId: string; validade: string },
  ) => {
    const response = await api.post(`/clinica/${clinicaId}/plano`, dados);
    return response.data;
  },
};
