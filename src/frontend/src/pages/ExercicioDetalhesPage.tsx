import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiEdit2,
  FiSave,
  FiX,
  FiYoutube,
  FiMessageSquare,
  FiPlay,
  FiActivity,
  FiCalendar,
} from "react-icons/fi";
import { useApp } from "@contexts";
import { exerciciosServices } from "@services";
import { formatarHorasParaHHMM, formatarHHMMParaHoras } from "@utils";

interface ExercicioFormData {
  nome: string;
  descricao: string;
  videoUrl: string;
  jogo: string;
  tempoInativoForm: string;
  configPadrao: {
    acaoPrincipal: string;
    acaoSecundaria: string;
    vezesAoDia: number;
    series: number;
    repeticoes: number;
    tempoPrincipal: number;
    tempoSecundario: number;
    tempoDescanso: number;
    diasInativo: number;
  };
}

const buildReset = (ex: any) => ({
  nome: ex.nome,
  descricao: ex.descricao,
  videoUrl: ex.videoUrl,
  jogo: ex.jogo,
  tempoInativoForm: formatarHorasParaHHMM(ex.configPadrao?.tempoInativo ?? 0),
  configPadrao: {
    acaoPrincipal: ex.configPadrao?.acaoPrincipal ?? "",
    acaoSecundaria: ex.configPadrao?.acaoSecundaria ?? "",
    vezesAoDia: ex.configPadrao?.vezesAoDia ?? 1,
    series: ex.configPadrao?.series ?? 0,
    repeticoes: ex.configPadrao?.repeticoes ?? 0,
    tempoPrincipal: ex.configPadrao?.tempoPrincipal ?? 0,
    tempoSecundario: ex.configPadrao?.tempoSecundario ?? 0,
    tempoDescanso: ex.configPadrao?.tempoDescanso ?? 0,
    diasInativo: ex.configPadrao?.diasInativo ?? 0,
  },
});

