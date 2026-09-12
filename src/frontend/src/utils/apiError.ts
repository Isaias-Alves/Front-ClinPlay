import { AxiosError, isAxiosError } from "axios";

/**
 * Leitura segura de erros vindos da API.
 *
 * Num `catch`, o TypeScript entrega `unknown` — que é a verdade: pode ser um
 * `AxiosError`, um `TypeError` de rede ou qualquer coisa lançada por uma
 * biblioteca. O código antigo escrevia `catch (error: any)` e acessava
 * `error.response.data` direto, o que compila mesmo quando o campo não
 * existe e estoura em produção justamente no caminho de erro, onde ninguém
 * testa.
 */

/** Status HTTP do erro, quando houver resposta do servidor. */
export const statusDoErro = (erro: unknown): number | undefined =>
  isAxiosError(erro) ? erro.response?.status : undefined;

/**
 * Corpo devolvido pelo servidor. O backend responde ora com uma string
 * simples, ora com um objeto `{ message }` ou `{ erro }`.
 */
const corpoDoErro = (erro: unknown): unknown =>
  isAxiosError(erro) ? erro.response?.data : undefined;

/** Extrai a mensagem do corpo, se ele trouxer alguma em formato conhecido. */
const mensagemDoCorpo = (corpo: unknown): string | undefined => {
  if (typeof corpo === "string" && corpo.trim()) return corpo.trim();

  if (corpo && typeof corpo === "object") {
    const registro = corpo as Record<string, unknown>;
    for (const chave of ["message", "mensagem", "erro", "error", "detail"]) {
      const valor = registro[chave];
      if (typeof valor === "string" && valor.trim()) return valor.trim();
    }
  }

  return undefined;
};

/** `true` quando a requisição nem chegou ao servidor. */
export const ehFalhaDeRede = (erro: unknown): boolean =>
  isAxiosError(erro) && !erro.response;

/**
 * Mensagem pronta para exibir ao usuário.
 * @param erro    O valor capturado no `catch`.
 * @param padrao  Texto usado quando o servidor não explica a falha.
 */
export const mensagemDeErro = (erro: unknown, padrao: string): string => {
  if (ehFalhaDeRede(erro)) {
    return "Não foi possível conectar ao servidor. Verifique a sua conexão.";
  }

  return mensagemDoCorpo(corpoDoErro(erro)) ?? padrao;
};

/** Reexportado para quem precisa do erro completo do axios. */
export type { AxiosError };
export { isAxiosError };
