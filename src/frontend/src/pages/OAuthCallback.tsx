import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@contexts";
import { tokenStorage } from "@services";

/**
 * Extrai o access token do retorno do provedor e o apaga da URL.
 *
 * O token chega no fragmento (`#access_token=`) ou, em servidores mais
 * antigos, na query (`?access_token=`). Em ambos os casos ele fica na barra
 * de endereços, no histórico do navegador e — no caso da query — é enviado
 * no cabeçalho `Referer` de qualquer recurso externo carregado pela página.
 * Por isso a URL é higienizada com `history.replaceState` antes de qualquer
 * outra coisa, e não apenas substituída na navegação seguinte.
 */
const extrairTokenELimparUrl = (): string | null => {
  const { hash, search, pathname } = window.location;

  const doFragmento = new URLSearchParams(hash.replace(/^#/, ""));
  const daQuery = new URLSearchParams(search);
  const token =
    doFragmento.get("access_token") ?? daQuery.get("access_token") ?? null;

  if (hash || search) {
    window.history.replaceState(null, "", pathname);
  }

  return token?.trim() || null;
};

export function OAuthCallback() {
  const navigate = useNavigate();
  const { notificar } = useApp();

  // Ref para blindagem total: garante que a lógica rode 1 única vez
  // (o StrictMode monta o efeito duas vezes em desenvolvimento).
  const processoExecutado = useRef(false);

  useEffect(() => {
    if (processoExecutado.current) return;
    processoExecutado.current = true;

    const token = extrairTokenELimparUrl();

    if (token) {
      tokenStorage.salvar(token);
      navigate("/inicio", { replace: true });
      return;
    }

    notificar(
      "Falha no login: O servidor não enviou o Token de Acesso.",
      "erro",
    );
    navigate("/", { replace: true });
  }, [navigate, notificar]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="animate-pulse text-sm font-medium uppercase tracking-wide text-slate-600">
          A autenticar a sua sessão...
        </p>
      </div>
    </div>
  );
}

export default OAuthCallback;
