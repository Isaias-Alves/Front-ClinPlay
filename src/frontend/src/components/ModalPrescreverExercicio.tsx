import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiX,
  FiSearch,
  FiActivity,
  FiSliders,
  FiSave,
} from "react-icons/fi";
import { formatarHorasParaHHMM, formatarHHMMParaHoras } from "@utils";
import { PatternFormat } from "react-number-format"; // IMPORT ADICIONADO AQUI!

interface ModalPrescreverExercicioProps {
  isOpen: boolean;
  onClose: () => void;
  exercicios: any[];
  carregando: boolean;
  onConfirm: (payload: any) => void;
}

export const ModalPrescreverExercicio: React.FC<
  ModalPrescreverExercicioProps
> = ({ isOpen, onClose, exercicios, carregando, onConfirm }) => {
  const [buscaExercicio, setBuscaExercicio] = useState("");
  const [exercicioParaPrescrever, setExercicioParaPrescrever] = useState<
    any | null
  >(null);

  const [formPrescricao, setFormPrescricao] = useState({
    objetivo: "",
    observacao: "Siga as instruções do exercício.",
    acaoPrincipal: "",
    acaoSecundaria: "",
    vezesAoDia: 1,
    series: 3,
    repeticoes: 10,
    diasInativo: 0,
    tempoInativo: "00:00",
    tempoPrincipal: 3,
    tempoSecundario: 3,
    tempoDescanso: 6,
  });

  // Limpa o estado interno sempre que o modal fechar
  useEffect(() => {
    if (!isOpen) {
      setBuscaExercicio("");
      setExercicioParaPrescrever(null);
    }
  }, [isOpen]);

  const exerciciosFiltrados = exercicios.filter(
    (ex) =>
      ex.nome.toLowerCase().includes(buscaExercicio.toLowerCase()) ||
      ex.jogo.toLowerCase().includes(buscaExercicio.toLowerCase()),
  );

  const handlePrepararPrescricao = (ex: any) => {
    setExercicioParaPrescrever(ex);
    setFormPrescricao({
      objetivo: "",
      observacao: "Siga as instruções do exercício.",
      acaoPrincipal: ex.configPadrao?.acaoPrincipal || "Contração",
      acaoSecundaria: ex.configPadrao?.acaoSecundaria || "Relaxamento",
      vezesAoDia: ex.configPadrao?.vezesAoDia ?? 1,
      series: ex.configPadrao?.series ?? 3,
      repeticoes: ex.configPadrao?.repeticoes ?? 10,
      diasInativo: ex.configPadrao?.diasInativo ?? 0,
      tempoInativo: formatarHorasParaHHMM(ex.configPadrao?.tempoInativo ?? 0),
      tempoPrincipal: ex.configPadrao?.tempoPrincipal ?? 3,
      tempoSecundario: ex.configPadrao?.tempoSecundario ?? 3,
      tempoDescanso: ex.configPadrao?.tempoDescanso ?? 6,
    });
  };

  const handleConfirmar = () => {
    if (!exercicioParaPrescrever) return;

    const payload = {
      exercicioId: exercicioParaPrescrever.id,
      objetivo: formPrescricao.objetivo,
      observacao: formPrescricao.observacao,
      disponivel: true,
      customizacao: {
        acaoPrincipal: formPrescricao.acaoPrincipal,
        acaoSecundaria: formPrescricao.acaoSecundaria,
        vezesAoDia: Number(formPrescricao.vezesAoDia),
        series: Number(formPrescricao.series),
        repeticoes: Number(formPrescricao.repeticoes),
        diasInativo: Number(formPrescricao.diasInativo),
        tempoInativo: formatarHHMMParaHoras(formPrescricao.tempoInativo),
        tempoPrincipal: Number(formPrescricao.tempoPrincipal),
        tempoSecundario: Number(formPrescricao.tempoSecundario),
        tempoDescanso: Number(formPrescricao.tempoDescanso),
      },
    };

    onConfirm(payload);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-md">
                  <FiPlus />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {exercicioParaPrescrever
                      ? "Parâmetros Mecânicos"
                      : "Acervo de Exercícios"}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                    {exercicioParaPrescrever
                      ? "Ajuste os limites do jogo."
                      : "Selecione a atividade para anexar."}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-white relative">
              <AnimatePresence mode="wait">
                {!exercicioParaPrescrever ? (
                  <motion.div
                    key="listagem"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6"
                  >
                    <div className="relative mb-6">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                      <input
                        type="text"
                        placeholder="Buscar por nome ou motor..."
                        value={buscaExercicio}
                        onChange={(e) => setBuscaExercicio(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl outline-none transition-colors text-sm font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {carregando ? (
                        <div className="col-span-full flex justify-center py-10">
                          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : exerciciosFiltrados.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-slate-400 text-sm font-medium">
                          Nenhum exercício encontrado.
                        </div>
                      ) : (
                        exerciciosFiltrados.map((ex) => (
                          <div
                            key={ex.id}
                            onClick={() => handlePrepararPrescricao(ex)}
                            className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer group"
                          >
                            <div className="min-w-0 pr-3">
                              <h4 className="text-sm font-bold text-slate-700 truncate group-hover:text-emerald-800">
                                {ex.nome}
                              </h4>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mt-1">
                                {ex.jogo}
                              </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-sm">
                              <FiPlus className="text-lg" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="formulario"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6 space-y-6"
                  >
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                          <FiActivity />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800">
                            {exercicioParaPrescrever.nome}
                          </h4>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">
                            Motor: {exercicioParaPrescrever.jogo}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setExercicioParaPrescrever(null)}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm"
                      >
                        Trocar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Objetivo Específico
                        </label>
                        <input
                          type="text"
                          value={formPrescricao.objetivo}
                          onChange={(e) =>
                            setFormPrescricao({
                              ...formPrescricao,
                              objetivo: e.target.value,
                            })
                          }
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                          placeholder="Ex: Aumentar resistência..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Ação Principal
                        </label>
                        <input
                          type="text"
                          value={formPrescricao.acaoPrincipal}
                          onChange={(e) =>
                            setFormPrescricao({
                              ...formPrescricao,
                              acaoPrincipal: e.target.value,
                            })
                          }
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Ação Secundária
                        </label>
                        <input
                          type="text"
                          value={formPrescricao.acaoSecundaria}
                          onChange={(e) =>
                            setFormPrescricao({
                              ...formPrescricao,
                              acaoSecundaria: e.target.value,
                            })
                          }
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                        />
                      </div>
                      <div className="md:col-span-2 pt-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Instrução ao Paciente (Nota)
                        </label>
                        <textarea
                          value={formPrescricao.observacao}
                          onChange={(e) =>
                            setFormPrescricao({
                              ...formPrescricao,
                              observacao: e.target.value,
                            })
                          }
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium h-20 resize-none"
                        ></textarea>
                      </div>
                    </div>

                    <div className="p-5 bg-slate-900 rounded-3xl text-white shadow-lg">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-700 pb-3">
                        <FiSliders /> Parâmetros do Motor
                      </h4>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {[
                          { label: "Sessões/Dia", key: "vezesAoDia" },
                          { label: "Séries", key: "series" },
                          { label: "Reps", key: "repeticoes" },
                          {
                            label: "T. Princ (s)",
                            key: "tempoPrincipal",
                            step: "0.1",
                          },
                          {
                            label: "T. Sec (s)",
                            key: "tempoSecundario",
                            step: "0.1",
                          },
                          {
                            label: "Pausa (s)",
                            key: "tempoDescanso",
                            step: "0.1",
                          },
                        ].map((campo) => (
                          <div
                            key={campo.key}
                            className="bg-slate-800 p-2 rounded-xl border border-slate-700"
                          >
                            <label className="block text-[9px] font-bold text-slate-400 uppercase text-center mb-1">
                              {campo.label}
                            </label>
                            <input
                              type="number"
                              step={campo.step}
                              value={(formPrescricao as any)[campo.key]}
                              onChange={(e) =>
                                setFormPrescricao({
                                  ...formPrescricao,
                                  [campo.key]: Number(e.target.value),
                                })
                              }
                              className="w-full p-2 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg outline-none text-center font-bold text-white text-sm"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2">
                            Intervalo Dias (A cada X dias)
                          </label>
                          <input
                            type="number"
                            value={formPrescricao.diasInativo}
                            onChange={(e) =>
                              setFormPrescricao({
                                ...formPrescricao,
                                diasInativo: Number(e.target.value),
                              })
                            }
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg outline-none font-bold text-white"
                          />
                        </div>

                        {/* ========================================================= */}
                        {/* MÁSCARA APLICADA PARA REMOVER A INTROMISSÃO DO NAVEGADOR  */}
                        {/* ========================================================= */}
                        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2">
                            Pausa Diária (Duração)
                          </label>
                          <PatternFormat
                            format="##:##"
                            mask="_"
                            value={formPrescricao.tempoInativo}
                            onValueChange={(values) =>
                              setFormPrescricao({
                                ...formPrescricao,
                                tempoInativo: values.formattedValue,
                              })
                            }
                            placeholder="00:00"
                            className="w-full p-2.5 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg outline-none font-bold text-white text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                      <button
                        onClick={() => setExercicioParaPrescrever(null)}
                        className="w-full sm:flex-1 py-4 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-95"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmar}
                        className="w-full sm:flex-2 py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        <FiSave className="text-xl shrink-0" /> Confirmar
                        Prescrição
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
