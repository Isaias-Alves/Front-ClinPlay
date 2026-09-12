import { useEffect, useRef, useState } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { BASE_URL, tokenStorage } from "@services";

/** Endpoint SockJS. Derivado da API para não travar o app em localhost. */
export const WS_URL = import.meta.env.VITE_WS_URL || `${BASE_URL}/ws`;

export interface StompPublicacao {
  destination: string;
  body: unknown;
}

export interface UseStompClientOpts {
  /** Quando false, o cliente não conecta (ex.: dados ainda não carregados). */
  habilitado?: boolean;
  /** Chamado após o CONNECT; use para assinar tópicos e publicar o estado inicial. */
  aoConectar?: (ctx: {
    /**
     * Assina um destino. O tipo do evento é informado por quem assina —
     * cada tópico tem o seu próprio formato (ver `EventoTratamento` e
     * `EventoSolicitacoes` em `@interfaces`).
     */
    assinar: <T = unknown>(
      destino: string,
      handler: (evento: T) => void,
    ) => void;
    publicar: (pub: StompPublicacao) => void;
  }) => void;
  aoDesconectar?: () => void;
  aoErro?: (erro: { mensagem: string }) => void;
}

const parse = (message: IMessage) => {
  try {
    return JSON.parse(message.body);
  } catch {
    return { mensagem: message.body };
  }
};

/**
 * Cliente STOMP/SockJS autenticado, compartilhado por todas as telas em
 * tempo real (sala de tratamento, painéis inicial do paciente e do
 * profissional). Antes cada tela instanciava o seu próprio `Client`,
 * repetindo a URL fixa de localhost e o token na query string.
 *
 * O token vai no header do CONNECT em vez da query string: URLs completas
 * vazam para logs de acesso e históricos de proxy.
 */
export function useStompClient({
  habilitado = true,
  aoConectar,
  aoDesconectar,
  aoErro,
}: UseStompClientOpts) {
  const clientRef = useRef<Client | null>(null);
  const [conectado, setConectado] = useState(false);

  // Callbacks em ref: o efeito só deve reconectar quando `habilitado` mudar,
  // e não a cada renderização do componente que os redefine. A escrita fica
  // num efeito (sem lista de dependências) porque mutar uma ref durante a
  // renderização quebra a pureza esperada pelo React.
  const handlersRef = useRef({ aoConectar, aoDesconectar, aoErro });

  useEffect(() => {
    handlersRef.current = { aoConectar, aoDesconectar, aoErro };
  });

  useEffect(() => {
    const token = tokenStorage.obter();
    if (!habilitado || !token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,

      onConnect: () => {
        setConectado(true);
        handlersRef.current.aoConectar?.({
          assinar: (destino, handler) =>
            void client.subscribe(destino, (m) => handler(parse(m))),
          publicar: ({ destination, body }) =>
            client.publish({ destination, body: JSON.stringify(body) }),
        });
      },

      onDisconnect: () => {
        setConectado(false);
        handlersRef.current.aoDesconectar?.();
      },

      onStompError: (frame) =>
        handlersRef.current.aoErro?.({
          mensagem: frame.headers["message"] || "Erro na sessão em tempo real.",
        }),

      onWebSocketError: () => {
        setConectado(false);
        handlersRef.current.aoErro?.({
          mensagem: "Conexão em tempo real perdida. A tentar reconectar...",
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      clientRef.current = null;
      setConectado(false);
      void client.deactivate();
    };
  }, [habilitado]);

  /** Publica uma mensagem; no-op se o cliente ainda não estiver conectado. */
  const publicar = ({ destination, body }: StompPublicacao) => {
    const client = clientRef.current;
    if (!client?.connected) return;
    client.publish({ destination, body: JSON.stringify(body) });
  };

  return { conectado, publicar };
}

export default useStompClient;
