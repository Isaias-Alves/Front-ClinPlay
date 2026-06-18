import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "@contexts";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar,
  FiAward,
  FiBriefcase,
  FiCreditCard,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";

export function PerfilPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario: usuarioLogado, tipoUsuario: tipoLogado } = useApp();

  // Permite visualizar o próprio perfil (padrão) ou o perfil de alguém passado na navegação
  const usuario = location.state?.usuario || usuarioLogado;
  const tipo = location.state?.tipo || tipoLogado;
  const isMeuPerfil = !location.state?.usuario;

  if (!usuario) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const formatarData = (data?: string) => {
    if (!data) return "---";
    const partes = data.split("-");
    if (partes.length !== 3) return data;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  const formatarCpf = (cpf?: string) => {
    if (!cpf) return "---";
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const isProfissional = tipo === "profissional";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER DE FUNDO */}
      <div className="bg-slate-900 h-64 w-full relative rounded-b-[40px] shadow-lg">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-b-[40px]">
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-3xl mx-auto px-6 pt-8 relative z-10 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 flex items-center gap-2 text-sm font-bold backdrop-blur-sm"
          >
            <FiArrowLeft className="text-lg" /> Voltar
          </button>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 -mt-24 relative z-20 space-y-8">
        {/* CARD PRINCIPAL - AVATAR E NOME */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left"
        >
          <div className="w-32 h-32 rounded-3xl bg-slate-100 border-4 border-white shadow-lg overflow-hidden shrink-0 flex items-center justify-center text-slate-300 text-5xl">
            {usuario.avatar ? (
              <img
                src={usuario.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser />
            )}
          </div>
          <div className="flex-1 pt-2">
            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-lg mb-3">
              {isProfissional ? "Profissional de Saúde" : "Paciente"}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
              {usuario.nome}
            </h1>
            <p className="text-slate-500 font-medium mt-1 flex items-center justify-center sm:justify-start gap-2">
              <FiMail className="text-emerald-500" /> {usuario.email || "---"}
            </p>
          </div>
        </motion.div>

        {/* CARDS DE INFORMAÇÃO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* DADOS GERAIS */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FiUser className="text-blue-500" /> Dados Pessoais
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                  <FiPhone />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Telefone
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {usuario.telefone || "Não informado"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                  <FiCalendar />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    Data de Nascimento
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    {formatarData(usuario.nascimento || usuario.dataNascimento)}
                  </p>
                </div>
              </div>
              {!isProfissional && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                    <FiCreditCard />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Documento (CPF)
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {formatarCpf(usuario.cpf)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DADOS PROFISSIONAIS (SÓ MOSTRA SE FOR PROFISSIONAL) */}
          {isProfissional && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FiBriefcase className="text-indigo-500" /> Registro
                Profissional
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                    <FiAward />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Especialidade
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {usuario.especialidade || "---"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                    <FiCreditCard />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Registro CREFITO
                    </p>
                    <p className="text-sm font-bold text-slate-700">
                      {usuario.crefito || "---"}
                    </p>
                  </div>
                </div>
                {usuario.conselhoNome && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      <FiBriefcase />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Conselho Regional
                      </p>
                      <p className="text-sm font-bold text-slate-700">
                        {usuario.conselhoNome} - {usuario.conselhoNumero} /{" "}
                        {usuario.conselhoUf}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

export default PerfilPage;
