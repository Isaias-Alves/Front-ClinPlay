import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { profissionalServices, pacienteServices } from "@services";
import { BottomBar } from "../components/BottomBar";
import { useApp } from "@contexts"; // <-- IMPORTANDO O SEU CONTEXTO!
import {
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiCalendar,
  FiAward,
  FiBriefcase,
  FiCreditCard,
  FiSave,
  FiX
} from "react-icons/fi";
import { UsuarioFormInput } from "../interfaces/usuario";
import { validationPatterns, validationMessages } from "@utils";

export function PerfilEditarPage() {
  const navigate = useNavigate();
  // 1. Puxamos os dados exatos e atualizados do contexto (sem depender de localStorage falho)
  const { usuario: usuarioLogado, tipoUsuario: tipoLogado } = useApp();
  
  const [carregando, setCarregando] = useState(false);

  // 2. Verificação rígida do tipo
  const isProfissional = tipoLogado === "profissional";

  const mascaraCpf = (valor: string): string => {
    if (!valor) return "";
    return valor
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .slice(0, 14);
  };

  const mascaraCnpj = (valor: string): string => {
    if (!valor) return "";
    return valor
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  // 3. O useForm já inicia com os dados do usuário, fazendo o "pre-fill" automaticamente
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UsuarioFormInput>({
    defaultValues: {
      ...usuarioLogado,
      dataNascimento: usuarioLogado?.nascimento || usuarioLogado?.dataNascimento || "",
      // Se tiver CPF ou CNPJ salvo, já aplica a máscara no carregamento inicial
      cpf: usuarioLogado?.cpf ? mascaraCpf(usuarioLogado.cpf) : "",
      cnpj: usuarioLogado?.cnpj ? mascaraCnpj(usuarioLogado.cnpj) : "",
    }
  });

  // Observa mudanças para aplicar máscaras enquanto o usuário digita
  const cpfValue = watch("cpf");
  const cnpjValue = watch("cnpj");

  useEffect(() => {
    if (cpfValue) setValue("cpf", mascaraCpf(cpfValue), { shouldValidate: true });
  }, [cpfValue, setValue]);

  useEffect(() => {
    if (cnpjValue) setValue("cnpj", mascaraCnpj(cnpjValue), { shouldValidate: true });
  }, [cnpjValue, setValue]);

  // Atualiza os valores do formulário caso o usuarioLogado seja carregado de forma assíncrona
  useEffect(() => {
    if (usuarioLogado) {
      reset({
        ...usuarioLogado,
        dataNascimento: usuarioLogado.nascimento || usuarioLogado.dataNascimento || "",
        cpf: usuarioLogado.cpf ? mascaraCpf(usuarioLogado.cpf) : "",
        cnpj: usuarioLogado.cnpj ? mascaraCnpj(usuarioLogado.cnpj) : "",
      });
    }
  }, [usuarioLogado, reset]);

  const onSubmit = async (data: UsuarioFormInput) => {
    setCarregando(true);

    const payload = {
      ...usuarioLogado, // Garante que não vamos perder nenhum dado que não está no form
      ...data,
      nascimento: data.dataNascimento, // Mapeia o nome do input para o esperado pela API
      cpf: data.cpf ? data.cpf.replace(/\D/g, "") : undefined,
      cnpj: undefined, // Campo não existe no backend
    };

    try {
      if (isProfissional) {
        await profissionalServices.atualizar(payload);
      } else {
        await pacienteServices.atualizar(payload);
      }

      alert("Perfil atualizado com sucesso!");
      window.location.href = "/perfil"; // Redireciona e recarrega a página ao mesmo tempo para obter os novos dados
    } catch (error: any) {
      alert("Erro ao atualizar o perfil: " + (error.response?.data || error.message));
    } finally {
      setCarregando(false);
    }
  };

  // Se por algum motivo não carregou o usuário do contexto, mostra tela de loading
  if (!usuarioLogado) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
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
            <FiArrowLeft className="text-lg" /> Cancelar
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 -mt-24 relative z-20 space-y-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* CARD PRINCIPAL - AVATAR E NOME */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left relative overflow-hidden"
          >
            <div className="w-32 h-32 rounded-3xl bg-slate-100 border-4 border-white shadow-lg overflow-hidden shrink-0 flex items-center justify-center text-slate-300 text-5xl">
              {usuarioLogado.avatar ? (
                <img src={usuarioLogado.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <FiUser />
              )}
            </div>
            
            <div className="flex-1 pt-2 w-full">
              <div className="inline-block px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded-lg mb-3">
                Editando Perfil
              </div>
              <input
                {...register("nome", { required: "Nome é obrigatório" })}
                className="w-full text-3xl font-extrabold text-slate-800 tracking-tight bg-transparent border-b-2 border-slate-100 focus:border-emerald-500 outline-none pb-1 transition-colors"
              />
              <p className="text-slate-400 text-sm font-medium mt-2">Você pode editar seu nome acima.</p>
            </div>
          </motion.div>

          {/* GRID DE CARDS - Adicionado items-start para evitar distorção de altura */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
          >
            {/* DADOS GERAIS - DISPONÍVEL PARA AMBOS */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FiUser className="text-blue-500" /> Dados Pessoais
              </h2>
              
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                    <FiPhone />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Telefone</p>
                    <input
                      {...register("telefone", { required: "Obrigatório" })}
                      className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none pb-1"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                    <FiCalendar />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Data de Nascimento</p>
                    <input
                      type="date"
                      {...register("dataNascimento", { required: "Obrigatório" })}
                      className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none pb-1"
                    />
                  </div>
                </div>

                {/* CPF APENAS PARA PACIENTE */}
                {!isProfissional && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                      <FiCreditCard />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Documento (CPF)</p>
                      <input
                        {...register("cpf", { required: "Obrigatório" })}
                        readOnly
                        className="w-full text-sm font-bold text-slate-400 bg-transparent border-b border-slate-200 outline-none pb-1 cursor-not-allowed"
                        title="O CPF não pode ser alterado."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DADOS PROFISSIONAIS - DISPONÍVEL APENAS PARA PROFISSIONAL */}
            {isProfissional && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FiBriefcase className="text-indigo-500" /> Registro Profissional
                </h2>
                
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      <FiAward />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Registro CREFITO</p>
                      <input
                        {...register("crefito", { required: "Obrigatório" })}
                        className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none pb-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      <FiBriefcase />
                    </div>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Conselho / UF</p>
                         <div className="flex gap-2">
                           <input
                             {...register("conselhoNome", { required: "Obrigatório" })}
                             className="w-2/3 text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none pb-1"
                           />
                           <input
                             {...register("conselhoUf", { required: "Obrigatório" })}
                             className="w-1/3 text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none pb-1 uppercase"
                             maxLength={2}
                           />
                         </div>
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Número</p>
                         <input
                           {...register("conselhoNumero", { required: "Obrigatório" })}
                           className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none pb-1"
                         />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* BOTÕES DE AÇÃO - Movidos para FORA do Grid */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="py-4 px-8 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
               <FiX className="text-lg" /> Cancelar
            </button>

            <button
              type="submit"
              disabled={carregando}
              className="py-4 px-8 rounded-2xl text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600"
            >
              {carregando ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <><FiSave className="text-lg" /> Salvar Alterações</>
              )}
            </button>
          </div>

        </form>
      </main>

      
    </div>
  )};