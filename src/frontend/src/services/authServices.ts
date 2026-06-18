import api from "./api";
import apiComCookies from "./cookiesApi"; // Importando a instância que aceita cookies
import {
  CadastroPacienteRequest,
  CadastroProfissionalRequest,
  AtualizarPacienteRequest,
  AtualizarProfissionalRequest,
  LoginSetup,
} from "@interfaces";

export const authServices = {
  /**
   * Obtém os dados de setup do Google (Nome, Email, Avatar) para preencher o formulário de cadastro.
   * Utiliza a instância com cookies para ler o token de setup injetado pelo backend.
   * @returns {Promise<LoginSetup>} Dados extraídos do Google.
   */
  getLoginSetup: async (): Promise<LoginSetup> => {
    const response = await apiComCookies.get("/auth/setup");
    return response.data;
  },

  /**
   * Obtém os dados do Paciente logado.
   * O ID é capturado automaticamente pelo backend via Token.
   */
  getPacienteInfo: async () => {
    const response = await api.get("/paciente");
    return response.data;
  },

  /**
   * Obtém os dados do Profissional logado.
   * O ID é capturado automaticamente pelo backend via Token.
   */
  getProfissionalInfo: async () => {
    const response = await api.get("/profissional");
    return response.data;
  },

  /**
   * Cadastra um novo Paciente.
   * Envia o cookie "ClinPlay" automaticamente através do apiComCookies.
   * @param {CadastroPacienteRequest} payload - Dados do paciente.
   * @returns {Promise<string>} O novo Access Token gerado.
   */
  cadastrarPaciente: async (
    payload: CadastroPacienteRequest,
  ): Promise<string> => {
    const response = await apiComCookies.post("/paciente", payload);

    const novoAccessToken = response.data;
    if (novoAccessToken) {
      localStorage.setItem("token", novoAccessToken);
    }

    return novoAccessToken;
  },

  /**
   * Cadastra um novo Profissional.
   * Envia o cookie "ClinPlay" automaticamente através do apiComCookies.
   * @param {CadastroProfissionalRequest} payload - Dados do profissional.
   * @returns {Promise<string>} O novo Access Token gerado.
   */
  cadastrarProfissional: async (
    payload: CadastroProfissionalRequest,
  ): Promise<string> => {
    const response = await apiComCookies.post("/profissional", payload);

    const novoAccessToken = response.data;
    if (novoAccessToken) {
      localStorage.setItem("token", novoAccessToken);
    }

    return novoAccessToken;
  },

  /**
   * Atualiza os dados do Paciente.
   */
  atualizarPaciente: async (payload: AtualizarPacienteRequest) => {
    const response = await api.put("/paciente", payload);
    return response.data;
  },

  /**
   * Atualiza os dados do Profissional.
   */
  atualizarProfissional: async (payload: AtualizarProfissionalRequest) => {
    const response = await api.put("/profissional", payload);
    return response.data;
  },

  /**
   * Envia o token de dispositivo do Firebase Cloud Messaging para o backend.
   * Rota: PATCH /auth/fcm-token
   * @param {string} fcmToken - O token gerado pelo Firebase SDK no frontend.
   */
  salvarFcmToken: async (fcmToken: string) => {
    const response = await api.patch("/auth/fcm-token", { fcmToken });
    return response.data;
  },
};

export default authServices;
