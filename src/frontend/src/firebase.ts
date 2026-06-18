import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Configurações públicas extraídas do seu painel
const firebaseConfig = {
  apiKey: "AIzaSyBMerPvSO4y-eFqTOb0EUudpFq8IbaspEA",
  authDomain: "clin-play.firebaseapp.com",
  projectId: "clin-play",
  storageBucket: "clin-play.firebasestorage.app",
  messagingSenderId: "847839179359",
  appId: "1:847839179359:web:037b3fad38567ddbc5a1ea",
  measurementId: "G-Y5CJ08CJC7",
};

const app = initializeApp(firebaseConfig);

// Proteção para evitar quebras caso o navegador não suporte Web Push (ex: abas anônimas rigorosas ou Safari antigo)
export const messaging =
  typeof window !== "undefined" && "Notification" in window
    ? getMessaging(app)
    : null;

/**
 * Solicita permissão ao paciente/profissional e gera o Token FCM.
 */
export const solicitarTokenFirebase = async (): Promise<string | null> => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey:
          "BLQVMXCpCIy_jTLImAghq0PjbnpuxjOf8ocOhxNGrgv0s1OwDQltlnGYqwTjw9N7ybzH_3wPcBZGD0AOwoE18d0",
      });
      return token;
    } else {
      console.warn("Permissão para notificações negada pelo utilizador.");
      return null;
    }
  } catch (error) {
    console.error("Erro ao obter token do Firebase:", error);
    return null;
  }
};
