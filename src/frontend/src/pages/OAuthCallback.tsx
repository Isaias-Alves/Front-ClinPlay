import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";

export function OAuthCallback() {
  const navigate = useNavigate();
  const { notificar } = useApp();

  // Ref para blindagem total: Garante que a lógica rode 1 única vez
  const processoExecutado = useRef(false);

  useEffect(() => {
    if (processoExecutado.current) return;
    processoExecutado.current = true;

    // Varre a URL para encontrar o token em qualquer formato possível
    const match = window.location.href.match(/[?&#]access_token=([^&]+)/);
    const token = match ? match[1] : null;

    if (token) {
      localStorage.setItem("token", token);
      navigate("/inicio", { replace: true });
    } else {
      notificar(
        "Falha no login: O servidor não enviou o Token de Acesso.",
        "erro",
      );
      navigate("/", { replace: true });
    }
  }, [navigate, notificar]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium animate-pulse tracking-wide uppercase text-sm">
          A autenticar a sua sessão...
        </p>
      </div>
    </div>
  );
}
