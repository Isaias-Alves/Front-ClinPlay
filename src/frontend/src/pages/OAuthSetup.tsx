import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { authServices, setupTokenStorage } from "@services";
import { useApp } from "@contexts";
import { mensagemDeErro } from "@utils";

/**
 * Captura o token de setup do OAuth e o apaga da URL.
 *
 * O backend devolve o token na query da URL de retorno (`?setup_token=`) —
 * e não num cookie, porque o frontend (Vercel) e a API (Render) ficam em
 * domínios diferentes, o que tornaria o cookie de terceiros. Aceita também o
 * fragmento, que é onde alguns provedores o colocam.
 *
 * A URL é higienizada com `history.replaceState` antes de qualquer outra
 * coisa: um bearer token na barra de endereços vaza para o histórico e, no
 * caso da query, para o cabeçalho `Referer` de qualquer recurso externo.
 */
const capturarTokenELimparUrl = (): string | null => {
  const { hash, search, pathname } = window.location;

  const daQuery = new URLSearchParams(search);
  const doFragmento = new URLSearchParams(hash.replace(/^#/, ""));
  const token =
    daQuery.get("setup_token") ?? doFragmento.get("setup_token") ?? null;

  if (hash || search) {
    window.history.replaceState(null, "", pathname);
  }

  return token?.trim() || null;
};

export function OAuthSetup() {
  const navigate = useNavigate();
  const { notificar } = useApp();

  // O token de setup é de uso único: sem esta trava, a montagem dupla do
  // StrictMode em desenvolvimento consome-o na primeira chamada e recebe 400
  // na segunda.
  const processoExecutado = useRef(false);

  useEffect(() => {
    if (processoExecutado.current) return;
    processoExecutado.current = true;

    const prepararSetup = async () => {
      // Guardado antes da requisição: é ele que autentica `GET /auth/setup`
      // e, logo depois, o `POST /paciente` ou `/profissional`.
      const token = capturarTokenELimparUrl();
      if (token) setupTokenStorage.salvar(token);

      try {
        const googleData = await authServices.getLoginSetup();
        notificar("Conta vinculada! Complete seu cadastro.", "sucesso");
        navigate("/cadastro", { replace: true, state: { googleData } });
      } catch (erro) {
        // A mensagem do servidor é repassada: o texto genérico anterior
        // escondia a causa real (token ausente, expirado ou já usado).
        notificar(
          mensagemDeErro(
            erro,
            "A sua sessão de Setup expirou ou é inválida. Tente novamente.",
          ),
          "erro",
        );
        setupTokenStorage.limpar();
        navigate("/", { replace: true });
      }
    };

    void prepararSetup();
  }, [navigate, notificar]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="animate-pulse text-sm font-medium uppercase tracking-wide text-slate-600">
          A preparar o seu registo...
        </p>
      </div>
    </div>
  );
}

export default OAuthSetup;
