import { Navigate } from "react-router-dom";
import { useApp } from "../contexts/AppContext";

interface RouteGuardProps {
  tipoPermitido: "paciente" | "profissional" | "ambos";
  element: React.ReactElement;
}

export function RouteGuard({ tipoPermitido, element }: RouteGuardProps) {
  const { tipoUsuario, usuario } = useApp();
  const token = localStorage.getItem("token");

  // 1. Sem token = Login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 2. Carregando dados = Aguarda
  if (!usuario || !tipoUsuario) {
    return null;
  }

  // 3. Rota livre para ambos
  if (tipoPermitido === "ambos") {
    return element;
  }

  // 4. Encaminhamento inteligente (Fim do Bug do Chute para o Login)
  if (tipoUsuario !== tipoPermitido) {
    if (tipoUsuario === "profissional") {
      return <Navigate to="/inicio-profissional" replace />;
    }
    if (tipoUsuario === "paciente") {
      return <Navigate to="/inicio" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return element;
}

export default RouteGuard;
