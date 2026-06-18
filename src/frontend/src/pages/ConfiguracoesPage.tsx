import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaChevronRight, FaTrash } from "react-icons/fa";
import { FiSun, FiMoon, FiUser, FiArrowLeft } from "react-icons/fi";
import { useApp } from "@contexts";

/**
 * Extrai o primeiro nome de um nome completo.
 * @param nomeCompleto - Nome completo do usuário.
 * @returns Primeiro nome do usuário.
 */
const extrairPrimeiroNome = (nomeCompleto: string): string => {
  if (!nomeCompleto) return "";
  return nomeCompleto.trim().split(" ")[0];
};

/**
 * Componente de toggle reutilizável.
 * @param ativo - Estado atual do toggle.
 * @param onChange - Função chamada ao alternar.
 */
const Toggle = ({ ativo, onChange }: { ativo: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    role="switch"
    aria-checked={ativo}
    style={{
      minWidth: "44px",
      width: "44px",
      height: "24px",
      borderRadius: "9999px",
      position: "relative",
      flexShrink: 0,
      backgroundColor: ativo ? "#10b981" : "#e2e8f0",
      border: "none",
      cursor: "pointer",
      transition: "background-color 0.3s",
    }}
  >
    <span
      style={{
        position: "absolute",
        top: "2px",
        left: ativo ? "22px" : "2px",
        width: "20px",
        height: "20px",
        backgroundColor: "white",
        borderRadius: "9999px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
        transition: "left 0.3s",
      }}
    />
  </button>
);

/**
 * Página de configurações do usuário logado.
 * Exibe avatar, opções de display e ações de conta.
 */
export function ConfiguracoesPage() {
  const navigate = useNavigate();
  const { usuario } = useApp();

  const primeiroNome = extrairPrimeiroNome(usuario?.nome || "");

  const [modoContraste, setModoContraste] = useState(false);
  const [modoEscuro, setModoEscuro] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* HEADER DE FUNDO */}
      <div className="bg-slate-900 h-64 w-full relative rounded-b-[40px] shadow-lg">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-b-[40px]">
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-md mx-auto px-6 pt-8 relative z-10 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 flex items-center gap-2 text-sm font-bold backdrop-blur-sm"
          >
            <FiArrowLeft className="text-lg" /> Voltar
          </button>
          <div className="w-11"></div>
        </div>
      </div>

      <main className="max-w-md mx-auto px-6 space-y-6 -mt-24 relative z-20">

        {/* Card de perfil */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-emerald-100 overflow-hidden bg-emerald-50 flex items-center justify-center flex-shrink-0">
            {usuario?.avatar ? (
  <img
    src={usuario.avatar}
                alt="Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser className="text-emerald-400 text-2xl" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-base truncate">
              {usuario?.nome || "---"}
            </p>
            <p className="text-slate-400 text-xs truncate">
              {usuario?.email || ""}
            </p>
          </div>
        </div>

        {/* DISPLAY */}
        <section className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            Display
          </p>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <FiSun className="text-slate-500 text-lg flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700">
                  Modo Contraste
                </span>
              </div>
              <Toggle ativo={modoContraste} onChange={() => setModoContraste(!modoContraste)} />
            </div>

            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <FiMoon className="text-slate-500 text-lg flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700">
                  Modo Escuro
                </span>
              </div>
              <Toggle ativo={modoEscuro} onChange={() => setModoEscuro(!modoEscuro)} />
            </div>
          </div>
        </section>

        {/* CONTA */}
        <section className="space-y-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
            Conta
          </p>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => navigate("/perfil/editar")}
              className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-medium text-slate-700">
                Editar informações
              </span>
              <FaChevronRight className="text-slate-300 text-sm flex-shrink-0" />
            </button>

            <button
              onClick={() => navigate("/perfil/excluir")}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-red-50 transition-colors"
            >
              <span className="text-sm font-medium text-red-500">
                Deletar conta
              </span>
              <FaTrash className="text-red-400 text-sm flex-shrink-0" />
            </button>
          </div>
        </section>

      </main>
    </div>
  );
}

export default ConfiguracoesPage;