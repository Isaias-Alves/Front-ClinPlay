import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useApp } from "@contexts";
import { LogotipoClinPlay } from "@components";
import RouteGuard from "./components/RouteGuard";

// Code splitting por rota: o bundle único passava de 890 kB, o que é caro
// numa aplicação mobile-first usada em rede móvel.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const CadastroPage = lazy(() => import("./pages/CadastroPage"));
const OAuthSetup = lazy(() => import("./pages/OAuthSetup"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const DebugAwaitPage = lazy(() => import("./pages/DebugAwaitPage"));
const StartPagePaciente = lazy(() => import("./pages/StartPagePaciente"));
const StartPageProfissional = lazy(
  () => import("./pages/StartPageProfissional"),
);
const PlanosPage = lazy(() => import("./pages/PlanosPage"));
const ClinicaPage = lazy(() => import("./pages/ClinicaPage"));
const ClinicaUserPage = lazy(() => import("./pages/ClinicaUserPage"));
const ClinicaDetalhesPage = lazy(() => import("./pages/ClinicaDetalhesPage"));
const ClinicaUserDetalhesPage = lazy(
  () => import("./pages/ClinicaUserDetalhes"),
);
const ClinicaFormPage = lazy(() => import("./pages/ClinicaFormPage"));
const TratamentosProfPage = lazy(() => import("./pages/TratamentosProfPage"));
const TratamentosFormPage = lazy(() => import("./pages/TratamentosFormPage"));
const TratamentoSalaPage = lazy(() => import("./pages/TratamentoSalaPage"));
const ExercicioDetalhesPage = lazy(
  () => import("./pages/ExercicioDetalhesPage"),
);
const ExercicioFormPage = lazy(() => import("./pages/ExercicioFormPage"));
const ExercicioJogarPage = lazy(() => import("./pages/ExercicioJogarPage"));
const JogosPage = lazy(() => import("./pages/JogosPage"));
const ConfiguracoesPage = lazy(() => import("./pages/ConfiguracoesPage"));
const PerfilPage = lazy(() => import("./pages/PerfilPage"));
const PerfilEditarPage = lazy(() => import("./pages/PerfilEditarPage"));
const PerfilExcluirPage = lazy(() => import("./pages/PerfilExcluirPage"));
const ProtocolosPage = lazy(() => import("./pages/ProtocolosPage"));
const ProtocolosFormPage = lazy(() => import("./pages/ProtocolosFormPage"));
const ProtocoloDetalhesPage = lazy(
  () => import("./pages/ProtocoloDetalhesPage"),
);
const MeusProtocolosPage = lazy(() => import("./pages/MeusProtocolosPage"));

type Perfil = "paciente" | "profissional" | "ambos";

interface RotaPrivada {
  path: string;
  perfil: Perfil;
  element: React.ReactElement;
}

const ROTAS_PUBLICAS: Array<{ path: string; element: React.ReactElement }> = [
  { path: "/", element: <LoginPage /> },
  { path: "/cadastro", element: <CadastroPage /> },
  { path: "/oauth/setup", element: <OAuthSetup /> },
  { path: "/oauth/callback", element: <OAuthCallback /> },
  { path: "/debug", element: <DebugAwaitPage /> },
];

/**
 * Tabela única de rotas protegidas. Antes cada rota repetia o mesmo bloco
 * `<Route element={<RouteGuard tipoPermitido=... element=... />} />`,
 * o que já tinha deixado `/perfil/editar` e `/perfil/excluir` sem guarda.
 */
const ROTAS_PRIVADAS: RotaPrivada[] = [
  // Painéis iniciais
  { path: "/inicio", perfil: "paciente", element: <StartPagePaciente /> },
  {
    path: "/inicio-profissional",
    perfil: "profissional",
    element: <StartPageProfissional />,
  },

  // Planos e clínicas
  { path: "/planos", perfil: "profissional", element: <PlanosPage /> },
  { path: "/clinicas", perfil: "profissional", element: <ClinicaPage /> },
  { path: "/clinicas/user", perfil: "paciente", element: <ClinicaUserPage /> },
  {
    path: "/clinicas/:id",
    perfil: "profissional",
    element: <ClinicaDetalhesPage />,
  },
  {
    path: "/clinicas/user/:codigo",
    perfil: "paciente",
    element: <ClinicaUserDetalhesPage />,
  },
  {
    path: "/clinicas/formulario",
    perfil: "profissional",
    element: <ClinicaFormPage />,
  },

  // Tratamentos
  {
    path: "/tratamentos",
    perfil: "profissional",
    element: <TratamentosProfPage />,
  },
  {
    path: "/tratamentos/formulario",
    perfil: "profissional",
    element: <TratamentosFormPage />,
  },
  {
    path: "/tratamentos/formulario/:id",
    perfil: "profissional",
    element: <TratamentosFormPage />,
  },
  {
    path: "/tratamentos/sala/:id",
    perfil: "profissional",
    element: <TratamentoSalaPage />,
  },

  // Exercícios e minigames
  {
    path: "/exercicio/:id/jogar/:jogo",
    perfil: "paciente",
    element: <ExercicioJogarPage />,
  },
  {
    path: "/clinica/:clinicaId/jogos",
    perfil: "profissional",
    element: <JogosPage />,
  },
  {
    path: "/clinica/:clinicaId/exercicios/novo",
    perfil: "profissional",
    element: <ExercicioFormPage />,
  },
  {
    path: "/exercicios/:id",
    perfil: "profissional",
    element: <ExercicioDetalhesPage />,
  },

  // Conta
  { path: "/configuracoes", perfil: "ambos", element: <ConfiguracoesPage /> },
  { path: "/perfil", perfil: "ambos", element: <PerfilPage /> },
  { path: "/perfil/:id", perfil: "ambos", element: <PerfilPage /> },
  { path: "/perfil/editar", perfil: "ambos", element: <PerfilEditarPage /> },
  { path: "/perfil/excluir", perfil: "ambos", element: <PerfilExcluirPage /> },

  // Protocolos
  { path: "/protocolos", perfil: "profissional", element: <ProtocolosPage /> },
  {
    path: "/protocolos/formulario",
    perfil: "profissional",
    element: <ProtocolosFormPage />,
  },
  {
    path: "/protocolos/formulario/:id",
    perfil: "profissional",
    element: <ProtocolosFormPage />,
  },
  {
    path: "/protocolos/:id",
    perfil: "profissional",
    element: <ProtocoloDetalhesPage />,
  },
  { path: "/missoes", perfil: "paciente", element: <MeusProtocolosPage /> },
];

/**
 * Qualquer URL desconhecida devolve o usuário ao painel do seu perfil (ou ao
 * login). Sem esta rota, um link errado — ou um item da BottomBar apontando
 * para uma rota inexistente — renderizava uma tela em branco sem saída.
 */
const RotaInexistente = () => {
  const { tipoUsuario } = useApp();

  const destino =
    tipoUsuario === "profissional"
      ? "/inicio-profissional"
      : tipoUsuario === "paciente"
        ? "/inicio"
        : "/";

  return <Navigate to={destino} replace />;
};

const TelaDeCarregamento = () => (
  <div className="flex flex-col items-center justify-center min-h-dvh bg-slate-50">
    <LogotipoClinPlay mt="mt-0" mb="mb-0" />
    <div className="w-10 h-10 mt-6 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      {/* O AppProvider fica dentro do Router, mas envolvendo todas as rotas. */}
      <AppProvider>
        <Suspense fallback={<TelaDeCarregamento />}>
          <Routes>
            {ROTAS_PUBLICAS.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}

            {ROTAS_PRIVADAS.map(({ path, perfil, element }) => (
              <Route
                key={path}
                path={path}
                element={
                  <RouteGuard tipoPermitido={perfil} element={element} />
                }
              />
            ))}

            <Route path="*" element={<RotaInexistente />} />
          </Routes>
        </Suspense>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
