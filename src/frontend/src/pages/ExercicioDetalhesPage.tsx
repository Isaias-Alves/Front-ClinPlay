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
import { VideoExercicio } from "@components";
import {
  extrairIdYoutube,
  validarUrlYoutube,
  validarNumero,
  atributosNumero,
} from "@utils";
import { nomeDoJogo, rotulosDosTempos } from "@games";

interface ExercicioFormData {
  nome: string;
  descricao: string;
  videoUrl: string;
  jogo: string;
  configPadrao: {
    vezes: number;
    repeticoes: number;
    tempoPrincipal: number;
    tempoSecundario: number;
    tempoDescanso: number;
    tempoIntervalo: number;
  };
}

/** Mensagem de erro do campo — `errors` não era lido nesta tela. */
const Erro = ({ mensagem }: { mensagem?: string }) =>
  mensagem ? (
    <p role="alert" className="mt-1.5 text-[11px] font-bold text-red-500">
      {mensagem}
    </p>
  ) : null;

export function ExercicioDetalhesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notificar } = useApp();

  // Recebe os dados exatos do clique na StartPage (sem precisar de API extra!)
  const exercicioDaMemoria = location.state?.exercicio;

  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ExercicioFormData>({ mode: "onBlur" });

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
        tempoPrincipal: exercicioDaMemoria.configPadrao?.tempoPrincipal || 0,
        tempoSecundario: exercicioDaMemoria.configPadrao?.tempoSecundario || 0,
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

  const currentFormValues = watch();
  const rotulos = rotulosDosTempos(
    currentFormValues.jogo,
    exercicioDaMemoria?.configPadrao?.acaoPrincipal,
    exercicioDaMemoria?.configPadrao?.acaoSecundaria,
  );
  const videoId = extrairIdYoutube(currentFormValues.videoUrl);

  // Se estiver sem dados na memória (antes do useEffect redirecionar), não renderiza nada para não quebrar
  if (!exercicioDaMemoria) return null;

  return (
    <div className="min-h-dvh bg-slate-100/50 pb-20 relative overflow-hidden">
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
                  Motor: {nomeDoJogo(currentFormValues.jogo)}
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
                          label: rotulos.principal.rotulo,
                          val: currentFormValues.configPadrao?.tempoPrincipal,
                          unit: "s",
                        },
                        {
                          label: rotulos.secundario.rotulo,
                          val: currentFormValues.configPadrao?.tempoSecundario,
                          unit: "s",
                        },
                        {
                          label: rotulos.descanso.rotulo,
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
                      <VideoExercicio url={currentFormValues.videoUrl} />
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
                noValidate
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
                        {...register("nome", {
                          required: "O nome é obrigatório",
                          maxLength: {
                            value: 100,
                            message: "Máximo de 100 caracteres",
                          },
                        })}
                        maxLength={100}
                        aria-invalid={!!errors.nome}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-colors text-slate-700 font-medium"
                      />
                      <Erro mensagem={errors.nome?.message} />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Motor do Jogo
                      </label>
                      {/*
                        O campo guarda o valor do enum (SUBMARINO), que é o
                        que o backend espera — mas era ele que aparecia na
                        tela. Agora o enum vai num input escondido e a caixa
                        visível mostra o nome legível do motor.
                      */}
                      <input type="hidden" {...register("jogo")} />
                      <p
                        className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3.5 font-medium text-slate-400"
                        title="O motor base não pode ser alterado após a criação."
                      >
                        {nomeDoJogo(currentFormValues.jogo)}
                      </p>
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
                        {...register("videoUrl", {
                          validate: validarUrlYoutube,
                        })}
                        aria-invalid={!!errors.videoUrl}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-colors text-slate-700 font-medium"
                      />
                      <Erro mensagem={errors.videoUrl?.message} />
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
                          {...atributosNumero("series")}
                          {...register("configPadrao.vezes", {
                            validate: (v) => validarNumero(v, "series"),
                          })}
                          aria-invalid={!!errors.configPadrao?.vezes}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        />
                        <Erro mensagem={errors.configPadrao?.vezes?.message} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Repetições
                        </label>
                        <input
                          {...atributosNumero("repeticoes")}
                          {...register("configPadrao.repeticoes", {
                            validate: (v) => validarNumero(v, "repeticoes"),
                          })}
                          aria-invalid={!!errors.configPadrao?.repeticoes}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        />
                        <Erro mensagem={errors.configPadrao?.repeticoes?.message} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {rotulos.principal.rotulo} (s)
                        </label>
                        <input
                          {...atributosNumero("tempoPrincipal")}
                          {...register("configPadrao.tempoPrincipal", {
                            validate: (v) => validarNumero(v, "tempoPrincipal"),
                          })}
                          aria-invalid={!!errors.configPadrao?.tempoPrincipal}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        />
                        <Erro mensagem={errors.configPadrao?.tempoPrincipal?.message} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {rotulos.secundario.rotulo} (s)
                        </label>
                        <input
                          {...atributosNumero("tempoSecundario")}
                          {...register("configPadrao.tempoSecundario", {
                            validate: (v) => validarNumero(v, "tempoSecundario"),
                          })}
                          aria-invalid={!!errors.configPadrao?.tempoSecundario}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        />
                        <Erro mensagem={errors.configPadrao?.tempoSecundario?.message} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {rotulos.descanso.rotulo} (s)
                        </label>
                        <input
                          {...atributosNumero("tempoDescanso")}
                          {...register("configPadrao.tempoDescanso", {
                            validate: (v) => validarNumero(v, "tempoDescanso"),
                          })}
                          aria-invalid={!!errors.configPadrao?.tempoDescanso}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        />
                        <Erro mensagem={errors.configPadrao?.tempoDescanso?.message} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Intervalo Séries (s)
                        </label>
                        <input
                          {...atributosNumero("tempoDescanso")}
                          {...register("configPadrao.tempoIntervalo", {
                            validate: (v) => validarNumero(v, "tempoDescanso"),
                          })}
                          aria-invalid={!!errors.configPadrao?.tempoIntervalo}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                        />
                        <Erro mensagem={errors.configPadrao?.tempoIntervalo?.message} />
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
