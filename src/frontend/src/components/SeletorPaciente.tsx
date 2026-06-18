import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiUser, FiCheck } from "react-icons/fi";

import { Paciente } from "@interfaces";

const formatarCPF = (v: string) => {
  const d = (v || "").replace(/\D/g, "");
  if (d.length !== 11) return v || "---";
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

// Como a listagem da clínica traz dados adicionais do vínculo (vinculoId),
// extendemos a sua interface padrão temporariamente para não dar erro de tipagem.
interface PacienteVinculo extends Paciente {
  vinculoId?: string;
  clinPacienteId?: string;
  id?: string;
  pacienteId?: string;
}

interface SeletorPacienteProps {
  pacientes: PacienteVinculo[];
  value: string;
  onChange: (id: string) => void;
  error?: string;
}

// ----------------------------------------------------------------------
// CORREÇÃO: Função extrai rigorosamente o ID do Vínculo em vez do Paciente
// ----------------------------------------------------------------------
const extrairId = (p: PacienteVinculo) =>
  p.vinculoId || p.clinPacienteId || p.id || "";

export const SeletorPaciente: React.FC<SeletorPacienteProps> = ({
  pacientes,
  value,
  onChange,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pacienteSelecionado = pacientes.find((p) => extrairId(p) === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Botão de Seleção */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3.5 bg-white border rounded-xl cursor-pointer transition-all shadow-sm ${
          isOpen
            ? "border-emerald-500 ring-2 ring-emerald-500/20"
            : error
              ? "border-red-500"
              : "border-slate-200 hover:border-emerald-300"
        }`}
      >
        {pacienteSelecionado ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {pacienteSelecionado.avatar ? (
                <img
                  src={pacienteSelecionado.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser className="text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 leading-tight">
                {pacienteSelecionado.nome}
              </p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-widest">
                CPF: {formatarCPF(pacienteSelecionado.cpf)}
              </p>
            </div>
          </div>
        ) : (
          <span className="text-sm font-medium text-slate-400 ml-1">
            Selecione um paciente para o tratamento...
          </span>
        )}
        <FiChevronDown
          className={`text-slate-400 transition-transform duration-300 mr-1 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {error && (
        <span className="text-red-500 text-[10px] font-bold ml-1 mt-1 block">
          {error}
        </span>
      )}

      {/* Dropdown com Animação */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 p-1"
          >
            {pacientes.length === 0 ? (
              <div className="p-4 text-center text-sm font-medium text-slate-400">
                Nenhum paciente disponível.
              </div>
            ) : (
              pacientes.map((paciente) => {
                const idDoVinculo = extrairId(paciente);
                const isSelected = idDoVinculo === value;
                return (
                  <div
                    key={idDoVinculo}
                    onClick={() => {
                      onChange(idDoVinculo);
                      setIsOpen(false);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected ? "bg-emerald-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {paciente.avatar ? (
                          <img
                            src={paciente.avatar}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FiUser className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-bold ${isSelected ? "text-emerald-700" : "text-slate-700"}`}
                        >
                          {paciente.nome}
                        </p>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                          CPF: {formatarCPF(paciente.cpf)}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <FiCheck className="text-emerald-500 text-lg mr-2" />
                    )}
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
