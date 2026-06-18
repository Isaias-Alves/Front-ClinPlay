import api from "./api";

export const exerciciosServices = {
  buscarPorId: async (id: string) => {
    // Ajuste a rota se o backend utilizar outro padrão (ex: /clinica/exercicio/{id})
    const response = await api.get(`/exercicio/${id}`);
    return response.data;
  },

  atualizar: async (id: string, dados: any) => {
    const response = await api.put(`/exercicio/${id}`, dados);
    return response.data;
  },
};
