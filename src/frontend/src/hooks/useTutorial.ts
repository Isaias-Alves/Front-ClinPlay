import { useCallback, useState } from "react";

/**
 * Guarda, por usuário e por aparelho, se um tutorial já foi visto.
 * Fica fora do `tokenStorage.limpar()` de propósito: sair e entrar de novo
 * não deve repetir o tutorial.
 */
const chaveDe = (tutorialId: string, usuarioId: string) =>
  `tutorial:${tutorialId}:${usuarioId}`;

const jaViu = (chave: string): boolean => {
  try {
    return localStorage.getItem(chave) === "1";
  } catch {
    // Navegação privada pode bloquear o storage; melhor mostrar de novo do que quebrar a tela.
    return false;
  }
};

/**
 * Abre o tutorial sozinho na primeira visita e permite revê-lo depois.
 * `usuarioId` vem do contexto; as telas que usam isto só renderizam com o
 * usuário já carregado (ver `RouteGuard`).
 */
const useTutorial = (tutorialId: string, usuarioId: string | undefined) => {
  const chave = chaveDe(tutorialId, usuarioId ?? "anonimo");
  const [aberto, setAberto] = useState(() => !jaViu(chave));

  const abrir = useCallback(() => setAberto(true), []);

  /** Concluir e pular contam igual: os dois marcam como visto. */
  const fechar = useCallback(() => {
    try {
      localStorage.setItem(chave, "1");
    } catch {
      // Sem storage o tutorial volta na próxima visita; nada a fazer aqui.
    }
    setAberto(false);
  }, [chave]);

  return { aberto, abrir, fechar };
};

export default useTutorial;
