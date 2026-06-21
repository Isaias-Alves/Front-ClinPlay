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
    const setupToken = sessionStorage.getItem("setupToken");
    const response = await apiComCookies.get("/auth/setup", {
      headers: { Authorization: `Bearer ${setupToken}` },
    });
    return response.data;
  },

  /**
   * Encerra a sessão: avisa o backend (DELETE /auth/logout) para invalidar a
   * sessão e o refresh token no servidor e, em seguida, limpa os tokens locais.
   */
  logout: async (): Promise<void> => {
    try {
      await api.delete("/auth/logout");
    } catch {
      // Mesmo se falhar (token expirado, rede), seguimos limpando o local.
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    }
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
    const setupToken = sessionStorage.getItem("setupToken");
    const response = await apiComCookies.post("/paciente", payload, {
      headers: { Authorization: `Bearer ${setupToken}` },
    });

    const { access, refresh } = response.data;
    if (access) {
      localStorage.setItem("token", access);
      if (refresh) localStorage.setItem("refreshToken", refresh);
      sessionStorage.removeItem("setupToken");
    }

    return access;
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
    const setupToken = sessionStorage.getItem("setupToken");
    const response = await apiComCookies.post("/profissional", payload, {
      headers: { Authorization: `Bearer ${setupToken}` },
    });

    const { access, refresh } = response.data;
    if (access) {
      localStorage.setItem("token", access);
      if (refresh) localStorage.setItem("refreshToken", refresh);
      sessionStorage.removeItem("setupToken");
    }

    return access;
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
