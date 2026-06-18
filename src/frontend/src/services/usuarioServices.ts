import api from "./api";
import authServices from "./authServices";

export const profissionalServices = {
  atualizar: async (dados: any) => {
    try {
      const response = await api.put("/profissional", dados);
      return response.data;
    } catch (error: any) {
      // Tenta renovar o token caso o acesso seja negado
      try {
        const accessToken = await authServices.getNewToken();
        localStorage.setItem("token", accessToken);
        // Tenta a requisição novamente com o novo token
        const response = await api.put("/profissional", dados);
        return response.data;
      } catch (innerError) {
        throw error;
      }
    }
  },

  deletar: async () => {
    try {
      const response = await api.delete("/profissional");
      return response.data;
    } catch (error: any) {
      try {
        const accessToken = await authServices.getNewToken();
        localStorage.setItem("token", accessToken);
        const response = await api.delete("/profissional");
        return response.data;
      } catch (innerError) {
        throw error;
      }
    }
  },
};

export const pacienteServices = {
  atualizar: async (dados: any) => {
    try {
      const response = await api.put("/paciente", dados);
      return response.data;
    } catch (error: any) {
      try {
        const accessToken = await authServices.getNewToken();
        localStorage.setItem("token", accessToken);

        const response = await api.put("/paciente", dados);
        return response.data;
      } catch (innerError) {
        throw error;
      }
    }
  },

  deletar: async () => {
    try {
      const response = await api.delete("/paciente");
      return response.data;
    } catch (error: any) {
      try {
        const accessToken = await authServices.getNewToken();
        localStorage.setItem("token", accessToken);

        const response = await api.delete("/paciente");
        return response.data;
      } catch (innerError) {
        throw error;
      }
    }
  },
};
