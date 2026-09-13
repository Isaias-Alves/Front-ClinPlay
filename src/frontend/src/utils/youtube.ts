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
