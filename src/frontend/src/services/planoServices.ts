import api from "./api";

export interface PlanoResponse {
  id: string; // ou number dependendo do seu backend
  nome: string;
  maxProfissionais: number;
  maxPacientes: number;
  maxExercicios: number;
  disponivel: boolean;
}

export const planoServices = {
  listar: async (): Promise<PlanoResponse[]> => {
    const response = await api.get("/plano");
    return response.data;
  },
};
