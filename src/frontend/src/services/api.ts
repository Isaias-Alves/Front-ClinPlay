import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL || "https://clinplay-api.onrender.com";

const api = axios.create({
  baseURL,

  withCredentials: false,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

// --- Refresh automático em 401 ---
// Quando o access token expira, tenta renová-lo com o refresh token guardado
// e refaz a requisição original. Requisições simultâneas aguardam um único
// refresh em andamento (fila) para evitar múltiplas renovações em paralelo.

let isRefreshing = false;
let fila: Array<(token: string | null) => void> = [];

const processarFila = (token: string | null) => {
  fila.forEach((cb) => cb(token));
  fila = [];
};

const deslogar = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      deslogar();
      return Promise.reject(error);
    }

    // Já há um refresh em andamento: entra na fila e espera o novo token.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        fila.push((token) => {
          if (token) {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          } else {
            reject(error);
          }
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      // Instância "crua" (axios direto) para não reentrar neste interceptor.
      const { data } = await axios.get(`${baseURL}/auth/refresh`, {
        headers: { Authorization: `Bearer ${refreshToken}` },
      });

      localStorage.setItem("token", data.access);
      localStorage.setItem("refreshToken", data.refresh);

      processarFila(data.access);

      original.headers.Authorization = `Bearer ${data.access}`;
      return api(original);
    } catch (e) {
      processarFila(null);
      deslogar();
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
