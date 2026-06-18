import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiSave,
  FiUser,
  FiAlignLeft,
  FiCalendar,
  FiBell,
  FiActivity,
} from "react-icons/fi";
import { useApp } from "@contexts";
import { clinicasServices } from "@services";
import { tratamentoServices } from "../services/tratamentoServices"; // Ajuste o caminho se necessário
import { SeletorPaciente } from "@components"; // Import do novo componente criado!

interface TratamentoFormData {
  clinPacienteId: string;
  descricao: string;
  inicio: string;
  fim: string; // <-- Novo campo adicionado para a UI
  lembreteConfig: {
    sequencia: boolean;
    exercicios: boolean;
  };
}

export function TratamentosFormPage() {
  const navigate = useNavigate();
  const { clinicaSelecionadaId, notificar, refreshData } = useApp();

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [carregandoPacientes, setCarregandoPacientes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<TratamentoFormData>({
    defaultValues: {
      inicio: new Date().toISOString().split("T")[0],
      fim: "",
      lembreteConfig: {
        sequencia: true,
        exercicios: true,
      },
    },
  });

  const lembreteSequencia = watch("lembreteConfig.sequencia");
  const lembreteExercicios = watch("lembreteConfig.exercicios");

  useEffect(() => {
    if (!clinicaSelecionadaId) {
      setCarregandoPacientes(false);
      return;
    }

    const buscarPacientes = async () => {
      try {
        const dados =
          await clinicasServices.listarPacientes(clinicaSelecionadaId);
        setPacientes(dados || []);
      } catch (error) {
        console.error("Erro ao buscar pacientes:", error);
        notificar("Não foi possível carregar os pacientes.", "erro");
      } finally {
        setCarregandoPacientes(false);
      }
    };

    buscarPacientes();
  }, [clinicaSelecionadaId, notificar]);

  const onSubmit = async (data: TratamentoFormData) => {
    if (!clinicaSelecionadaId) {
      notificar("Selecione uma clínica primeiro.", "erro");
      return;
    }
    setIsSubmitting(true);
    try {
      // O campo "fim" está a ser enviado aqui. Lembre o backend de adicionar no DTO!
      const payload = {
        clinPacienteId: data.clinPacienteId,
        descricao: data.descricao,
        inicio: data.inicio,
        fim: data.fim ? data.fim : null,
        lembreteConfig: {
          sequencia: data.lembreteConfig.sequencia,
          exercicios: data.lembreteConfig.exercicios,
        },
      };

      await tratamentoServices.criar(clinicaSelecionadaId, payload);
      notificar("Tratamento iniciado com sucesso!", "sucesso");
      await refreshData();
      navigate("/inicio-profissional");
    } catch (error: any) {
      const msg = error.response?.data || "Erro ao criar tratamento.";
      notificar(typeof msg === "string" ? msg : "Erro no cadastro.", "erro");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 p-4 sm:p-8 relative overflow-hidden">
      {/* Efeitos de Fundo Gamificados */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-400/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50 pointer-events-none"></div>

      <div className="max-w-3xl mx-auto relative z-10">
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 bg-white text-slate-500 hover:text-slate-800 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center gap-2 font-bold text-sm border border-slate-200"
          >
            <FiArrowLeft /> Voltar
          </button>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
        >
          <div className="p-8 sm:p-10 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-emerald-200">
              <FiActivity />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                Prescrever Tratamento
              </h1>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Vincule um protocolo de recuperação a um paciente da clínica.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="p-8 sm:p-10 space-y-8"
          >
            {/* Bloco 1: Seleção de Paciente */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FiUser className="text-lg" /> 1. Identificação do Paciente
              </h3>
              {carregandoPacientes ? (
                <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium text-slate-500">
                    Carregando base de pacientes...
                  </span>
                </div>
              ) : (
                <Controller
                  name="clinPacienteId"
                  control={control}
                  rules={{ required: "A seleção de um paciente é obrigatória" }}
                  render={({ field }) => (
                    <SeletorPaciente
                      pacientes={pacientes}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.clinPacienteId?.message}
                    />
                  )}
                />
              )}
            </div>

            {/* Bloco 2: Informações do Tratamento */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FiAlignLeft className="text-lg" /> 2. Detalhes Clínicos
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    OBJETIVO / NOME DO TRATAMENTO
                  </label>
                  <input
                    {...register("descricao", {
                      required: "A descrição é obrigatória",
                    })}
                    className={`w-full p-4 bg-slate-50 border rounded-xl outline-none text-sm transition-colors font-medium text-slate-700 ${
                      errors.descricao
                        ? "border-red-500 focus:border-red-500"
                        : "border-slate-200 focus:border-emerald-500"
                    }`}
                    placeholder="Ex: Reabilitação de Assoalho Pélvico - Fase 1"
                  />
                  {errors.descricao && (
                    <span className="text-red-500 text-[10px] font-bold mt-1.5 block">
                      {errors.descricao.message}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <FiCalendar /> DATA DE INÍCIO
                    </label>
                    <input
                      type="date"
                      {...register("inicio", { required: "Obrigatório" })}
                      className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-sm text-slate-700 font-medium transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <FiCalendar /> PREVISÃO DE ALTA (OPCIONAL)
                    </label>
                    <input
                      type="date"
                      {...register("fim")}
                      className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-sm text-slate-700 font-medium transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3: Configuração de Notificações */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FiBell className="text-lg" /> 3. Alertas e Gamificação
              </h3>
              <p className="text-[11px] text-slate-500 mb-4 font-medium">
                Selecione as automações que o aplicativo deve enviar ao
                telemóvel do paciente para manter o engajamento.
              </p>

              <div className="space-y-3">
                {/* Card Lembrete Sequência */}
                <label
                  className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all ${
                    lembreteSequencia
                      ? "bg-emerald-50/50 border-emerald-200 shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:border-emerald-200"
                  }`}
                >
                  <div className="flex flex-col pr-4">
                    <span className="text-sm font-bold text-slate-800">
                      Incentivo de Sequência (Ofensiva)
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 mt-1">
                      Envia parabéns pelos dias seguidos e avisa para não perder
                      o combo de exercícios.
                    </span>
                  </div>
                  <div
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${lembreteSequencia ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <input
                      type="checkbox"
                      {...register("lembreteConfig.sequencia")}
                      className="sr-only"
                    />
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 shadow-sm ${lembreteSequencia ? "translate-x-5" : "translate-x-1"}`}
                    />
                  </div>
                </label>

                {/* Card Lembrete Exercícios */}
                <label
                  className={`flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all ${
                    lembreteExercicios
                      ? "bg-emerald-50/50 border-emerald-200 shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:border-emerald-200"
                  }`}
                >
                  <div className="flex flex-col pr-4">
                    <span className="text-sm font-bold text-slate-800">
                      Lembrete de Exercícios Pendentes
                    </span>
                    <span className="text-[11px] font-medium text-slate-500 mt-1">
                      Avisa o paciente silenciosamente quando as pausas terminam
                      e os exercícios do dia estão liberados.
                    </span>
                  </div>
                  <div
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${lembreteExercicios ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <input
                      type="checkbox"
                      {...register("lembreteConfig.exercicios")}
                      className="sr-only"
                    />
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 shadow-sm ${lembreteExercicios ? "translate-x-5" : "translate-x-1"}`}
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Submissão */}
            <div className="pt-8">
              <button
                type="submit"
                disabled={isSubmitting || carregandoPacientes}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl shadow-lg shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-70 disabled:active:scale-100 group"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiSave className="text-xl group-hover:scale-110 transition-transform" />{" "}
                    Prescrever e Iniciar
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default TratamentosFormPage;
