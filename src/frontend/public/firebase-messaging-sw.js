/* global firebase */

// A versão do SDK compat aqui precisa acompanhar a do pacote `firebase`
// usado na aplicação; divergências fazem o token gerado no cliente não ser
// reconhecido por este worker.
importScripts(
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js",
);

// Configuração pública do Firebase (as mesmas chaves de `src/firebase.ts`).
// Um service worker não consegue ler `import.meta.env`, por isso os valores
// ficam literais — são públicos por design, o controle de acesso está nas
// regras do projeto Firebase.
firebase.initializeApp({
  apiKey: "AIzaSyBMerPvSO4y-eFqTOb0EUudpFq8IbaspEA",
  authDomain: "clin-play.firebaseapp.com",
  projectId: "clin-play",
  storageBucket: "clin-play.firebasestorage.app",
  messagingSenderId: "847839179359",
  appId: "1:847839179359:web:037b3fad38567ddbc5a1ea",
});

const messaging = firebase.messaging();

// Lida com notificações recebidas quando o site está fechado/em background.
messaging.onBackgroundMessage((payload) => {
  // Mensagens "data-only" chegam sem `notification`: ler direto de
  // `payload.notification.title` derrubava o worker nesses casos.
  const conteudo = payload.notification ?? payload.data ?? {};

  // Nada de `console.log(payload)` aqui: o corpo da notificação pode conter
  // dados clínicos do paciente, que ficariam registrados no console.
  self.registration.showNotification(conteudo.title || "ClinPlaY", {
    body: conteudo.body || "",
    icon: "/favicon.svg",
    badge: "/favicon.svg",
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
