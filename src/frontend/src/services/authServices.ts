import api, { apiComCookies, type TokensRenovados } from "./http";
import {
  refreshTokenStorage,
  setupTokenStorage,
  tokenStorage,
} from "./tokenStorage";
import {
  CadastroPacienteRequest,
  CadastroProfissionalRequest,
  AtualizarPacienteRequest,
  AtualizarProfissionalRequest,
  LoginSetup,
} from "@interfaces";

/**
 * Persiste o par de tokens devolvido pelos fluxos de cadastro e de refresh.
 *
 * `POST /paciente`, `POST /profissional` e `GET /auth/refresh` respondem
 * todos com `{ access, refresh }`. O código anterior tratava a resposta como
 * uma string e gravava o objeto inteiro como access token.
 */
const guardarTokens = (tokens: TokensRenovados): string => {
  if (tokens?.access) tokenStorage.salvar(tokens.access);
  if (tokens?.refresh) refreshTokenStorage.salvar(tokens.refresh);
  return tokens?.access ?? "";
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
   * Obtém os dados de setup do Google para preencher o cadastro.
   * Autenticado pelo token de setup recebido na URL de retorno do OAuth.
   * @returns {Promise<LoginSetup>} Nome, e-mail e avatar extraídos do Google.
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
   * Cadastra um novo Paciente. Autenticado pelo token de setup.
   * @param {CadastroPacienteRequest} payload - Dados do paciente.
   * @returns {Promise<string>} O novo Access Token gerado.
   */
  cadastrarPaciente: async (
    payload: CadastroPacienteRequest,
  ): Promise<string> => {
    const response = await apiComCookies.post<TokensRenovados>(
      "/paciente",
      payload,
      { headers: cabecalhoSetup() },
    );

    // O token de setup vale por um cadastro só; guardá-lo depois disso
    // deixaria credencial morta na aba.
    setupTokenStorage.limpar();

    return guardarTokens(response.data);
  },

  /**
   * Cadastra um novo Profissional. Autenticado pelo token de setup.
   * @param {CadastroProfissionalRequest} payload - Dados do profissional.
   * @returns {Promise<string>} O novo Access Token gerado.
   */
  cadastrarProfissional: async (
    payload: CadastroProfissionalRequest,
  ): Promise<string> => {
    const response = await apiComCookies.post<TokensRenovados>(
      "/profissional",
      payload,
      { headers: cabecalhoSetup() },
    );

    setupTokenStorage.limpar();

    return guardarTokens(response.data);
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
   * Troca o refresh token guardado por um novo par de tokens.
   * Rota: GET /auth/refresh (Authorization: Bearer <refresh>)
   */
  renovarToken: async (): Promise<string> => {
    const refresh = refreshTokenStorage.obter();
    if (!refresh) throw new Error("Sessão sem refresh token guardado.");

    const response = await apiComCookies.get<TokensRenovados>("/auth/refresh", {
      headers: { Authorization: `Bearer ${refresh}` },
    });

    return guardarTokens(response.data);
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
