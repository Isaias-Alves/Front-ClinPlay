import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { tokenStorage } from "./tokenStorage";

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

const renovarToken = (): Promise<string> => {
  refreshEmAndamento ??= apiComCookies
    .get<string>("/auth/refresh")
    .then(({ data }) => {
      if (!data) throw new Error("Refresh sem token de acesso.");
      tokenStorage.salvar(data);
      return data;
    })
    .finally(() => {
      refreshEmAndamento = null;
    });

  return refreshEmAndamento;
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
    } catch {
      encerrarSessao();
      return Promise.reject(erro);
    }
  },
);

export default api;
