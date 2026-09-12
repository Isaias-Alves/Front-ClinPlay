import api, { apiComCookies } from "./http";
import { setupTokenStorage, tokenStorage } from "./tokenStorage";
import {
  CadastroPacienteRequest,
  CadastroProfissionalRequest,
  AtualizarPacienteRequest,
  AtualizarProfissionalRequest,
  LoginSetup,
} from "@interfaces";

/** Persiste o access token devolvido pelos fluxos de cadastro/refresh. */
const guardarToken = (token: string): string => {
  if (token) tokenStorage.salvar(token);
  return token;
};

/**
 * Cabeçalho com o token de setup do OAuth.
 *
 * O backend entrega esse token na URL de retorno, não num cookie — Vercel e
 * Render são domínios distintos, então um cookie de sessão seria de
 * terceiros. Sem este cabeçalho, `/auth/setup` e os dois cadastros respondem
 * 400 "Token de setup inválido ou expirado".
 *
 * Devolve um objeto vazio quando não há token, para não enviar
 * `Authorization: Bearer null`.
 */
const cabecalhoSetup = () => {
  const token = setupTokenStorage.obter();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

export const authServices = {
  /**
   * Obtém os dados de setup do Google (Nome, Email, Avatar) para preencher o formulário de cadastro.
   * Utiliza a instância com cookies para ler o token de setup injetado pelo backend.
   * @returns {Promise<LoginSetup>} Dados extraídos do Google.
   */
  getLoginSetup: async (): Promise<LoginSetup> => {
    const response = await apiComCookies.get("/auth/setup", {
      headers: cabecalhoSetup(),
    });
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
    const response = await apiComCookies.post("/paciente", payload, {
      headers: cabecalhoSetup(),
    });

    // O token de setup vale por um cadastro só; guardá-lo depois disso
    // deixaria credencial morta na aba.
    setupTokenStorage.limpar();

    return guardarToken(response.data);
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
    const response = await apiComCookies.post("/profissional", payload, {
      headers: cabecalhoSetup(),
    });

    setupTokenStorage.limpar();

    return guardarToken(response.data);
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
  /**
   * Troca o cookie httpOnly de refresh por um novo access token.
   * Rota: GET /auth/refresh
   */
  renovarToken: async (): Promise<string> => {
    const response = await apiComCookies.get<string>("/auth/refresh");
    return guardarToken(response.data);
  },

  /**
   * Encerra a sessão no backend e limpa o estado local.
   * Rota: DELETE /auth/logout
   */
  logout: async (): Promise<void> => {
    try {
      await api.delete("/auth/logout");
    } finally {
      tokenStorage.limpar();
      setupTokenStorage.limpar();
    }
  },

  salvarFcmToken: async (fcmToken: string) => {
    const response = await api.patch("/auth/fcm-token", { fcmToken });
    return response.data;
  },
};

export default authServices;
