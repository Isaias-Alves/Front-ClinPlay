/* global firebase */

/**
 * Service worker único da aplicação.
 *
 * Acumula duas responsabilidades de propósito: só um service worker pode
 * controlar um escopo, e antes existia apenas o `firebase-messaging-sw.js`,
 * que tratava push e nada mais. Registrar um segundo para cache faria os
 * dois disputarem o escopo `/` e um substituiria o outro — o app perderia
 * notificação ou offline, dependendo da ordem.
 *
 * O `getToken` do Firebase recebe o registro deste arquivo explicitamente
 * (ver `src/firebase.ts`), em vez de procurar o caminho padrão.
 */

// ==========================================
// CACHE
// ==========================================

/** Trocar a versão invalida todo o cache antigo no próximo activate. */
const VERSAO = "clinplay-v1";
const CACHE_APP = `${VERSAO}-app`;

/** Casca mínima para a aplicação abrir sem rede. */
const CASCA = ["/", "/index.html", "/icon-192.png", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_APP)
      // `addAll` falha inteiro se um item falhar; aqui um ícone ausente não
      // pode impedir a instalação do worker.
      .then((cache) => Promise.allSettled(CASCA.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves
            .filter((chave) => !chave.startsWith(VERSAO))
            .map((chave) => caches.delete(chave)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/**
 * Nunca guardar resposta da API.
 *
 * São dados clínicos de paciente. O cache do service worker fica no disco
 * do aparelho, sobrevive ao logout e é legível por qualquer código que rode
 * na origem — guardar prescrição ou feedback ali seria expor prontuário.
 * Só entra no cache o que é estático e público.
 */
const ehMesmaOrigem = (url) => new URL(url).origin === self.location.origin;

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || !ehMesmaOrigem(request.url)) return;

  const url = new URL(request.url);

  // Navegação: rede primeiro, para o usuário sempre pegar a versão nova.
  // Sem rede, devolve o index.html guardado — como é uma SPA, o roteador
  // assume dali e o app abre offline em vez de dar tela de dinossauro.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(CACHE_APP).then((cache) => cache.put("/index.html", copia));
          return resposta;
        })
        .catch(() =>
          caches
            .match("/index.html")
            .then((cacheada) => cacheada ?? Response.error()),
        ),
    );
    return;
  }

  // Build da Vite: os arquivos de /assets têm hash no nome, então o conteúdo
  // nunca muda para uma mesma URL. Cache primeiro é seguro e elimina a
  // requisição de rede em toda abertura.
  const ehAssetImutavel =
    url.pathname.startsWith("/assets/") ||
    /\.(png|svg|webp|jpg|jpeg|woff2?)$/.test(url.pathname);

  if (ehAssetImutavel) {
    event.respondWith(
      caches.match(request).then(
        (cacheada) =>
          cacheada ??
          fetch(request).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone();
              caches.open(CACHE_APP).then((cache) => cache.put(request, copia));
            }
            return resposta;
          }),
      ),
    );
  }
});

// ==========================================
// NOTIFICAÇÕES (FCM)
// ==========================================

// A versão do SDK compat precisa acompanhar a do pacote `firebase` usado na
// aplicação; divergências fazem o token gerado no cliente não ser
// reconhecido por este worker.
importScripts(
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js",
);

// Configuração pública do Firebase (as mesmas chaves de `src/firebase.ts`).
// Um service worker não lê `import.meta.env`, por isso os valores ficam
// literais — são públicos por design, o controle de acesso está nas regras
// do projeto Firebase.
firebase.initializeApp({
  apiKey: "AIzaSyBMerPvSO4y-eFqTOb0EUudpFq8IbaspEA",
  authDomain: "clin-play.firebaseapp.com",
  projectId: "clin-play",
  storageBucket: "clin-play.firebasestorage.app",
  messagingSenderId: "847839179359",
  appId: "1:847839179359:web:037b3fad38567ddbc5a1ea",
});

firebase.messaging().onBackgroundMessage((payload) => {
  // Mensagens "data-only" chegam sem `notification`: ler direto de
  // `payload.notification.title` derrubava o worker nesses casos.
  const conteudo = payload.notification ?? payload.data ?? {};

  // Nada de `console.log(payload)` aqui: o corpo da notificação pode conter
  // dados clínicos do paciente, que ficariam registrados no console.
  self.registration.showNotification(conteudo.title || "ClinPlaY", {
    body: conteudo.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: conteudo.click_action || "/" },
  });
});

// Abre (ou foca) a aplicação ao tocar na notificação.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const destino = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((janelas) => {
        const aberta = janelas.find((janela) => janela.url.includes(destino));
        if (aberta) return aberta.focus();
        return self.clients.openWindow(destino);
      }),
  );
});
