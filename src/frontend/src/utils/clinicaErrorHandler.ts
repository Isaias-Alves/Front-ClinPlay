import { ehFalhaDeRede, mensagemDeErro, statusDoErro } from "./apiError";

/** Mensagens por status para as operações sobre clínicas. */
const POR_STATUS: Record<number, string> = {
  400:
    "Erro nos dados enviados. Verifique se o nome tem pelo menos 5 caracteres" +
    " e tente novamente.",
  401: "A sua sessão expirou. Faça login novamente.",
  403: "Você não tem permissão para realizar esta ação.",
  404: "Clínica não encontrada no sistema.",
  409: "Já existe uma clínica cadastrada com este código.",
};

/**
 * Traduz uma falha de requisição sobre clínicas numa mensagem para o usuário.
 *
 * A mensagem do servidor tem prioridade; os textos por status só entram
 * quando ele não explica o que houve. Esta era a segunda cópia da função —
 * `ClinicaPage` mantinha uma versão local, quase igual, com textos
 * ligeiramente diferentes para os mesmos erros.
 */
export const tratarErroClinica = (erro: unknown): string => {
  if (ehFalhaDeRede(erro)) {
    return "Não foi possível conectar ao servidor. Verifique a sua conexão.";
  }

  const status = statusDoErro(erro);
  const padrao =
    (status && POR_STATUS[status]) ||
    "Ocorreu um erro inesperado no servidor. Tente novamente mais tarde.";

  return mensagemDeErro(erro, padrao);
};
