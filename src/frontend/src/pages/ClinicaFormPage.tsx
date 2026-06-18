import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiCheck,
  FiInfo,
  FiChevronDown,
  FiPlus,
} from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { clinicasServices, assinaturaServices } from "@services";
import { useApp } from "@contexts";
import { ESTADOS_BR, ESPECIALIDADES } from "@utils";

interface ClinicaFormData {
  nome: string;
  cnpj: string;
  tag: string;
  especialidade: string;
  uf: string;
  cidade: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 26 },
  },
};

const ValidIcon = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0 }}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500"
  >
    <FiCheck className="text-xl" />
  </motion.div>
);

export function ClinicaFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notificar, refreshData } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formProgress, setFormProgress] = useState(0);

  // Captura o plano e a validade escolhidos
  const planoId = location.state?.planoId;
  const validade = location.state?.validade;

  useEffect(() => {
    if (!planoId || !validade) {
      notificar(
        "Configuração de plano inválida. Selecione o plano novamente.",
        "erro",
      );
      navigate("/planos", { replace: true });
    }
  }, [planoId, validade, navigate, notificar]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, touchedFields },
  } = useForm<ClinicaFormData>({
    mode: "onChange",
    defaultValues: { tag: "@", uf: "" },
  });

  const formValues = watch();

  useEffect(() => {
    const camposObrigatorios = [
      "nome",
      "cnpj",
      "especialidade",
      "tag",
      "uf",
      "cidade",
    ] as const;
    const camposPreenchidos = camposObrigatorios.filter((campo) => {
      const valor = formValues[campo];
      if (campo === "uf") return valor !== "";
      if (campo === "cnpj") return valor?.replace(/\D/g, "").length >= 14;
      if (campo === "tag") return valor?.length > 2 && valor !== "@";
      return valor?.trim().length > 0 && !errors[campo];
    });
    setFormProgress(
      (camposPreenchidos.length / camposObrigatorios.length) * 100,
    );
  }, [formValues, errors]);

  const aplicarMascaraCNPJ = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  const formatarTag = (value: string) => {
    let limpa = value.replace(/[^a-zA-Z0-9_.]/g, "");
    if (!limpa.startsWith("@")) limpa = "@" + limpa.replace(/@/g, "");
    return limpa.toLowerCase().slice(0, 25);
  };

  // Encadeamento perfeito das APIs
  const onSubmit = async (data: ClinicaFormData) => {
    setIsSubmitting(true);
    try {
      const cnpjLimpo = data.cnpj.replace(/\D/g, "");

      // 1. Cria a Clínica
      const novaClinica = await clinicasServices.criarClinica({
        ...data,
        cnpj: cnpjLimpo,
      });

      // Captura o ID retornado (o backend retorna o objeto criado)
      const clinicaIdReal = novaClinica.id || novaClinica.clinicaId;

      // 2. Se houver plano e validade, faz a adesão IMEDIATAMENTE
      if (planoId && validade) {
        await assinaturaServices.aderir(clinicaIdReal, {
          planoId: planoId,
          validade: validade,
        });
      }

      notificar("Clínica criada e plano vinculado com sucesso!", "sucesso");
      await refreshData();
      navigate("/inicio-profissional", { replace: true });
    } catch (error: any) {
      const msg = error.response?.data || "Erro ao processar a criação.";
      notificar(
        typeof msg === "string" ? msg : "Erro ao processar ativação.",
        "erro",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/50 flex flex-col items-center p-4 sm:p-8 relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/15 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], x: [0, -50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"
      />

      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 max-w-2xl relative z-10"
      >
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2 tracking-tight">
          Registrar Unidade
        </h1>
        <p className="text-slate-500 font-medium text-sm">
          Configure os dados da sua nova clínica com o ClinPlay
        </p>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl shadow-emerald-900/10 relative z-10 overflow-hidden border border-slate-100"
      >
        <div className="absolute top-0 left-0 h-1.5 w-full bg-slate-100">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${formProgress}%` }}
            className="h-full bg-emerald-500"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        <div className="p-8 sm:p-12">
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div
              className="md:col-span-2 space-y-2 mb-2"
              variants={itemVariants}
            >
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <RiHospitalLine /> Dados de Identificação
              </h3>
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="relative group md:col-span-2"
            >
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Nome da Unidade
              </label>
              <div className="relative">
                <input
                  {...register("nome", {
                    required: "O nome é obrigatório",
                    maxLength: 100,
                  })}
                  placeholder="Ex: Clínica Movimento Fisioterapia"
                  className={`w-full p-4 bg-slate-50 border ${errors.nome ? "border-red-400 focus:ring-red-400 focus:shadow-red-50" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 focus:shadow-emerald-50"} rounded-2xl outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium text-slate-700`}
                />
                <AnimatePresence>
                  {touchedFields.nome && !errors.nome && <ValidIcon />}
                </AnimatePresence>
              </div>
              {errors.nome && (
                <span className="text-red-500 text-xs font-semibold mt-1 block">
                  {errors.nome.message}
                </span>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="relative group">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                CNPJ
              </label>
              <div className="relative">
                <input
                  {...register("cnpj", {
                    required: "CNPJ é obrigatório",
                    minLength: { value: 18, message: "CNPJ incompleto" },
                    pattern: {
                      value: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
                      message: "CNPJ inválido",
                    },
                  })}
                  onChange={(e) =>
                    setValue("cnpj", aplicarMascaraCNPJ(e.target.value), {
                      shouldValidate: true,
                    })
                  }
                  placeholder="00.000.000/0000-00"
                  className={`w-full p-4 bg-slate-50 border ${errors.cnpj ? "border-red-400 focus:ring-red-400 focus:shadow-red-50" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 focus:shadow-emerald-50"} rounded-2xl outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium text-slate-700`}
                />
                <AnimatePresence>
                  {touchedFields.cnpj && !errors.cnpj && <ValidIcon />}
                </AnimatePresence>
              </div>
              {errors.cnpj && (
                <span className="text-red-500 text-xs font-semibold mt-1 block">
                  {errors.cnpj.message}
                </span>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="relative group">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Especialidade Principal
              </label>
              <div className="relative">
                <select
                  {...register("especialidade", {
                    required: "A especialidade é obrigatória",
                  })}
                  className={`w-full p-4 bg-slate-50 border ${errors.especialidade ? "border-red-400 focus:ring-red-400 focus:shadow-red-50" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 focus:shadow-emerald-50"} rounded-2xl outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium text-slate-700 appearance-none`}
                >
                  <option value="">Selecione a especialidade</option>
                  {ESPECIALIDADES.map((esp) => (
                    <option key={esp} value={esp}>
                      {esp}
                    </option>
                  ))}
                </select>
                <AnimatePresence>
                  {touchedFields.especialidade && !errors.especialidade && (
                    <ValidIcon />
                  )}
                </AnimatePresence>
              </div>
              {errors.especialidade && (
                <span className="text-red-500 text-xs font-semibold mt-1 block">
                  {errors.especialidade.message}
                </span>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="relative group">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center justify-between">
                Tag Única{" "}
                <FiInfo
                  className="text-slate-400"
                  title="Utilizada para pacientes localizarem sua unidade através do seletor."
                />
              </label>
              <div className="relative">
                <input
                  {...register("tag", {
                    required: "A tag é obrigatória",
                    pattern: {
                      value: /^@[a-zA-Z0-9_.]{3,24}$/,
                      message: "Formato inválido. Use letras, números, . ou _",
                    },
                  })}
                  onChange={(e) =>
                    setValue("tag", formatarTag(e.target.value), {
                      shouldValidate: true,
                    })
                  }
                  placeholder="@suaclinica"
                  className={`w-full p-4 bg-slate-50 border ${errors.tag ? "border-red-400 focus:ring-red-400 focus:shadow-red-50" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 focus:shadow-emerald-50"} rounded-2xl outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium text-slate-700`}
                />
                <AnimatePresence>
                  {touchedFields.tag &&
                    !errors.tag &&
                    formValues.tag !== "@" && <ValidIcon />}
                </AnimatePresence>
              </div>
              {errors.tag && (
                <span className="text-red-500 text-xs font-semibold mt-1 block tracking-tight">
                  {errors.tag.message}
                </span>
              )}
            </motion.div>

            <motion.div
              className="md:col-span-2 space-y-2 mt-2 mb-2"
              variants={itemVariants}
            >
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                Localização
              </h3>
            </motion.div>

            <motion.div variants={itemVariants} className="relative group">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Estado (UF)
              </label>
              <div className="relative">
                <Controller
                  name="uf"
                  control={control}
                  rules={{ required: "Selecione o estado" }}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`w-full p-4 bg-slate-50 border ${errors.uf ? "border-red-400 focus:ring-red-400 focus:shadow-red-50" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 focus:shadow-emerald-50"} rounded-2xl outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium text-slate-700 appearance-none`}
                    >
                      <option value="" disabled>
                        Selecione o Estado...
                      </option>
                      {ESTADOS_BR.map((estado) => (
                        <option key={estado.sigla} value={estado.sigla}>
                          {estado.sigla} - {estado.nome}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <AnimatePresence>
                  {formValues.uf && <ValidIcon />}
                </AnimatePresence>
              </div>
              {errors.uf && (
                <span className="text-red-500 text-xs font-semibold mt-1 block">
                  {errors.uf.message}
                </span>
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="relative group">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Cidade
              </label>
              <div className="relative">
                <input
                  {...register("cidade", {
                    required: "A cidade é obrigatória",
                  })}
                  placeholder="Ex: Belo Horizonte"
                  className={`w-full p-4 bg-slate-50 border ${errors.cidade ? "border-red-400 focus:ring-red-400 focus:shadow-red-50" : "border-slate-200 focus:border-emerald-500 focus:ring-emerald-500 focus:shadow-emerald-50"} rounded-2xl outline-none focus:ring-2 focus:ring-opacity-20 transition-all font-medium text-slate-700`}
                />
                <AnimatePresence>
                  {touchedFields.cidade && !errors.cidade && <ValidIcon />}
                </AnimatePresence>
              </div>
              {errors.cidade && (
                <span className="text-red-500 text-xs font-semibold mt-1 block">
                  {errors.cidade.message}
                </span>
              )}
            </motion.div>

            <motion.div
              variants={itemVariants}
              className="md:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8"
            >
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-all active:scale-95"
              >
                <FiArrowLeft className="text-base" /> Voltar para Planos
              </button>

              <button
                type="submit"
                disabled={isSubmitting || formProgress < 100}
                className={`flex items-center justify-center gap-3 px-10 py-4 rounded-2xl text-base font-bold transition-all shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${formProgress === 100 ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200" : "bg-slate-300 text-slate-600 shadow-none"}`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{" "}
                    Salvando dados...
                  </>
                ) : (
                  <>
                    <FiPlus className="text-xl" /> Concluir e Ativar Clínica
                  </>
                )}
              </button>
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}

export default ClinicaFormPage;
