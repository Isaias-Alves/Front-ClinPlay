import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authServices, clinicasServices, planoServices } from "@services";
import { LogotipoClinPlay, NotificacaoModal } from "@components";
import { solicitarTokenFirebase } from "../firebase"; // Injeção do Firebase

interface PlanoResponse {
  id: string;
  nome: string;
  maxProfissionais: number;
  maxPacientes: number;
  maxExercicios: number;
  disponivel: boolean;
}

interface AppContextData {
  usuario: any;
  tipoUsuario: "paciente" | "profissional" | null;
  clinicas: any[];
  clinicaSelecionadaId: string;
  setClinicaSelecionadaId: (id: string) => void;
  planos: PlanoResponse[];
  isLoadingGlobal: boolean;
  refreshData: () => Promise<void>;
  notificar: (mensagem: string, tipo: "sucesso" | "erro") => void;
}

export const AppContext = createContext<AppContextData>({} as AppContextData);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [usuario, setUsuario] = useState<any>(null);
  const [tipoUsuario, setTipoUsuario] = useState<
    "paciente" | "profissional" | null
  >(null);
  const [clinicas, setClinicas] = useState<any[]>([]);
  const [clinicaSelecionadaId, setClinicaSelecionadaId] = useState<string>("");
  const [planos, setPlanos] = useState<PlanoResponse[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(true);

  const [notificacao, setNotificacao] = useState<{
    isOpen: boolean;
    mensagem: string;
    tipo: "sucesso" | "erro";
  } | null>(null);

  const rotasPublicas = [
    "/",
    "/cadastro",
    "/oauth/callback",
    "/oauth-callback",
    "/oauth/setup",
  ];

  const notificar = useCallback(
    (mensagem: string, tipo: "sucesso" | "erro") => {
      setNotificacao({ isOpen: true, mensagem, tipo });
    },
    [],
  );

  const fecharNotificacao = useCallback(() => {
    setNotificacao((prev) => (prev ? { ...prev, isOpen: false } : null));
  }, []);

  const carregarDadosGlobais = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsLoadingGlobal(false);
      if (!rotasPublicas.includes(location.pathname)) navigate("/");
      return;
    }

    setIsLoadingGlobal(true);

    let dadosUsuario;
    let tipo: "paciente" | "profissional" | null = null;
    let planosCarregados: PlanoResponse[] = [];
    let clinicasCarregadas: any[] = [];

    // PASSO 1: IDENTIDADE (ESTRITAMENTE BLINDADO)
    try {
      dadosUsuario = await authServices.getPacienteInfo();
      tipo = "paciente";
    } catch (e1) {
      try {
        dadosUsuario = await authServices.getProfissionalInfo();
        tipo = "profissional";
      } catch (e2) {
        setIsLoadingGlobal(false);
        notificar(
          "Perfil não encontrado. Por favor, conclua o seu cadastro.",
          "erro",
        );
        localStorage.removeItem("token");
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
    } catch (erroSecundario) {
      // Falhas secundárias não quebram o login
    }

    // PASSO 3: PERSISTÊNCIA NA MEMÓRIA E SELEÇÃO INTELIGENTE
    setUsuario(dadosUsuario);
    setTipoUsuario(tipo);
    setPlanos(planosCarregados);
    setClinicas(clinicasCarregadas);

    if (clinicasCarregadas.length > 0) {
      const salvaAnteriormente = localStorage.getItem("clinicaSelecionadaId");

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
        localStorage.setItem("clinicaSelecionadaId", idParaSalvar);
      }
    }

    // PASSO 4: REGISTRO DO DISPOSITIVO PARA NOTIFICAÇÕES (FCM)
    try {
      const fcmToken = await solicitarTokenFirebase();
      if (fcmToken) {
        await authServices.salvarFcmToken(fcmToken); // Envia para o backend Java
      }
    } catch (err) {
      console.warn("Não foi possível registrar o token FCM:", err);
    }

    setIsLoadingGlobal(false);
  };

  useEffect(() => {
    if (!usuario && !rotasPublicas.includes(location.pathname)) {
      carregarDadosGlobais();
    } else {
      if (rotasPublicas.includes(location.pathname)) {
        setIsLoadingGlobal(false);
      }
    }
  }, [location.pathname]);

  const handleSetClinicaSelecionadaId = (id: string) => {
    setClinicaSelecionadaId(id);
    localStorage.setItem("clinicaSelecionadaId", id);
  };

  if (isLoadingGlobal && !rotasPublicas.includes(location.pathname)) {
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
        isLoadingGlobal,
        refreshData: carregarDadosGlobais,
        notificar,
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

export const useApp = () => useContext(AppContext);
