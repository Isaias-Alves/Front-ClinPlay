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
  FiSliders,
  FiPlay,
} from "react-icons/fi";
import { useApp } from "@contexts";

interface ExercicioFormData {
  nome: string;
  descricao: string;
  videoUrl: string;
  jogo: string;
  configPadrao: {
    vezes: number;
    repeticoes: number;
    tempoAcao: number;
    tempoSub: number;
    tempoDescanso: number;
    tempoIntervalo: number;
  };
}

export function ExercicioDetalhesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notificar } = useApp();

  // Recebe os dados exatos do clique na StartPage (sem precisar de API extra!)
  const exercicioDaMemoria = location.state?.exercicio;

  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm<ExercicioFormData>();

  useEffect(() => {
    // Se o utilizador der F5 e perder a memória, volta para o início de forma segura
    if (!exercicioDaMemoria) {
      navigate("/inicio-profissional", { replace: true });
      return;
    }

    // Preenche o formulário imediatamente com os dados da memória
    reset({
      nome: exercicioDaMemoria.nome,
      descricao: exercicioDaMemoria.descricao,
      videoUrl: exercicioDaMemoria.videoUrl,
      jogo: exercicioDaMemoria.jogo,
      configPadrao: {
        vezes: exercicioDaMemoria.configPadrao?.vezes || 0,
        repeticoes: exercicioDaMemoria.configPadrao?.repeticoes || 0,
        tempoAcao: exercicioDaMemoria.configPadrao?.tempoAcao || 0,
        tempoSub: exercicioDaMemoria.configPadrao?.tempoSub || 0,
        tempoDescanso: exercicioDaMemoria.configPadrao?.tempoDescanso || 0,
        tempoIntervalo: exercicioDaMemoria.configPadrao?.tempoIntervalo || 0,
      },
    });
  }, [exercicioDaMemoria, navigate, reset]);

  const onSubmit = async () => {
    // Como verificámos juntos, o backend ainda não possui a rota PUT para editar exercícios.
    // Assim, deixamos o layout pronto, mas bloqueamos o envio para evitar erros 404/401.
    notificar(
      "A edição de exercícios ainda não foi implementada no servidor.",
      "erro",
    );
    setIsEditing(false);
  };

  const obterIdVideo = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*((youtu\.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[7] && match[7].length === 11 ? match[7] : null;
  };

  const currentFormValues = watch();
  const videoId = obterIdVideo(currentFormValues.videoUrl || "");

  // Se estiver sem dados na memória (antes do useEffect redirecionar), não renderiza nada para não quebrar
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
          <div className="p-8 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-3xl shadow-sm border border-blue-100">
                <FiPlay />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 leading-tight">
                  {currentFormValues.nome || "Exercício"}
                </h2>
                <p className="text-sm font-bold text-emerald-600 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                  Motor: {currentFormValues.jogo || "Indefinido"}
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
                className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8"
              >
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <FiMessageSquare /> Descrição
                    </h3>
                    <p className="text-sm font-medium text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {currentFormValues.descricao ||
                        "Nenhuma descrição fornecida."}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FiSliders /> Parâmetros Mecânicos
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          label: "Séries",
                          val: currentFormValues.configPadrao?.vezes,
                          unit: "x",
                        },
                        {
                          label: "Repetições",
                          val: currentFormValues.configPadrao?.repeticoes,
                          unit: "reps",
                        },
                        {
                          label: "Tempo de Ação",
                          val: currentFormValues.configPadrao?.tempoAcao,
                          unit: "s",
                        },
                        {
                          label: "Tempo Sub",
                          val: currentFormValues.configPadrao?.tempoSub,
                          unit: "s",
                        },
                        {
                          label: "Descanso",
                          val: currentFormValues.configPadrao?.tempoDescanso,
                          unit: "s",
                        },
                        {
                          label: "Intervalo",
                          val: currentFormValues.configPadrao?.tempoIntervalo,
                          unit: "s",
                        },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center"
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {item.label}
                          </span>
                          <span className="text-base font-bold text-slate-700">
                            {item.val}{" "}
                            <span className="text-xs font-medium text-slate-500">
                              {item.unit}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
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
                        frameBorder="0"
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
                className="p-8 bg-white"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-6">
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

                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FiSliders /> Parâmetros Mecânicos
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Séries (Vezes)
                        </label>
                        <input
                          type="number"
                          {...register("configPadrao.vezes")}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Repetições
                        </label>
                        <input
                          type="number"
                          {...register("configPadrao.repeticoes")}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          T. de Ação (s)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          {...register("configPadrao.tempoAcao")}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          T. Sub (s)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          {...register("configPadrao.tempoSub")}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
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
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Intervalo Séries (s)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          {...register("configPadrao.tempoIntervalo")}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      // Restaura os dados originais e volta ao modo leitura
                      reset({
                        nome: exercicioDaMemoria.nome,
                        descricao: exercicioDaMemoria.descricao,
                        videoUrl: exercicioDaMemoria.videoUrl,
                        jogo: exercicioDaMemoria.jogo,
                        configPadrao: exercicioDaMemoria.configPadrao,
                      });
                      setIsEditing(false);
                    }}
                    className="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <FiX className="text-lg" /> Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <FiSave className="text-lg" /> Salvar Alterações
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
