import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_BASE_URL = "https://clinplay-api.onrender.com/ws";

interface Handlers {
  onEvento: (evento: any) => void;
  onErro: (erro: any) => void;
}

export function useTratamentoSocket(tratamentoId: string, handlers: Handlers) {
  const clientRef = useRef<Client | null>(null);

  const enviar = useCallback(
    (mensagem: any) => {
      const client = clientRef.current;
      if (!client?.connected) {
        return;
      }
      client.publish({
        destination: `/app/tratamento/${tratamentoId}`,
        body: JSON.stringify(mensagem),
      });
    },
    [tratamentoId],
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}?token=${token}`),
      reconnectDelay: 5000,

      onConnect: () => {
        client.subscribe(`/topic/tratamento/${tratamentoId}`, (message) =>
          handlers.onEvento(JSON.parse(message.body)),
        );

        client.subscribe(`/user/queue/erros`, (message) =>
          handlers.onErro(JSON.parse(message.body)),
        );

        client.publish({
          destination: `/app/tratamento/${tratamentoId}`,
          body: JSON.stringify({ tipo: "OBTER" }),
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [tratamentoId]);

  return { enviar };
}

export default useTratamentoSocket;
