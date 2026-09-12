/**
 * Configuração pública do Firebase (Web Push / FCM).
 * Estas chaves são públicas por design: o controle de acesso fica nas regras
 * do projeto Firebase, não no segredo do `apiKey`.
 */
const firebaseConfig = {
  apiKey: "AIzaSyBMerPvSO4y-eFqTOb0EUudpFq8IbaspEA",
  authDomain: "clin-play.firebaseapp.com",
  projectId: "clin-play",
  storageBucket: "clin-play.firebasestorage.app",
  messagingSenderId: "847839179359",
  appId: "1:847839179359:web:037b3fad38567ddbc5a1ea",
  measurementId: "G-Y5CJ08CJC7",
};

const VAPID_KEY =
  "BLQVMXCpCIy_jTLImAghq0PjbnpuxjOf8ocOhxNGrgv0s1OwDQltlnGYqwTjw9N7ybzH_3wPcBZGD0AOwoE18d0";

/** O SDK do Firebase pesa ~250 kB; só entra no bundle quando o push é usado. */
const carregarMessaging = async () => {
  const [{ initializeApp }, messagingSdk] = await Promise.all([
    import("firebase/app"),
    import("firebase/messaging"),
  ]);

  const suportado = await messagingSdk.isSupported();
  if (!suportado) return null;

  return { sdk: messagingSdk, app: initializeApp(firebaseConfig) };
};

/**
 * Solicita permissão ao paciente/profissional e gera o Token FCM.
 * Devolve `null` sempre que o push não estiver disponível ou for recusado —
 * nunca lança, para não derrubar o carregamento da aplicação.
 */
export const solicitarTokenFirebase = async (): Promise<string | null> => {
  if (typeof window === "undefined" || !("Notification" in window)) return null;

  try {
    // Pedir a permissão antes de carregar o SDK evita baixar ~250 kB
    // para um usuário que vai recusar a notificação.
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const contexto = await carregarMessaging();
    if (!contexto) return null;

    const messaging = contexto.sdk.getMessaging(contexto.app);
    return await contexto.sdk.getToken(messaging, { vapidKey: VAPID_KEY });
  } catch (error) {
    console.error("Erro ao obter token do Firebase:", error);
    return null;
  }
};
