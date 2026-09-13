/**
 * Registro do service worker.
 *
 * É ele que torna o app instalável na tela inicial — o Chrome só oferece a
 * instalação quando existe um manifest válido E um service worker com
 * handler de `fetch`. Também é o que faz a aplicação abrir sem rede, algo
 * que importa num app usado em casa pelo paciente e em clínica com wi-fi
 * instável.
 *
 * O registro é adiado para depois do `load` de propósito: durante a carga
 * inicial, baixar e instalar o worker disputa banda com os próprios
 * arquivos da aplicação e atrasa a primeira pintura no celular.
 */

/** Caminho único do worker. Ver `public/sw.js`. */
export const CAMINHO_SW = "/sw.js";

/**
 * Promise do registro, para quem precisar dele — o Firebase Messaging o
 * recebe explicitamente em vez de procurar `/firebase-messaging-sw.js`.
 */
let registroEmAndamento: Promise<ServiceWorkerRegistration | null> | null =
  null;

const suportado = () =>
  typeof navigator !== "undefined" && "serviceWorker" in navigator;

export const registrarServiceWorker =
  (): Promise<ServiceWorkerRegistration | null> => {
    if (!suportado()) return Promise.resolve(null);

    registroEmAndamento ??= navigator.serviceWorker
      .register(CAMINHO_SW, { scope: "/" })
      .catch((erro) => {
        // Falhar aqui não pode derrubar o app: sem worker ele continua
        // funcionando, apenas sem offline e sem poder ser instalado.
        console.warn("Service worker não registrado:", erro);
        return null;
      });

    return registroEmAndamento;
  };

/** Dispara o registro quando a página terminar de carregar. */
export const agendarRegistroServiceWorker = (): void => {
  if (!suportado()) return;

  if (document.readyState === "complete") {
    void registrarServiceWorker();
    return;
  }

  window.addEventListener("load", () => void registrarServiceWorker(), {
    once: true,
  });
};
