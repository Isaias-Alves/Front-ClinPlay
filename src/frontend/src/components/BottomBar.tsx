import React from "react";
import {
  AiOutlineHome,
  AiOutlineFileText,
  AiOutlineUser,
  AiOutlineSetting,
} from "react-icons/ai";
import { FiClipboard, FiMessageSquare, FiBookOpen } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface BottomBarProps {
  tipo: "paciente" | "profissional";
  ativo: string;
}

export const BottomBar = ({ tipo, ativo }: BottomBarProps) => {
  const navigate = useNavigate();
  const itensPaciente = [
    { label: "início", icon: <AiOutlineHome />, rota: "/inicio" },
    { label: "missões", icon: <FiClipboard />, rota: "/missoes" },
    { label: "relatórios", icon: <AiOutlineFileText />, rota: "/relatorios" },
    { label: "clínica", icon: <AiOutlineUser />, rota: "/clinicaPaciente" },
    { label: "config", icon: <AiOutlineSetting />, rota: "/configuracoes" },
  ];

  const itensProfissional = [
    { label: "início", icon: <AiOutlineHome />, rota: "/inicio" },
    { label: "tratamentos", icon: <FiBookOpen />, rota: "/tratamentos" },
    { label: "clínica", icon: <AiOutlineHome />, rota: "/clinicaAdmin" },
    { label: "protocolos", icon: <FiClipboard />, rota: "/protocolos" },
    { label: "feedbacks", icon: <FiMessageSquare />, rota: "/feedbacks" },
    { label: "config", icon: <AiOutlineSetting />, rota: "/config" },
  ];

  const itensAtuais = tipo === "paciente" ? itensPaciente : itensProfissional;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg py-2 px-6 flex justify-between items-center max-w-md mx-auto z-50">
      {itensAtuais.map((item) => {
        const isActive = ativo.toLowerCase() === item.label.toLowerCase();

        return (
          <button
            key={item.label}
            onClick={() => navigate(item.rota)}
            className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors ${
              isActive
                ? "text-emerald-600 font-semibold"
                : "text-slate-500 hover:text-emerald-500"
            }`}
          >
            <span className={`text-2xl ${isActive ? "text-emerald-600" : ""}`}>
              {item.icon}
            </span>
            <span className="capitalize">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
