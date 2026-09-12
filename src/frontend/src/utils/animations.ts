import type { Transition, Variants } from "framer-motion";

/**
 * Variants compartilhados do framer-motion.
 *
 * Antes cada página redefinia `containerVariants`/`itemVariants` com números
 * mágicos ligeiramente diferentes e sem tipagem — o que, além da duplicação,
 * fazia `type: "spring"` alargar para `string` e quebrar o typecheck.
 */

/** Mola padrão da interface. Curta o suficiente para não atrasar o toque no mobile. */
export const MOLA_PADRAO: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 24,
};

/** Mola mais suave, para telas de entrada (login/cadastro). */
export const MOLA_SUAVE: Transition = {
  type: "spring",
  stiffness: 150,
  damping: 20,
};

/**
 * Container que revela os filhos em cascata.
 * @param atraso Intervalo em segundos entre a entrada de cada filho.
 */
export const criarContainerVariants = (atraso = 0.1): Variants => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: atraso } },
});

/**
 * Item que sobe ao entrar. Usado dentro de um container em cascata.
 * @param deslocamento Distância vertical inicial em pixels.
 */
export const criarItemVariants = (
  deslocamento = 20,
  transition: Transition = MOLA_PADRAO,
): Variants => ({
  hidden: { opacity: 0, y: deslocamento },
  visible: { opacity: 1, y: 0, transition },
});

export const containerVariants = criarContainerVariants();
export const itemVariants = criarItemVariants();

/** Entrada/saída de menus suspensos e popovers. */
export const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: MOLA_PADRAO },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};
