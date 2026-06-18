import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import LoginPage from "./pages/LoginPage";
import CadastroPage from "./pages/CadastroPage";
import OAuthSetup from "./pages/OAuthSetup";
import { OAuthCallback } from "./pages/OAuthCallback";
import { DebugAwaitPage } from "./pages/DebugAwaitPage";
import RouteGuard from "./components/RouteGuard";
import { StartPagePaciente } from "./pages/StartPagePaciente";
import { StartPageProfissional } from "./pages/StartPageProfissional";
import { ClinicaPage } from "./pages/ClinicaPage";
import { ClinicaUserPage } from "./pages/ClinicaUserPage";
import { ClinicaDetalhesPage } from "./pages/ClinicaDetalhesPage";
import { ClinicaUserDetalhesPage } from "./pages/ClinicaUserDetalhes";
import { TratamentosProfPage } from "./pages/TratamentosProfPage";
import { TratamentosFormPage } from "./pages/TratamentosFormPage";
import { TratamentoSalaPage } from "./pages/TratamentoSalaPage";
import { ExercicioDetalhesPage } from "./pages/ExercicioDetalhesPage";
import { ClinicaFormPage } from "./pages/ClinicaFormPage";
import { ConfiguracoesPage } from "./pages/ConfiguracoesPage";

// IMPORTAÇÃO DA NOVA PÁGINA UNIFICADA DE PERFIL
import { PerfilPage } from "./pages/PerfilPage";
import { PerfilEditarPage } from "./pages/PerfilEditarPage";
import { PerfilExcluirPage } from "./pages/PerfilExcluirPage";

import { ProtocolosPage } from "./pages/ProtocolosPage";
import { ProtocolosFormPage } from "./pages/ProtocolosFormPage";
import { ProtocoloDetalhesPage } from "./pages/ProtocoloDetalhesPage";
import { MeusProtocolosPage } from "./pages/MeusProtocolosPage";
import { PlanosPage } from "./pages/PlanosPage";
import { JogosPage } from "./pages/JogosPage";
import { ExercicioFormPage } from "./pages/ExercicioFormPage";
import { ExercicioJogarPage } from "./pages/ExercicioJogarPage";

function App() {
  return (
    <BrowserRouter>
      {/* O AppProvider DEVE ficar aqui: Dentro do Router, mas envolvendo todas as rotas! */}
      <AppProvider>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/oauth/setup" element={<OAuthSetup />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route path="/debug" element={<DebugAwaitPage />} />

          {/* Rotas Privadas (Protegidas) */}
          <Route
            path="/inicio"
            element={
              <RouteGuard
                tipoPermitido="paciente"
                element={<StartPagePaciente />}
              />
            }
          />
          <Route
            path="/inicio-profissional"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<StartPageProfissional />}
              />
            }
          />

          <Route
            path="/planos"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<PlanosPage />}
              />
            }
          />

          <Route
            path="/clinicas"
            element={
              <RouteGuard tipoPermitido="paciente" element={<ClinicaPage />} />
            }
          />
          <Route
            path="/clinicas/user"
            element={
              <RouteGuard
                tipoPermitido="paciente"
                element={<ClinicaUserPage />}
              />
            }
          />
          <Route
            path="/clinicas/:id"
            element={
              <RouteGuard
                tipoPermitido="ambos"
                element={<ClinicaDetalhesPage />}
              />
            }
          />
          <Route
            path="/clinicas/user/:id"
            element={
              <RouteGuard
                tipoPermitido="paciente"
                element={<ClinicaUserDetalhesPage />}
              />
            }
          />
          <Route
            path="/clinicas/formulario"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<ClinicaFormPage />}
              />
            }
          />

          <Route
            path="/tratamentos"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<TratamentosProfPage />}
              />
            }
          />
          <Route
            path="/tratamentos/formulario"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<TratamentosFormPage />}
              />
            }
          />
          <Route
            path="/tratamentos/formulario/:id"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<TratamentosFormPage />}
              />
            }
          />
          <Route
            path="/tratamentos/sala/:id"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<TratamentoSalaPage />}
              />
            }
          />

          <Route
            path="/exercicio/:id/jogar/:jogo"
            element={
              <RouteGuard
                tipoPermitido="paciente"
                element={<ExercicioJogarPage />}
              />
            }
          />

          <Route
            path="/clinica/:clinicaId/jogos"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<JogosPage />}
              />
            }
          />
          <Route
            path="/clinica/:clinicaId/exercicios/novo"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<ExercicioFormPage />}
              />
            }
          />
          <Route
            path="/exercicios/:id"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<ExercicioDetalhesPage />}
              />
            }
          />

          <Route
            path="/configuracoes"
            element={
              <RouteGuard
                tipoPermitido="ambos"
                element={<ConfiguracoesPage />}
              />
            }
          />

          {/* NOVAS ROTAS DE PERFIL UNIFICADO */}
          <Route
            path="/perfil"
            element={
              <RouteGuard tipoPermitido="ambos" element={<PerfilPage />} />
            }
          />
          {/* Rota extra caso você queira passar o ID do usuário na URL futuramente */}
          <Route
            path="/perfil/:id"
            element={
              <RouteGuard tipoPermitido="ambos" element={<PerfilPage />} />
            }
          />

          <Route path="/perfil/editar" element={<PerfilEditarPage />} />
          <Route path="/perfil/excluir" element={<PerfilExcluirPage />} />

          <Route
            path="/protocolos"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<ProtocolosPage />}
              />
            }
          />
          <Route
            path="/protocolos/formulario"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<ProtocolosFormPage />}
              />
            }
          />
          <Route
            path="/protocolos/formulario/:id"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<ProtocolosFormPage />}
              />
            }
          />
          <Route
            path="/protocolos/:id"
            element={
              <RouteGuard
                tipoPermitido="profissional"
                element={<ProtocoloDetalhesPage />}
              />
            }
          />
          <Route
            path="/missoes"
            element={
              <RouteGuard
                tipoPermitido="paciente"
                element={<MeusProtocolosPage />}
              />
            }
          />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
