/**
 * Extrai o id do vídeo das formas de URL que o profissional costuma colar.
 * Devolve `null` quando não reconhece — aí não há o que exibir.
 */
export const extrairIdYoutube = (url?: string | null): string | null => {
  if (!url) return null;

  const padroes = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];

  for (const padrao of padroes) {
    const achado = url.match(padrao);
    if (achado) return achado[1];
  }

  return null;
};

/**
 * Valida o campo de vídeo no formato que o `react-hook-form` espera.
 *
 * A regra é a mesma de `extrairIdYoutube`: se o link não rende um id, o
 * player não tem o que mostrar. A tela de criação já validava o link com uma
 * expressão própria, mas a de edição aceitava qualquer texto — dava para
 * salvar um endereço quebrado e só o paciente descobria, na hora do
 * exercício, que o vídeo não abre.
 *
 * Campo vazio é válido: o vídeo é opcional.
 */
export const validarUrlYoutube = (url?: string | null): true | string => {
  if (!url || !url.trim()) return true;
  return (
    extrairIdYoutube(url.trim()) !== null ||
    "Insira um link válido do YouTube"
  );
};
