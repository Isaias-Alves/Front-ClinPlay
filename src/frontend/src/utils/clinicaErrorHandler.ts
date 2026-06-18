export const tratarErroClinica = (error: any): string => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (typeof data === "string" && data.trim() !== "") {
      return data;
    }

    switch (status) {
      case 400:
        return "Erro nos dados enviados. Verifique se o nome tem pelo menos 5 caracteres e tente novamente.";
      case 401:
        return "Sua sessão expirou. Faça login novamente.";
      case 403:
        return "Você não tem permissão para realizar esta ação.";
      case 404:
        return "Clínica não encontrada no sistema.";
      case 409:
        return "Já existe uma clínica cadastrada com este código.";
      default:
        return "Ocorreu um erro inesperado no servidor. Tente novamente mais tarde.";
    }
  }

  return "Não foi possível conectar ao servidor. Verifique sua conexão.";
};