export function ExercicioDetalhesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notificar } = useApp();

  const exercicioDaMemoria = location.state?.exercicio;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm<ExercicioFormData>();

  useEffect(() => {
    if (!exercicioDaMemoria) {
      navigate("/inicio-profissional", { replace: true });
      return;
    }
    reset(buildReset(exercicioDaMemoria));
  }, [exercicioDaMemoria, navigate, reset]);

  const onSubmit = async (data: ExercicioFormData) => {
    setIsSaving(true);
    try {
      const { jogo, tempoInativoForm, configPadrao, ...rest } = data;
      const payload = {
        ...rest,
        configPadrao: {
          ...configPadrao,
          vezesAoDia: Number(configPadrao.vezesAoDia),
          series: Number(configPadrao.series),
          repeticoes: Number(configPadrao.repeticoes),
          diasInativo: Number(configPadrao.diasInativo),
          tempoInativo: formatarHHMMParaHoras(tempoInativoForm),
        },
      };
      await exerciciosServices.atualizar(exercicioDaMemoria.id, payload);
      notificar("Exercício atualizado com sucesso!", "sucesso");
      setIsEditing(false);
    } catch {
      notificar("Erro ao salvar as alterações. Verifique suas permissões.", "erro");
    } finally {
      setIsSaving(false);
    }
  };

  const obterIdVideo = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*((youtu\.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7] && match[7].length === 11 ? match[7] : null;
  };

  const v = watch();
  const videoId = obterIdVideo(v.videoUrl || "");

  if (!exercicioDaMemoria) return null;

  return (
    <div className="min-h-screen bg-slate-100/50 pb-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-slate-900 rounded-b-[40px] z-0"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <h1 className="text-white font-bold text-lg tracking-wide">
            Gerir Exercício
          </h1>
          <div className="w-11"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          {/* Cabeçalho */}
          <div className="p-8 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-3xl shadow-sm border border-blue-100">
                <FiPlay />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 leading-tight">
                  {v.nome || "Exercício"}
                </h2>
                <p className="text-sm font-bold text-emerald-600 mt-1 uppercase tracking-widest">
                  Motor: {v.jogo || "Indefinido"}
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
              // ==========================================
              // MODO VISUALIZAÇÃO
              // ==========================================
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-8 space-y-8"
              >
                {/* Descrição */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FiMessageSquare /> Descrição
                  </h3>
                  <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {v.descricao || "Nenhuma descrição fornecida."}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Parâmetros do Jogo */}
                  <div>
                    <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FiActivity /> Parâmetros do Jogo
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Ação Principal", val: v.configPadrao?.acaoPrincipal, unit: "" },
                        { label: "Ação Secundária", val: v.configPadrao?.acaoSecundaria, unit: "" },
                        { label: "Séries", val: v.configPadrao?.series, unit: "x" },
                        { label: "Repetições", val: v.configPadrao?.repeticoes, unit: "reps" },
                        { label: "T. de Ação", val: v.configPadrao?.tempoPrincipal, unit: "s" },
                        { label: "T. Sub", val: v.configPadrao?.tempoSecundario, unit: "s" },
                        { label: "Descanso", val: v.configPadrao?.tempoDescanso, unit: "s" },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                          <span className="text-base font-bold text-slate-700">
                            {item.val || "—"}{" "}
                            <span className="text-xs font-medium text-slate-500">{item.unit}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Parâmetros de Rotina */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <FiCalendar /> Parâmetros de Rotina
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Execuções/Dia</span>
                          <span className="text-base font-bold text-slate-700">{v.configPadrao?.vezesAoDia ?? "—"} <span className="text-xs font-medium text-slate-500">x</span></span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pausa entre Sessões</span>
                          <span className="text-base font-bold text-slate-700">{v.tempoInativoForm || "00:00"}</span>
                        </div>
                        <div className="col-span-2 p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intervalo de Dias</span>
                          <span className="text-base font-bold text-slate-700">
                            {v.configPadrao?.diasInativo === 0
                              ? "Todos os dias"
                              : v.configPadrao?.diasInativo === 1
                              ? "Dia sim, dia não"
                              : v.configPadrao?.diasInativo === 2
                              ? "A cada 3 dias"
                              : v.configPadrao?.diasInativo === 6
                              ? "Uma vez por semana"
                              : `A cada ${(v.configPadrao?.diasInativo ?? 0) + 1} dias`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vídeo */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <FiYoutube className="text-red-500" /> Vídeo de Instrução
                      </h3>
                      {videoId ? (
                        <div className="overflow-hidden rounded-2xl shadow-sm border border-slate-200 bg-black aspect-video">
                          <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            style={{ border: 0 }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-sm font-medium text-slate-400 aspect-video flex flex-col items-center justify-center">
                          <FiYoutube className="text-3xl text-slate-300 mb-2" />
                          Nenhum vídeo vinculado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              // ==========================================
              // MODO EDIÇÃO
              // ==========================================
              <motion.form
                key="edit"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="p-8 bg-white space-y-8"
              >
                {/* Seção: Informações gerais */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Nome do Exercício
                      </label>
                      <input
                        {...register("nome", { required: "Obrigatório" })}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-colors text-slate-700 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Motor do Jogo
                      </label>
                      <input
                        {...register("jogo")}
                        disabled
                        className="w-full p-3.5 bg-slate-100 border border-slate-200 rounded-xl outline-none text-slate-400 font-medium cursor-not-allowed"
                        title="O motor base não pode ser alterado após a criação."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Descrição (Instruções)
                      </label>
                      <textarea
                        {...register("descricao")}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-colors text-slate-700 font-medium h-24 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <FiYoutube className="text-red-500" /> URL do YouTube
                      </label>
                      <input
                        {...register("videoUrl")}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-colors text-slate-700 font-medium"
                      />
                    </div>
                  </div>

                  {/* Seção: Parâmetros do Jogo */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                      <FiActivity /> Parâmetros do Jogo
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Texto da Ação Principal
                        </label>
                        <input
                          type="text"
                          {...register("configPadrao.acaoPrincipal")}
                          placeholder="Ex: Contraia"
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 font-medium text-slate-700"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Texto da Ação Secundária
                        </label>
                        <input
                          type="text"
                          {...register("configPadrao.acaoSecundaria")}
                          placeholder="Ex: Relaxe"
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400 font-medium text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Séries
                        </label>
                        <input
                          type="number"
                          {...register("configPadrao.series")}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Repetições
                        </label>
                        <input
                          type="number"
                          {...register("configPadrao.repeticoes")}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          T. de Ação (s)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          {...register("configPadrao.tempoPrincipal")}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          T. Sub (s)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          {...register("configPadrao.tempoSecundario")}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Descanso (s)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          {...register("configPadrao.tempoDescanso")}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção: Parâmetros de Rotina */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                    <FiCalendar /> Parâmetros de Rotina
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Execuções por Dia
                      </label>
                      <input
                        type="number"
                        {...register("configPadrao.vezesAoDia")}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-slate-700 text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Intervalo de Dias
                      </label>
                      <select
                        {...register("configPadrao.diasInativo")}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-semibold text-slate-700 appearance-none cursor-pointer"
                      >
                        <option value={0}>Todos os dias</option>
                        <option value={1}>Dia sim, dia não</option>
                        <option value={2}>A cada 3 dias</option>
                        <option value={6}>Uma vez por semana</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Pausa entre Sessões (HH:MM)
                      </label>
                      <input
                        type="text"
                        placeholder="02:30"
                        maxLength={5}
                        {...register("tempoInativoForm", {
                          pattern: {
                            value: /^\d{1,2}:\d{2}$/,
                            message: "Use o formato HH:MM",
                          },
                        })}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-center tracking-widest placeholder:text-slate-300 placeholder:font-normal"
                      />
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      reset(buildReset(exercicioDaMemoria));
                      setIsEditing(false);
                    }}
                    className="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <FiX className="text-lg" /> Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-[2] py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-bold rounded-xl shadow-md shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

export default ExercicioDetalhesPage;
