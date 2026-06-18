import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiEdit2,
  FiSave,
  FiX,
  FiMapPin,
  FiHash,
  FiActivity,
  FiAward,
} from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { useApp } from "@contexts";
import { ESTADOS_BR } from "@utils";
import { clinicasServices } from "@services";

interface ClinicaFormData {
  nome: string;
  cnpj: string;
  tag: string;
  especialidade: string;
  uf: string;
  cidade: string;
}

export function ClinicaDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clinicas, notificar, refreshData } = useApp();

  const clinica = clinicas.find((c) => (c.clinicaId || c.id) === id);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, reset } = useForm<ClinicaFormData>();

  useEffect(() => {
    if (clinica) {
      reset({
        nome: clinica.nome || "",
        cnpj: clinica.cnpj || "",
        tag: clinica.tag || "",
        especialidade: clinica.especialidade || "",
        uf: clinica.uf || "",
        cidade: clinica.cidade || "",
      });
    }
  }, [clinica, reset]);

  useEffect(() => {
    if (!clinica && clinicas.length > 0) {
      navigate("/inicio-profissional", { replace: true });
      notificar("Clínica não encontrada.", "erro");
    }
  }, [clinica, clinicas, navigate, notificar]);

  const onSubmit = async (data: ClinicaFormData) => {
    setIsSubmitting(true);
    try {
      const idDaClinica = clinica.clinicaId || clinica.id;

      const payload = {
        nome: data.nome,
        especialidade: data.especialidade,
        uf: data.uf,
        cidade: data.cidade,
      };

      await clinicasServices.editarClinica(idDaClinica, payload);

      notificar("Dados da clínica atualizados com sucesso!", "sucesso");
      await refreshData();
      setIsEditing(false);
    } catch (error: any) {
      const msg = error.response?.data || "Erro ao atualizar a clínica.";
      notificar(typeof msg === "string" ? msg : "Erro de atualização.", "erro");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para navegar para a tela de Planos enviando o ID atual
  const handleAlterarPlano = () => {
    if (!clinica) return;
    const idDaClinica = clinica.clinicaId || clinica.id;
    navigate("/planos", { state: { clinicaIdParaAlteracao: idDaClinica } });
  };

  if (!clinica) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/50 pb-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-slate-900 rounded-b-[40px] z-0"></div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <h1 className="text-white font-bold text-lg tracking-wide">
            Configurações da Unidade
          </h1>
          <div className="w-11"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          <div className="p-8 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-3xl shadow-sm border border-emerald-100">
                <RiHospitalLine />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 leading-tight">
                  {clinica.nome}
                </h2>
                <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-1.5">
                  <FiHash className="text-emerald-500" /> {clinica.tag}
                </p>
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-3 text-slate-400 bg-white hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-100 rounded-xl transition-all shadow-sm active:scale-95"
                title="Editar dados"
              >
                <FiEdit2 className="text-lg" />
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 flex flex-col gap-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Especialidade Principal
                    </p>
                    <p className="text-base font-semibold text-slate-700 flex items-center gap-2">
                      <FiActivity className="text-slate-400" />{" "}
                      {clinica.especialidade || "Não informada"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Documento (CNPJ)
                    </p>
                    <p className="text-base font-semibold text-slate-700 flex items-center gap-2">
                      <FiHash className="text-slate-400" />{" "}
                      {clinica.cnpj || "Não informado"}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Localização
                    </p>
                    <p className="text-base font-semibold text-slate-700 flex items-center gap-2">
                      <FiMapPin className="text-slate-400" />{" "}
                      {clinica.cidade && clinica.uf
                        ? `${clinica.cidade} - ${clinica.uf}`
                        : "Endereço não configurado"}
                    </p>
                  </div>
                </div>

                {/* Secção de Gerir Plano */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <FiAward className="text-amber-500" /> Plano da Unidade
                    </p>
                    {clinica.planoNome ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-base font-bold text-slate-700">
                          {clinica.planoNome}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                            clinica.planoStatus === "ATIVA"
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : clinica.planoStatus === "VENCIDA"
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : "bg-rose-50 text-rose-600 border-rose-200"
                          }`}
                        >
                          {clinica.planoStatus === "ATIVA"
                            ? "Ativa"
                            : clinica.planoStatus === "VENCIDA"
                              ? "Vencida"
                              : clinica.planoStatus === "CANCELADA"
                                ? "Cancelada"
                                : clinica.planoStatus === "INADIMPLENTE"
                                  ? "Inadimplente"
                                  : clinica.planoStatus}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-slate-600">
                        Gerencie a assinatura e os limites para convidar novos
                        profissionais e pacientes.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleAlterarPlano}
                    className="shrink-0 px-5 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors shadow-md active:scale-95 text-sm"
                  >
                    Alterar Plano
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.form
                key="edit"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="p-8 bg-white"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Nome da Clínica
                    </label>
                    <input
                      {...register("nome", { required: "Obrigatório" })}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-colors text-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      CNPJ
                    </label>
                    <input
                      {...register("cnpj")}
                      disabled
                      className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-400 font-medium cursor-not-allowed"
                      title="O CNPJ não pode ser alterado."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Tag Única
                    </label>
                    <input
                      {...register("tag")}
                      disabled
                      className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-400 font-medium cursor-not-allowed"
                      title="A tag não pode ser alterada após a criação."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Especialidade
                    </label>
                    <input
                      {...register("especialidade", {
                        required: "Obrigatório",
                      })}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-colors text-slate-700 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Estado
                    </label>
                    <Controller
                      name="uf"
                      control={control}
                      rules={{ required: "Obrigatório" }}
                      render={({ field }) => (
                        <select
                          {...field}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-colors text-slate-700 font-medium"
                        >
                          <option value="" disabled>
                            Selecione...
                          </option>
                          {ESTADOS_BR.map((estado) => (
                            <option key={estado.sigla} value={estado.sigla}>
                              {estado.nome}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Cidade
                    </label>
                    <input
                      {...register("cidade", { required: "Obrigatório" })}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-colors text-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setIsEditing(false);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <FiX className="text-lg" /> Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-[2] py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <FiSave className="text-lg" /> Salvar Alterações
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

export default ClinicaDetalhesPage;
