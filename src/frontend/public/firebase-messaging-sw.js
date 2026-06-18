importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js",
);

const firebaseConfig = {
  apiKey: "AIzaSyBMerPvSO4y-eFqTOb0EUudpFq8IbaspEA",
  authDomain: "clin-play.firebaseapp.com",
  projectId: "clin-play",
  storageBucket: "clin-play.firebasestorage.app",
  messagingSenderId: "847839179359",
  appId: "1:847839179359:web:037b3fad38567ddbc5a1ea",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Lida com notificações recebidas quando o site está fechado/em background
messaging.onBackgroundMessage((payload) => {
  console.log("Notificação recebida em background: ", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/vite.svg", // Pode trocar pelo caminho da logo do ClinPlaY se tiver na pasta public
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
