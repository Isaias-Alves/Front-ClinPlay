import { ReactNode, useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  authServices,
  clinicaStorage,
  clinicasServices,
  planoServices,
  tokenStorage,
} from "@services";
// Importados por caminho direto, e não pelo barrel `@components`: esses
// componentes importam `useApp` de volta, e o ciclo entre os dois barrels
// gerava avisos de ordem de execução no bundle final.
import LogotipoClinPlay from "../components/LogotipoClinPlay";
import { NotificacaoModal } from "../components/NotificacaoModal";
import { solicitarTokenFirebase } from "../firebase"; // Injeção do Firebase
import type { ClinicaVinculo } from "@interfaces";
import {
  AppContext,
  type PlanoResponse,
  type TipoUsuario,
  type UsuarioLogado,
} from "./useApp";

const ROTAS_PUBLICAS = [
  "/",
  "/cadastro",
  "/oauth/callback",
  "/oauth-callback",
  "/oauth/setup",
];

const ehRotaPublica = (pathname: string) => ROTAS_PUBLICAS.includes(pathname);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario | null>(null);
  const [clinicas, setClinicas] = useState<ClinicaVinculo[]>([]);
  const [clinicaSelecionadaId, setClinicaSelecionadaId] = useState<string>("");
  const [planos, setPlanos] = useState<PlanoResponse[]>([]);
  /*
   * Lido uma única vez, na montagem: sem token não há carga global a
   * esperar e a tela de login pode pintar de imediato. Antes o estado
   * nascia sempre `true` e era desligado por um `setIsLoadingGlobal(false)`
   * síncrono dentro do efeito — uma renderização inteira desperdiçada em
   * toda abertura do app deslogado.
   */
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(() =>
    Boolean(tokenStorage.obter()),
  );

  const [notificacao, setNotificacao] = useState<{
    isOpen: boolean;
    mensagem: string;
    tipo: "sucesso" | "erro";
  } | null>(null);

  const notificar = useCallback(
    (mensagem: string, tipo: "sucesso" | "erro") => {
      setNotificacao({ isOpen: true, mensagem, tipo });
    },
    [],
  );

  const fecharNotificacao = useCallback(() => {
    setNotificacao((prev) => (prev ? { ...prev, isOpen: false } : null));
  }, []);

  /**
   * `useCallback` porque esta função é exposta como `refreshData`: recriada a
   * cada renderização, qualquer tela que a colocasse numa lista de
   * dependências entrava em laço infinito de requisições.
   */
  const carregarDadosGlobais = useCallback(async () => {
    const token = tokenStorage.obter();

    // Sem token não há o que carregar. O redirecionamento para o login não
    // é feito aqui de propósito: o `RouteGuard` já devolve `<Navigate to="/">`
    // em toda rota privada, e duplicar isso disparava duas navegações.
    if (!token) return;

    // Sem `setIsLoadingGlobal(true)` aqui: o estado já nasce `true` e, quando
    // esta função é usada como `refreshData`, a atualização acontece em
    // segundo plano — tomar a tela inteira com o loader a cada refresh era
    // pior para o usuário do que a lista piscar.
    let dadosUsuario;
    let tipo: TipoUsuario | null = null;
    let planosCarregados: PlanoResponse[] = [];
    let clinicasCarregadas: ClinicaVinculo[] = [];

    // PASSO 1: IDENTIDADE (ESTRITAMENTE BLINDADO)
    try {
      dadosUsuario = await authServices.getPacienteInfo();
      tipo = "paciente";
    } catch {
      try {
        dadosUsuario = await authServices.getProfissionalInfo();
        tipo = "profissional";
      } catch {
        setIsLoadingGlobal(false);
        notificar(
          "Perfil não encontrado. Por favor, conclua o seu cadastro.",
          "erro",
        );
        tokenStorage.limpar();
        navigate("/cadastro");
        return;
      }
    }

    // PASSO 2: DADOS SECUNDÁRIOS
    try {
      if (tipo === "paciente") {
        clinicasCarregadas = await clinicasServices.buscarMinhasClinicas();
      } else if (tipo === "profissional") {
        planosCarregados = await planoServices.listar();
        clinicasCarregadas = await clinicasServices.buscarMinhasClinicas();
      }
    } catch {
      // Falhas secundárias não quebram o login
    }

    // PASSO 3: PERSISTÊNCIA NA MEMÓRIA E SELEÇÃO INTELIGENTE
    setUsuario(dadosUsuario);
    setTipoUsuario(tipo);
    setPlanos(planosCarregados);
    setClinicas(clinicasCarregadas);

    if (clinicasCarregadas.length > 0) {
      const salvaAnteriormente = clinicaStorage.obter();

      // Validação suportando tanto a chave id quanto clinicaId (padrão do backend atual)
      const existeAinda = clinicasCarregadas.some(
        (c) => (c.clinicaId || c.id) === salvaAnteriormente,
      );

      if (salvaAnteriormente && existeAinda) {
        setClinicaSelecionadaId(salvaAnteriormente);
      } else {
        const idParaSalvar =
          clinicasCarregadas[0].clinicaId || clinicasCarregadas[0].id;
        setClinicaSelecionadaId(idParaSalvar);
        clinicaStorage.salvar(idParaSalvar);
      }
    }

    setIsLoadingGlobal(false);

    // PASSO 4: REGISTRO DO DISPOSITIVO PARA NOTIFICAÇÕES (FCM)
    //
    // Deliberadamente fora do caminho bloqueante: `solicitarTokenFirebase`
    // chama `Notification.requestPermission()`, que só resolve depois de o
    // usuário responder ao diálogo do navegador. Enquanto era aguardado
    // antes do `setIsLoadingGlobal(false)`, a aplicação ficava presa na tela
    // de carregamento atrás do prompt de permissão.
    solicitarTokenFirebase()
      .then((fcmToken) => fcmToken && authServices.salvarFcmToken(fcmToken))
      .catch((err) =>
        console.warn("Não foi possível registrar o token FCM:", err),
      );
  }, [navigate, notificar]);

  useEffect(() => {
    if (!usuario && !ehRotaPublica(location.pathname)) {
      /*
       * Única supressão desta regra no projeto. Em todos os outros pontos a
       * carga foi movida para dentro do próprio efeito, o que permite ao
       * React Compiler provar que as atualizações de estado só ocorrem
       * depois do `await`. Aqui isso não é possível: `carregarDadosGlobais`
       * também é exposta como `refreshData`, e quatro telas fazem
       * `await refreshData()` contando que os dados estejam frescos quando
       * a promise resolver. Trocá-la por um gatilho (contador + efeito)
       * quebraria esse contrato, e duplicar o corpo da carga seria pior.
       */
      // eslint-disable-next-line react-hooks/set-state-in-effect
      carregarDadosGlobais();
    }
  }, [usuario, location.pathname, carregarDadosGlobais]);

  /*
   * Em rota pública (login, cadastro, retorno do OAuth) não há carga global
   * a esperar. Isso é derivado em vez de escrito por efeito: antes o
   * `setIsLoadingGlobal(false)` rodava de forma síncrona dentro do efeito,
   * o que obrigava uma renderização a mais logo na abertura do app.
   */
  const carregandoGlobal = isLoadingGlobal && !ehRotaPublica(location.pathname);

  const handleSetClinicaSelecionadaId = useCallback((id: string) => {
    setClinicaSelecionadaId(id);
    clinicaStorage.salvar(id);
  }, []);

  /**
   * Encerra a sessão no backend, limpa o estado local e volta ao login.
   * Centralizado aqui porque cada página fazia o seu próprio
   * `localStorage.removeItem("token")`, deixando contexto e storage
   * dessincronizados até o próximo reload.
   */
  const logout = useCallback(async () => {
    try {
      await authServices.logout();
    } catch {
      tokenStorage.limpar();
    } finally {
      setUsuario(null);
      setTipoUsuario(null);
      setClinicas([]);
      setClinicaSelecionadaId("");
      navigate("/", { replace: true });
    }
  }, [navigate]);

  if (carregandoGlobal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 relative overflow-hidden">
        <LogotipoClinPlay mt="mt-0" mb="mb-0" />
        <div className="flex flex-col items-center gap-3 mt-6">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-semibold text-sm animate-pulse tracking-wide uppercase">
            A preparar o seu ambiente...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        usuario,
        tipoUsuario,
        clinicas,
        clinicaSelecionadaId,
        setClinicaSelecionadaId: handleSetClinicaSelecionadaId,
        planos,
        isLoadingGlobal: carregandoGlobal,
        refreshData: carregarDadosGlobais,
        notificar,
        logout,
      }}
    >
      {notificacao && (
        <NotificacaoModal
          isOpen={notificacao.isOpen}
          onClose={fecharNotificacao}
          mensagem={notificacao.mensagem}
          tipo={notificacao.tipo}
        />
      )}
      {children}
    </AppContext.Provider>
  );
};
