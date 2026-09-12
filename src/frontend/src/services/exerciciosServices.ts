import api from "./http";

export const exerciciosServices = {
  /** GET /exercicio/{id} */
  buscarPorId: async (id: string) => {
    const { data } = await api.get(`/exercicio/${id}`);
    return data;
  },

  /** GET /exercicio — exercícios criados pelo profissional logado. */
  listarDoProfissional: async () => {
    const { data } = await api.get("/exercicio");
    return data;
  },

  /** PUT /exercicio/{id} */
  atualizar: async (id: string, dados: Record<string, unknown>) => {
    const { data } = await api.put(`/exercicio/${id}`, dados);
    return data;
  },

  /** DELETE /exercicio/{id} */
  deletar: async (id: string) => {
    const { data } = await api.delete(`/exercicio/${id}`);
    return data;
  },
};

export default exerciciosServices;
