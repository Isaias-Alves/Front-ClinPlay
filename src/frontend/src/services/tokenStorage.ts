const CHAVE_TOKEN = "token";
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
    localStorage.removeItem(CHAVE_CLINICA);
  },
};

export const clinicaStorage = {
  obter: (): string | null => localStorage.getItem(CHAVE_CLINICA),
  salvar: (id: string): void => localStorage.setItem(CHAVE_CLINICA, id),
};

export default tokenStorage;
