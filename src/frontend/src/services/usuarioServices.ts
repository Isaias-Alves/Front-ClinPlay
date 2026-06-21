import api from "./api";

// O refresh do access token em caso de 401 é tratado de forma centralizada
// pelo interceptor de response em ./api (renova com o refresh token e refaz
// a requisição). Por isso estes métodos chamam a API diretamente.

export const profissionalServices = {
  atualizar: async (dados: any) => {
    const response = await api.put("/profissional", dados);
    return response.data;
  },

  deletar: async () => {
    const response = await api.delete("/profissional");
    return response.data;
  },
};

export const pacienteServices = {
  atualizar: async (dados: any) => {
    const response = await api.put("/paciente", dados);
    return response.data;
  },

  deletar: async () => {
    const response = await api.delete("/paciente");
    return response.data;
  },
};
