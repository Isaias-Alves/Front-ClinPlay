import { AiOutlineHome, AiOutlineSetting, AiOutlineUser } from "react-icons/ai";
import { FiBookOpen, FiClipboard } from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@contexts";

type Perfil = "paciente" | "profissional";

interface ItemNavegacao {
  label: string;
  icon: React.ReactNode;
  rota: string;
}

/**
 * Cada rota daqui precisa existir em `App.tsx`. A versão anterior apontava
 * para `/relatorios`, `/clinicaPaciente`, `/clinicaAdmin`, `/feedbacks` e
 * `/config` — nenhuma delas registrada —, e o "início" do profissional
 * levava ao painel do paciente. O resultado eram abas que só levavam a uma
 * tela em branco.
 */
const ITENS: Record<Perfil, ItemNavegacao[]> = {
  paciente: [
    { label: "início", icon: <AiOutlineHome />, rota: "/inicio" },
    { label: "missões", icon: <FiClipboard />, rota: "/missoes" },
    { label: "clínicas", icon: <RiHospitalLine />, rota: "/clinicas/user" },
    { label: "perfil", icon: <AiOutlineUser />, rota: "/perfil" },
    { label: "config", icon: <AiOutlineSetting />, rota: "/configuracoes" },
  ],
  profissional: [
    { label: "início", icon: <AiOutlineHome />, rota: "/inicio-profissional" },
    { label: "tratamentos", icon: <FiBookOpen />, rota: "/tratamentos" },
    { label: "clínicas", icon: <RiHospitalLine />, rota: "/clinicas" },
    { label: "protocolos", icon: <FiClipboard />, rota: "/protocolos" },
    { label: "config", icon: <AiOutlineSetting />, rota: "/configuracoes" },
  ],
};

/**
 * Item ativo: o de rota mais específica que casa com a URL. A comparação é
 * por segmento, senão `/inicio` casaria com `/inicio-profissional` e
 * `/clinicas` engoliria `/clinicas/user`.
 */
const rotaAtiva = (itens: ItemNavegacao[], pathname: string) =>
  itens.reduce<string | null>((melhor, item) => {
    const casa = pathname === item.rota || pathname.startsWith(`${item.rota}/`);
    if (!casa) return melhor;
    return melhor && melhor.length >= item.rota.length ? melhor : item.rota;
  }, null);

interface BottomBarProps {
  /** Sobrepõe o perfil do contexto. Só use em telas de pré-visualização. */
  tipo?: Perfil;
}

export const BottomBar = ({ tipo }: BottomBarProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { tipoUsuario } = useApp();

  // O perfil vem do contexto: antes cada página passava a string na mão e
  // várias telas de paciente exibiam a barra do profissional.
  const perfil: Perfil = tipo ?? tipoUsuario ?? "paciente";
  const itens = ITENS[perfil];
  const ativa = rotaAtiva(itens, pathname);

  return (
    <nav
      aria-label="Navegação principal"
      // `pb-[env(safe-area-inset-bottom)]` mantém os botões acima da barra
      // de gestos do iOS — o `index.html` já usa `viewport-fit=cover`.
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-md items-stretch justify-between border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] shadow-lg"
    >
      {itens.map((item) => {
        const isActive = ativa === item.rota;

        return (
          <button
            key={item.rota}
            type="button"
            onClick={() => navigate(item.rota)}
            aria-current={isActive ? "page" : undefined}
            // min-h-14 garante o alvo de toque mínimo recomendado (44px).
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition-colors ${
              isActive
                ? "font-semibold text-emerald-600"
                : "text-slate-500 active:text-emerald-500"
            }`}
          >
            <span aria-hidden className="text-xl">
              {item.icon}
            </span>
            <span className="capitalize leading-none">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomBar;
