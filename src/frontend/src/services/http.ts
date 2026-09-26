import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { refreshTokenStorage, tokenStorage } from "./tokenStorage";

/** Base da API sem barra final, para concatenações previsíveis (`${BASE_URL}/ws`). */
export const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/+$/, "");

const criarInstancia = (withCredentials: boolean): AxiosInstance =>
  axios.create({
    baseURL: BASE_URL,
    withCredentials,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

/** Instância autenticada por Bearer token. Use para tudo que exige sessão. */
const api = criarInstancia(false);

/**
 * Instância que envia o cookie httpOnly "ClinPlay" (refresh/setup token).
 * Usada apenas no fluxo de OAuth, cadastro e renovação de sessão.
 */
export const apiComCookies = criarInstancia(true);

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.obter();

  if (token) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;

  return config;
});

// ==========================================
// RENOVAÇÃO AUTOMÁTICA DE SESSÃO (401)
// ==========================================

type RequisicaoComRetry = InternalAxiosRequestConfig & {
  _jaTentouRefresh?: boolean;
};

/**
 * Refreshes concorrentes compartilham a mesma promise: se cinco requisições
 * falharem com 401 ao mesmo tempo, apenas um GET /auth/refresh é disparado.
 */
let refreshEmAndamento: Promise<string> | null = null;

/** Corpo de `GET /auth/refresh` — o backend devolve o par renovado. */
export interface TokensRenovados {
  access: string;
  refresh: string;
}

/**
 * Renova a sessão.
 *
 * `GET /auth/refresh` exige o refresh token em `Authorization: Bearer` e
 * responde com `{ access, refresh }`. A versão anterior não mandava
 * cabeçalho nenhum (contava com um cookie que o backend não usa) e tratava a
 * resposta como uma string — ou seja, a renovação nunca funcionou: todo 401
 * terminava em logout.
 *
 * Usa `apiComCookies` de propósito, para não reentrar no interceptor de
 * `api` e cair num laço de refresh.
 */
const renovarToken = (): Promise<string> => {
  refreshEmAndamento ??= (async () => {
    const refresh = refreshTokenStorage.obter();
    if (!refresh) throw new Error("Sessão sem refresh token guardado.");

    const { data } = await apiComCookies.get<TokensRenovados>("/auth/refresh", {
      headers: { Authorization: `Bearer ${refresh}` },
    });

    if (!data?.access) throw new Error("Refresh sem token de acesso.");

    tokenStorage.salvar(data.access);
    // O backend rotaciona o refresh token a cada renovação; guardar o novo
    // é o que mantém a sessão viva na próxima vez.
    if (data.refresh) refreshTokenStorage.salvar(data.refresh);

    return data.access;
  })().finally(() => {
    refreshEmAndamento = null;
  });

  return refreshEmAndamento;
};

/** Refresh recusado de verdade: sem token guardado, ou 400/401 do servidor. */
const sessaoRecusada = (falha: unknown): boolean => {
  if (!axios.isAxiosError(falha)) return true;
  const status = falha.response?.status;
  return status === 400 || status === 401;
};

/** Encerra a sessão local e devolve o usuário ao login, sem recarregar a app duas vezes. */
const encerrarSessao = () => {
  tokenStorage.limpar();
  if (window.location.pathname !== "/") window.location.replace("/");
};

api.interceptors.response.use(
  (resposta) => resposta,
  async (erro: AxiosError) => {
    const requisicao = erro.config as RequisicaoComRetry | undefined;

    const podeRenovar =
      erro.response?.status === 401 &&
      requisicao &&
      !requisicao._jaTentouRefresh &&
      !requisicao.url?.includes("/auth/refresh");

    if (!podeRenovar) return Promise.reject(erro);

    requisicao._jaTentouRefresh = true;

    try {
      const novoToken = await renovarToken();
      requisicao.headers.Authorization = `Bearer ${novoToken}`;
      return api(requisicao);
    } catch (falha) {
      // Só desloga quando o servidor recusou o refresh token. Rede fora ou
      // API acordando (Render) devolvem erro sem status ou 5xx; nesses casos
      // o PWA reaberto mantinha a sessão válida e mesmo assim caía no login.
      if (sessaoRecusada(falha)) {
        encerrarSessao();
        return Promise.reject(erro);
      }
      // Propaga a falha de rede, e não o 401 original: quem chamou precisa
      // saber que a sessão continua válida e que vale tentar de novo.
      return Promise.reject(falha);
    }
  },
);

export default api;
