const CHAVE_TOKEN = "token";
const CHAVE_REFRESH = "refreshToken";
const CHAVE_CLINICA = "clinicaSelecionadaId";

/**
 * Ponto único de acesso ao access token.
 *
 * Antes cada módulo chamava `localStorage.getItem("token")` diretamente, o que
 * espalhava a chave por 6 arquivos e tornava impossível trocar a estratégia de
 * armazenamento (ex.: migrar para memória + cookie httpOnly) sem caçar strings.
 */
export const tokenStorage = {
  obter: (): string | null => localStorage.getItem(CHAVE_TOKEN),

  salvar: (token: string): void => localStorage.setItem(CHAVE_TOKEN, token),

  /** Remove o token e todo o estado de sessão derivado dele. */
  limpar: (): void => {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_REFRESH);
    localStorage.removeItem(CHAVE_CLINICA);
  },
};

/**
 * Refresh token da sessão.
 *
 * O backend não usa cookie: entrega o refresh token no fragmento da URL de
 * retorno do OAuth (`#refresh_token=`) e espera recebê-lo de volta como
 * `Authorization: Bearer` em `GET /auth/refresh`. Não há, portanto, como
 * mantê-lo fora do alcance do JavaScript — guardar aqui é a única opção
 * compatível com esse desenho.
 *
 * Fica em `localStorage` para a sessão sobreviver ao fechamento do
 * navegador, como era antes. Trocar por `sessionStorage` reduziria a
 * exposição a XSS ao custo de exigir novo login a cada abertura.
 */
export const refreshTokenStorage = {
  obter: (): string | null => localStorage.getItem(CHAVE_REFRESH),
  salvar: (token: string): void => localStorage.setItem(CHAVE_REFRESH, token),
  limpar: (): void => localStorage.removeItem(CHAVE_REFRESH),
};

/**
 * Token de setup do OAuth.
 *
 * O backend devolve este token na URL de retorno (`?setup_token=`) em vez de
 * num cookie, porque frontend (Vercel) e backend (Render) ficam em domínios
 * diferentes e o cookie seria de terceiros — bloqueado por vários
 * navegadores. Ele autentica apenas as chamadas do fluxo de cadastro
 * (`GET /auth/setup`, `POST /paciente`, `POST /profissional`) e é descartado
 * assim que a conta é criada.
 *
 * Fica em `sessionStorage`, e não em `localStorage`, porque a sua validade é
 * a da aba: não deve sobreviver ao fechamento do navegador.
 */
const CHAVE_SETUP = "setupToken";

export const setupTokenStorage = {
  obter: (): string | null => sessionStorage.getItem(CHAVE_SETUP),
  salvar: (token: string): void => sessionStorage.setItem(CHAVE_SETUP, token),
  limpar: (): void => sessionStorage.removeItem(CHAVE_SETUP),
};

export const clinicaStorage = {
  obter: (): string | null => localStorage.getItem(CHAVE_CLINICA),
  salvar: (id: string): void => localStorage.setItem(CHAVE_CLINICA, id),
};

export default tokenStorage;
