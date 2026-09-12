/**
 * Formatadores de exibição de documentos e contatos.
 *
 * Estavam duplicados em `StartPageProfissional` e `SeletorPaciente`, com o
 * mesmo corpo. Aceitam `undefined`/`null` porque os campos são opcionais nos
 * DTOs de vínculo — o backend nem sempre devolve CPF e telefone.
 */

/** CPF no formato 000.000.000-00. Devolve "---" quando não houver valor. */
export const formatarCPF = (valor?: string | null): string => {
  const digitos = (valor || "").replace(/\D/g, "");
  if (digitos.length !== 11) return valor || "---";
  return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

/** Telefone com DDD, aceitando 10 ou 11 dígitos. */
export const formatarTelefone = (valor?: string | null): string => {
  const digitos = (valor || "").replace(/\D/g, "");
  if (digitos.length === 11)
    return digitos.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
  if (digitos.length === 10)
    return digitos.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return valor || "---";
};
