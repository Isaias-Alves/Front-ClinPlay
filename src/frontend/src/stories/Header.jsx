import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiUser, FiSettings, FiLogOut, FiPlus, FiSearch } from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";

/**
 * Tipagem para os dados de uma Clínica exibida no Header
 */
export interface ClinicaHeaderData {
  id: string;
  nome: string;
  localizacao?: string; // Ex: "Savassi - Belo Horizonte"
}

/**
 * Propriedades que a Homepage passará para este Header
 */
interface HeaderProps {
  clinicas?: ClinicaHeaderData[]; // Marcado como opcional para evitar quebras
  clinicaSelecionadaId?: string;
  tipoUsuario?: "paciente" | "profissional" | null; // AQUI: A permissão para o botão
  onSelectClinica: (id: string) => void;
  onNovaClinica: () => void;
  onCriarClinica?: () => void; // AQUI: A função do botão
  usuarioLogado?: {
    nome?: string;
    avatarUrl?: string;
  };
  onNavigatePerfil: () => void;
  onNavigateConfiguracoes: () => void;
  onLogout: () => void;
}

const Header = ({
  clinicas = [],
  clinicaSelecionadaId,
  tipoUsuario, // AQUI: Desestruturado
  onSelectClinica,
  onNovaClinica,
  onCriarClinica, // AQUI: Desestruturado
  usuarioLogado = {},
  onNavigatePerfil,
  onNavigateConfiguracoes,
  onLogout,
}: HeaderProps) => {
  // Estados para controlar a abertura dos menus dropdown
  const [isClinicaMenuOpen, setIsClinicaMenuOpen] = useState(false);
  const [isPerfilMenuOpen, setIsPerfilMenuOpen] = useState(false);

  // Referências para detetar cliques fora dos menus
  const clinicaRef = useRef<HTMLDivElement>(null);
  const perfilRef = useRef<HTMLDivElement>(null);

  // Encontrar a clínica atual de forma segura (usando optional chaining ?.)
  const clinicaAtual =
    clinicas?.find((c) => c.id === clinicaSelecionadaId) || clinicas?.[0];

  // Efeito para fechar os menus ao clicar fora deles
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clinicaRef.current &&
        !clinicaRef.current.contains(event.target as Node)
      ) {
        setIsClinicaMenuOpen(false);
      }
      if (
        perfilRef.current &&
        !perfilRef.current.contains(event.target as Node)
      ) {
        setIsPerfilMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Variantes de animação para os Dropdowns
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <header className="relative w-full max-w-4xl mx-auto flex items-center justify-between bg-white rounded-3xl p-3 shadow-sm border border-slate-100 z-40 mb-6">
      {/* LADO ESQUERDO: Seletor de Clínicas */}
      <div className="relative" ref={clinicaRef}>
        <button
          onClick={() => {
            setIsClinicaMenuOpen(!isClinicaMenuOpen);
            setIsPerfilMenuOpen(false); // Fecha o outro se estiver aberto
          }}
          className="flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-slate-50 transition-colors text-left"
        >
          {/* Ícone da Clínica */}
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl shrink-0">
            <RiHospitalLine />
          </div>

          <div className="">
            <h2 className="text-sm font-bold text-slate-800 leading-tight">
              {clinicaAtual?.nome || "As suas Clínicas"}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              {clinicaAtual?.localizacao || "Gestão de Vínculos"}
            </p>
          </div>

          <FiChevronDown
            className={`text-slate-400 ml-2 transition-transform duration-300 ${isClinicaMenuOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown de Clínicas */}
        <AnimatePresence>
          {isClinicaMenuOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col"
            >
              <div className="max-h-60 overflow-y-auto scrollbar-thin p-2 space-y-1">
                {clinicas?.length > 0 ? (
                  clinicas.map((clinica) => (
                    <button
                      key={clinica.id}
                      onClick={() => {
                        onSelectClinica(clinica.id);
                        setIsClinicaMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                        clinica.id === clinicaSelecionadaId
                          ? "bg-emerald-50 border border-emerald-100"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-lg shrink-0">
                        <RiHospitalLine />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-700">
                          {clinica.nome}
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          {clinica.localizacao || "Unidade"}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Nenhum vínculo encontrado.
                  </div>
                )}
              </div>

              {/* Botões de Ação na Base do Dropdown */}
              <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-2">

                {/* Botão Escuro (Buscar/Entrar em Clínica) */}
                <button
                  onClick={() => {
                    onNovaClinica();
                    setIsClinicaMenuOpen(false);
                  }}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-colors shadow-md active:scale-95 flex items-center justify-center gap-2"
                >
                  <FiSearch className="text-lg" /> Buscar nova clínica
                </button>

                {/* Botão Verde (Criar Clínica - EXCLUSIVO PARA PROFISSIONAIS) */}
                {tipoUsuario === "profissional" && (
                  <button
                    onClick={() => {
                      if (onCriarClinica) onCriarClinica();
                      setIsClinicaMenuOpen(false);
                    }}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <FiPlus className="text-lg" /> Criar minha clínica
                  </button>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LADO DIREITO: Perfil do Utilizador */}
      <div className="relative" ref={perfilRef}>
        <button
          onClick={() => {
            setIsPerfilMenuOpen(!isPerfilMenuOpen);
            setIsClinicaMenuOpen(false);
          }}
          className="relative w-11 h-11 rounded-full border-2 border-emerald-100 bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl overflow-hidden hover:shadow-md transition-shadow focus:outline-none"
        >
          {usuarioLogado?.avatarUrl ? (
            <img
              src={usuarioLogado.avatarUrl}
              alt="Avatar do Usuário"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <FiUser />
          )}
        </button>

        {/* Dropdown de Perfil */}
        <AnimatePresence>
          {isPerfilMenuOpen && (
            <motion.div
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden py-2"
            >
              <button
                onClick={() => {
                  onNavigatePerfil();
                  setIsPerfilMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <FiUser className="text-lg text-emerald-500" /> Meu perfil
              </button>

              <button
                onClick={() => {
                  onNavigateConfiguracoes();
                  setIsPerfilMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <FiSettings className="text-lg text-blue-500" /> Configurações
              </button>

              <div className="h-px bg-slate-100 my-1 mx-3"></div>

              <button
                onClick={() => {
                  onLogout();
                  setIsPerfilMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                <FiLogOut className="text-lg" /> Sair
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
