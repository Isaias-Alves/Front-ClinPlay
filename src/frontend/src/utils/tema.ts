/**
 * Preferências de exibição (tema escuro e alto contraste).
 *
 * O tema não vive em `useState`: ele precisa ser aplicado antes da primeira
 * pintura (senão a tela pisca branca ao abrir o app) e precisa sobreviver ao
 * recarregamento. Por isso o estado real fica no `<html>` — em
 * `data-tema` / `data-contraste` — e o `localStorage` guarda a escolha.
 *
 * O CSS em `index.css` lê esses atributos. Nenhum componente precisa saber
 * qual tema está ativo para se pintar corretamente.
 */

export type Tema = "claro" | "escuro";
export type Contraste = "normal" | "alto";

const CHAVE_TEMA = "clinplay:tema";
const CHAVE_CONTRASTE = "clinplay:contraste";

/** Cor da barra de status do sistema quando o app roda instalado (PWA). */
const COR_BARRA: Record<Tema, string> = {
  claro: "#10b981",
  escuro: "#060b16",
};

export interface PreferenciasTema {
  tema: Tema;
  contraste: Contraste;
}

const leitura = (chave: string): string | null => {
  try {
    return localStorage.getItem(chave);
  } catch {
    // Modo privado de alguns navegadores lança ao tocar no localStorage.
    return null;
  }
};

const escrita = (chave: string, valor: string) => {
  try {
    localStorage.setItem(chave, valor);
  } catch {
    // Sem persistência o app ainda funciona — só esquece a escolha.
  }
};

const prefereEscuro = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;

const prefereContraste = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-contrast: more)").matches === true;

/**
 * Preferência efetiva: o que o usuário escolheu; na ausência de escolha, o
 * que o sistema dele já pede. Quem usa o celular no modo escuro o dia
 * inteiro não deveria ter que configurar isso de novo aqui dentro.
 */
export const preferenciasAtuais = (): PreferenciasTema => ({
  tema: leitura(CHAVE_TEMA) === "escuro" ||
    (leitura(CHAVE_TEMA) === null && prefereEscuro())
    ? "escuro"
    : "claro",
  contraste:
    leitura(CHAVE_CONTRASTE) === "alto" ||
    (leitura(CHAVE_CONTRASTE) === null && prefereContraste())
      ? "alto"
      : "normal",
});

/** Escreve a preferência no `<html>` e na barra de status do sistema. */
export const aplicarPreferencias = ({ tema, contraste }: PreferenciasTema) => {
  const raiz = document.documentElement;
  raiz.dataset.tema = tema;
  raiz.dataset.contraste = contraste;

  // Faz o navegador pintar controles nativos (date picker, scrollbar,
  // autofill) na cor certa. Sem isso o seletor de data fica branco berrante
  // no meio de uma tela escura.
  raiz.style.colorScheme = tema === "escuro" ? "dark" : "light";

  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", COR_BARRA[tema]);
};

/* --------------------------------------------------------------------- */
/* Store mínima, para os componentes reagirem via `useSyncExternalStore`.  */
/* --------------------------------------------------------------------- */

let cache: PreferenciasTema = { tema: "claro", contraste: "normal" };
const inscritos = new Set<() => void>();

/** Lê o estado já aplicado ao `<html>` (inclusive pelo script do index.html). */
const sincronizarDoDom = () => {
  const raiz = document.documentElement;
  cache = {
    tema: raiz.dataset.tema === "escuro" ? "escuro" : "claro",
    contraste: raiz.dataset.contraste === "alto" ? "alto" : "normal",
  };
};

if (typeof document !== "undefined") sincronizarDoDom();

export const assinarTema = (aoMudar: () => void) => {
  inscritos.add(aoMudar);
  return () => inscritos.delete(aoMudar);
};

/**
 * Snapshot estável: `useSyncExternalStore` compara por identidade, então
 * devolver um objeto novo a cada chamada causaria loop de renderização.
 */
export const lerTema = (): PreferenciasTema => cache;

const definir = (proximo: PreferenciasTema) => {
  cache = proximo;
  aplicarPreferencias(proximo);
  inscritos.forEach((avisar) => avisar());
};

export const definirTema = (tema: Tema) => {
  escrita(CHAVE_TEMA, tema);
  definir({ ...cache, tema });
};

export const definirContraste = (contraste: Contraste) => {
  escrita(CHAVE_CONTRASTE, contraste);
  definir({ ...cache, contraste });
};
