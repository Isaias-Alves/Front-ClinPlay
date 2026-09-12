import { useCallback, useEffect, useRef } from "react";
import type { ErroSocket, EventoTratamento } from "@interfaces";
import useStompClient from "./useStompClient";

interface Handlers {
  onEvento: (evento: EventoTratamento) => void;
  onErro: (erro: ErroSocket) => void;
}

/**
 * Assina a sala de um tratamento específico.
 * Camada fina sobre `useStompClient`, que cuida de conexão, autenticação
 * e reconexão.
 */
export function useTratamentoSocket(tratamentoId: string, handlers: Handlers) {
  const destino = `/app/tratamento/${tratamentoId}`;

  // As subscriptions são criadas uma única vez por conexão, então precisam
  // ler os callbacks de uma ref — senão ficam presas ao closure daquele render.
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  const { publicar } = useStompClient({
    habilitado: Boolean(tratamentoId),
    aoConectar: ({ assinar, publicar }) => {
      assinar<EventoTratamento>(`/topic/tratamento/${tratamentoId}`, (evento) =>
        handlersRef.current.onEvento(evento),
      );
      assinar<ErroSocket>("/user/queue/erros", (erro) =>
        handlersRef.current.onErro(erro),
      );
      publicar({ destination: destino, body: { tipo: "OBTER" } });
    },
    aoErro: (erro) => handlersRef.current.onErro(erro),
  });

  const enviar = useCallback(
    (mensagem: unknown) => publicar({ destination: destino, body: mensagem }),
    // `publicar` é estável entre renders (lê o cliente de uma ref).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [destino],
  );

  return { enviar };
}

export default useTratamentoSocket;
