import { useSyncExternalStore } from "react";
import {
  assinarTema,
  definirContraste,
  definirTema,
  lerTema,
} from "@utils";

/**
 * Lê e alterna as preferências de exibição.
 *
 * Usa `useSyncExternalStore` porque a fonte da verdade é o `<html>`, não o
 * React: o tema já foi aplicado antes do app montar. Copiar isso para um
 * `useState` dentro de um efeito criaria uma segunda fonte da verdade e um
 * repintar visível na abertura.
 */
export const useTema = () => {
  const { tema, contraste } = useSyncExternalStore(
    assinarTema,
    lerTema,
    lerTema,
  );

  return {
    tema,
    contraste,
    escuroAtivo: tema === "escuro",
    contrasteAtivo: contraste === "alto",
    alternarTema: () => definirTema(tema === "escuro" ? "claro" : "escuro"),
    alternarContraste: () =>
      definirContraste(contraste === "alto" ? "normal" : "alto"),
  };
};

export default useTema;
