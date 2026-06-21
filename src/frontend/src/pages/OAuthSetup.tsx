import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authServices } from "@services";
import { useApp } from "../contexts/AppContext";

export function OAuthSetup() {
  const navigate = useNavigate();
  const { notificar } = useApp();

  useEffect(() => {
    const prepararSetup = async () => {
      try {
        // O setup token chega na URL (o backend não usa mais cookie cross-site).
        // Guardamos para autenticar as chamadas de setup e de cadastro.
        const setupToken = new URLSearchParams(window.location.search).get(
          "setup_token",
        );
        if (setupToken) sessionStorage.setItem("setupToken", setupToken);

        const googleData = await authServices.getLoginSetup();
        notificar("Conta vinculada! Complete seu cadastro.", "sucesso");
        navigate("/cadastro", { replace: true, state: { googleData } });
      } catch (error: any) {
        notificar(
          "A sua sessão de Setup expirou ou é inválida. Tente novamente.",
          "erro",
        );
        navigate("/");
      }
    };

    prepararSetup();
  }, [navigate, notificar]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium animate-pulse tracking-wide uppercase text-sm">
          A preparar o seu registo...
        </p>
      </div>
    </div>
  );
}

export default OAuthSetup;
