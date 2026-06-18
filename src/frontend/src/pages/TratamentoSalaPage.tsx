import React, { useReducer, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useTratamentoSocket } from "../hooks/useTratamentoSocket";
import { useApp } from "@contexts";
import { clinicasServices, tratamentoServices } from "@services";
import { ModalPrescreverExercicio } from "@components"; // <-- IMPORT DO NOVO MODAL
import {
  FiArrowLeft,
  FiPlus,
  FiActivity,
  FiClock,
  FiSettings,
  FiX,
  FiCalendar,
  FiBell,
  FiSave,
  FiMessageSquare,
  FiStar,
  FiPower,
  FiCheck,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

type EstadoSala = {
  tratamento: any | null;
  carregando: boolean;
};

function salaReducer(estado: EstadoSala, evento: any): EstadoSala {
  switch (evento.evento) {
    case "ESTADO_ATUAL":
      return { ...estado, tratamento: evento.tratamento, carregando: false };
    case "TRATAMENTO_EDITADO":
      return {
        ...estado,
        tratamento: estado.tratamento
          ? { ...estado.tratamento, ...evento.tratamento }
          : null,
      };
    case "PRESCRICAO_ADICIONADA":
      return {
        ...estado,
        tratamento: estado.tratamento
          ? {
              ...estado.tratamento,
              prescricoes: [
                ...estado.tratamento.prescricoes,
                evento.prescricao,
              ].sort((a: any, b: any) => a.ordem - b.ordem),
            }
          : null,
      };
    case "PRESCRICAO_REMOVIDA":
      return {
        ...estado,
        tratamento: estado.tratamento
          ? {
              ...estado.tratamento,
              prescricoes: estado.tratamento.prescricoes.filter(
                (p: any) => p.id !== evento.prescricaoId,
              ),
            }
          : null,
      };
    case "FEEDBACK_CRIADO":
      return {
        ...estado,
        tratamento: estado.tratamento
          ? {
              ...estado.tratamento,
              progresso: evento.progresso,
              ultimaAcao: evento.ultimaAcao,
              prescricoes: estado.tratamento.prescricoes.map((p: any) =>
                p.id === evento.feedback.prescricaoId
                  ? {
                      ...p,
                      feedbacks: [...(p.feedbacks || []), evento.feedback],
                    }
                  : p,
              ),
            }
          : null,
      };
    case "FEEDBACK_VISTO":
      return {
        ...estado,
        tratamento: estado.tratamento
          ? {
              ...estado.tratamento,
              prescricoes: estado.tratamento.prescricoes.map((p: any) => ({
                ...p,
                feedbacks: p.feedbacks?.map((f: any) =>
                  f.id === evento.feedbackId ? { ...f, visto: true } : f,
                ),
              })),
            }
          : null,
      };
    default:
      return estado;
  }
}

export function TratamentoSalaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { clinicaSelecionadaId, notificar } = useApp();

  const tratamentoBase = location.state?.tratamentoBase;

  const [estado, dispatch] = useReducer(salaReducer, {
    tratamento: tratamentoBase || null,
    carregando: true,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exerciciosClinica, setExerciciosClinica] = useState<any[]>([]);
  const [carregandoExercicios, setCarregandoExercicios] = useState(false);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [editDescricao, setEditDescricao] = useState("");
  const [editFim, setEditFim] = useState("");
  const [editLembreteSeq, setEditLembreteSeq] = useState(false);
  const [editLembreteEx, setEditLembreteEx] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const { enviar } = useTratamentoSocket(id!, {
    onEvento: (evento) => {
      dispatch(evento);
      if (evento.evento === "PRESCRICAO_ADICIONADA")
        notificar("Exercício anexado com sucesso!", "sucesso");
      else if (evento.evento === "PRESCRICAO_REMOVIDA")
        notificar("Prescrição removida do tratamento.", "sucesso");
      else if (evento.evento === "TRATAMENTO_EDITADO")
        notificar("Configurações atualizadas!", "sucesso");
      else if (evento.evento === "FEEDBACK_CRIADO")
        notificar("O paciente enviou um novo feedback!", "sucesso");
    },
    onErro: (erro) => notificar(erro.mensagem || "Erro na operação.", "erro"),
  });

  const t = estado.tratamento;

  const handleFinalizarTratamento = async () => {
    if (!id) return;
    if (
      !window.confirm(
        "Tem certeza que deseja finalizar este tratamento? O paciente não poderá mais realizar exercícios vinculados a este protocolo.",
      )
    )
      return;
    setIsFinalizando(true);
    try {
      await tratamentoServices.finalizar(id);
      notificar("Tratamento finalizado com sucesso!", "sucesso");
      navigate("/inicio-profissional");
    } catch (error: any) {
      notificar(
        error.response?.data || "Não foi possível finalizar o tratamento.",
        "erro",
      );
    } finally {
      setIsFinalizando(false);
    }
  };

  const todosFeedbacks = useMemo(() => {
    if (!t?.prescricoes) return [];
    const unificados = t.prescricoes.flatMap((p: any) => {
      if (!p.feedbacks) return [];
      return p.feedbacks.map((f: any) => ({
        ...f,
        exercicioNome: p.exercicioNome,
        prescricaoId: p.id,
      }));
    });
    return unificados.sort(
      (a: any, b: any) =>
        new Date(b.quando).getTime() - new Date(a.quando).getTime(),
    );
  }, [t?.prescricoes]);

  const abrirModalExercicios = async () => {
    setIsModalOpen(true);
    if (!clinicaSelecionadaId) {
      notificar("Selecione uma clínica no topo da página.", "erro");
      return;
    }
    setCarregandoExercicios(true);
    try {
      const dados =
        await clinicasServices.listarExercicios(clinicaSelecionadaId);
      setExerciciosClinica(dados || []);
    } catch (error) {
      notificar("Erro ao carregar a lista de exercícios.", "erro");
    } finally {
      setCarregandoExercicios(false);
    }
  };

  const handleConfirmarPrescricao = (payload: any) => {
    enviar({
      tipo: "ADICIONAR_PRESCRICAO",
      ...payload,
    });
    setIsModalOpen(false);
  };

  const handleRemoverPrescricao = (prescricaoId: string) => {
    if (confirm("Tem a certeza que deseja remover esta prescrição?")) {
      enviar({ tipo: "REMOVER_PRESCRICAO", prescricaoId });
    }
  };

  const abrirModalConfig = () => {
    if (!t) return;
    setEditDescricao(t.descricao || "");
    setEditFim(t.fim || "");
    setEditLembreteSeq(t.lembreteConfig?.sequencia ?? true);
    setEditLembreteEx(t.lembreteConfig?.exercicios ?? true);
    setIsConfigModalOpen(true);
  };

  const handleSalvarConfig = () => {
    enviar({
      tipo: "EDITAR_TRATAMENTO",
      descricao: editDescricao,
      fim: editFim || null,
      lembreteConfig: {
        sequencia: editLembreteSeq,
        exercicios: editLembreteEx,
      },
    });
    setIsConfigModalOpen(false);
  };

  const handleMarcarVisto = (feedbackId: string) => {
    enviar({ tipo: "MARCAR_FEEDBACK_VISTO", feedbackId });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative overflow-hidden">
      {/* BACKGROUND GAMIFICADO COM ESFERAS E GRID */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
      <div className="fixed top-[-10%] left-[-5%] w-96 h-96 bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse pointer-events-none z-0"></div>
      <div
        className="fixed bottom-[10%] right-[-5%] w-96 h-96 bg-blue-400/10 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse pointer-events-none z-0"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* HEADER GAMIFICADO DA SALA (GLASSMORPHISM) */}
      <div className="relative z-10 bg-slate-900/95 backdrop-blur-md text-white pt-6 pb-12 px-6 md:px-10 rounded-b-[40px] shadow-2xl shadow-emerald-900/10 border-b border-emerald-500/20">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-b-[40px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm"
              >
                <FiArrowLeft /> Voltar
              </button>

              <button
                onClick={abrirModalConfig}
                className="p-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-all active:scale-95 flex items-center gap-2 border border-white/5"
                title="Configurações do Tratamento"
              >
                <FiSettings className="text-xl" />
              </button>
            </div>

            <div>
              <p className="text-emerald-400 font-bold uppercase tracking-widest text-[10px] mb-1 flex items-center gap-2">
                <FiActivity />{" "}
                {t?.descricao ||
                  tratamentoBase?.descricao ||
                  "Sincronizando..."}
              </p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">
                {tratamentoBase?.pacienteNome || t?.pacienteNome || "Paciente"}
              </h1>
            </div>
          </div>

          {/* BARRA DE PROGRESSO GAMIFICADA */}
          <div className="flex flex-col gap-2 shrink-0 md:min-w-[200px] bg-black/20 p-5 rounded-3xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between text-[10px] text-slate-300 uppercase tracking-widest font-bold">
              <span>Evolução</span>
              {estado.carregando && (
                <span className="text-amber-400 flex items-center gap-1 animate-pulse">
                  <FiClock /> Sync
                </span>
              )}
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">
                {t?.progresso !== null && t?.progresso !== undefined
                  ? t.progresso.toFixed(0)
                  : "0"}
              </span>
              <span className="text-lg font-bold text-emerald-500/80 mb-1">
                %
              </span>
            </div>
            <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden mt-1 border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${t?.progresso || 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 mt-10 space-y-8 relative z-10">
        {/* Banner de Alta / Fim */}
        <AnimatePresence>
          {t?.fim && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5 rounded-3xl flex items-center gap-4 shadow-sm"
            >
              <div className="w-12 h-12 bg-amber-100/80 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <FiCalendar className="text-2xl" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Tratamento Programado para Alta
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Os exercícios serão bloqueados após o dia{" "}
                  <span className="font-bold text-slate-800">
                    {new Date(t.fim).toLocaleDateString("pt-BR")}
                  </span>
                  .
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <FiActivity className="text-emerald-500" /> Prescrições Ativas
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="px-5 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-600 text-sm font-bold rounded-2xl shadow-sm active:scale-95 transition-all flex items-center gap-2 group"
            >
              <FiMessageSquare
                className={
                  todosFeedbacks.some((f: any) => !f.visto)
                    ? "text-amber-500 animate-pulse"
                    : "text-slate-400 group-hover:text-emerald-500"
                }
              />
              Feedbacks
              {todosFeedbacks.filter((f: any) => !f.visto).length > 0 && (
                <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-lg text-[10px] ml-1 shadow-sm">
                  {todosFeedbacks.filter((f: any) => !f.visto).length} novos
                </span>
              )}
            </button>
            <button
              onClick={abrirModalExercicios}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-2xl shadow-md shadow-slate-300 active:scale-95 transition-all flex items-center gap-2"
            >
              <FiPlus className="text-lg" /> Adicionar Exercício
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {!t?.prescricoes || t.prescricoes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/60 backdrop-blur-md border border-slate-200 rounded-[32px] p-12 text-center shadow-sm"
            >
              <div className="w-20 h-20 bg-slate-100 text-slate-300 flex items-center justify-center rounded-[24px] mx-auto mb-5 text-3xl shadow-inner">
                <FiSettings />
              </div>
              <p className="text-slate-600 font-bold text-lg">
                Nenhum exercício prescrito.
              </p>
              <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Adicione atividades motoras da clínica para construir o
                protocolo de recuperação do paciente.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {t.prescricoes.map((p: any) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -4 }}
                    className="bg-white border border-slate-200 hover:border-emerald-200 rounded-[28px] p-6 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 flex flex-col justify-between transition-all group relative overflow-hidden"
                  >
                    <div
                      className={`absolute top-0 left-0 w-full h-1.5 ${p.disponivel ? "bg-gradient-to-r from-emerald-400 to-emerald-300" : "bg-slate-200"}`}
                    ></div>

                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center text-xl shrink-0 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <FiActivity />
                        </div>
                        <button
                          onClick={() => handleRemoverPrescricao(p.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          title="Remover Prescrição"
                        >
                          <FiX className="text-lg" />
                        </button>
                      </div>

                      <h3 className="font-extrabold text-slate-800 text-lg leading-tight group-hover:text-emerald-700 transition-colors">
                        {p.exercicioNome}
                      </h3>

                      <div className="flex gap-2 flex-wrap mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {p.customizacao?.vezesAoDia || 1}x Dia
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {p.customizacao?.series} Séries
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {p.customizacao?.repeticoes} Reps
                        </span>
                      </div>

                      {p.objetivo && (
                        <p className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl inline-block mt-4 flex items-center gap-1.5">
                          🎯 {p.objetivo}
                        </p>
                      )}
                      {p.observacao && (
                        <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 p-3 rounded-xl mt-3 line-clamp-2">
                          <span className="font-bold block text-[10px] uppercase tracking-widest text-amber-500 mb-0.5">
                            Instrução
                          </span>
                          {p.observacao}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">
                        Desempenho
                      </span>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
                        <FiMessageSquare className="text-slate-400" />
                        <span className="text-sm font-black text-slate-700">
                          {p.feedbacks?.length || 0}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* MODAL 1: CONFIGURAÇÕES DO TRATAMENTO */}
      <AnimatePresence>
        {isConfigModalOpen && (
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
              className="w-full max-w-md bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200 text-slate-600 flex items-center justify-center text-xl shadow-sm border border-slate-300">
                    <FiSettings />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">
                      Ações do Tratamento
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                      Configurações Base
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsConfigModalOpen(false)}
                  className="p-2.5 text-slate-400 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="overflow-y-auto p-6 space-y-6 flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Objetivo do Tratamento
                  </label>
                  <input
                    type="text"
                    value={editDescricao}
                    onChange={(e) => setEditDescricao(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl outline-none transition-colors text-slate-700 font-medium"
                    placeholder="Ex: Fortalecimento..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <FiCalendar /> Data de Previsão de Alta
                  </label>
                  <input
                    type="date"
                    value={editFim}
                    onChange={(e) => setEditFim(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl outline-none transition-colors text-slate-700 font-medium"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <FiBell /> Alertas Automáticos
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors">
                      <span className="text-sm font-bold text-slate-700">
                        Lembrete de Exercícios
                      </span>
                      <input
                        type="checkbox"
                        checked={editLembreteEx}
                        onChange={(e) => setEditLembreteEx(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:border-emerald-300 transition-colors">
                      <span className="text-sm font-bold text-slate-700">
                        Incentivo de Ofensiva
                      </span>
                      <input
                        type="checkbox"
                        checked={editLembreteSeq}
                        onChange={(e) => setEditLembreteSeq(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <button
                    onClick={handleFinalizarTratamento}
                    disabled={isFinalizando}
                    className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl border border-red-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isFinalizando ? (
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <FiPower className="text-lg" /> Finalizar Tratamento
                        Definitivamente
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <button
                  onClick={handleSalvarConfig}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <FiSave className="text-lg" /> Salvar Alterações
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2 FOI EXTRAÍDO PARA AQUI! */}
      <ModalPrescreverExercicio
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        exercicios={exerciciosClinica}
        carregando={carregandoExercicios}
        onConfirm={handleConfirmarPrescricao}
      />

      {/* MODAL 3: FEEDBACKS DO PACIENTE */}
      <AnimatePresence>
        {isFeedbackModalOpen && (
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
              className="w-full max-w-lg bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl shadow-sm border border-amber-200">
                    <FiMessageSquare />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800">
                      Relatórios Recebidos
                    </h3>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                      Feedback Pós-Sessão
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="p-2.5 text-slate-400 hover:bg-slate-200 bg-white border border-slate-200 rounded-xl transition-colors active:scale-95"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/30">
                {todosFeedbacks.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 border border-slate-200 text-slate-300 rounded-[24px] mx-auto flex items-center justify-center text-2xl mb-4 shadow-inner">
                      <FiMessageSquare />
                    </div>
                    <p className="text-slate-500 font-bold text-sm">
                      Ainda sem relatórios.
                    </p>
                    <p className="text-slate-400 font-medium text-xs mt-1">
                      O paciente precisa concluir um exercício para gerar
                      feedback.
                    </p>
                  </div>
                ) : (
                  todosFeedbacks.map((fb: any) => (
                    <div
                      key={fb.id}
                      className={`p-5 rounded-[24px] border transition-all ${!fb.visto ? "bg-amber-50/50 border-amber-300 shadow-md" : "bg-white border-slate-200 shadow-sm"}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="min-w-0 pr-3">
                          <span className="text-sm font-extrabold text-slate-800 block truncate">
                            {fb.exercicioNome}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                            <FiClock />{" "}
                            {new Date(fb.quando).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        {!fb.visto && (
                          <button
                            onClick={() => handleMarcarVisto(fb.id)}
                            className="text-[10px] bg-emerald-500 text-white px-3 py-2 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-sm whitespace-nowrap active:scale-95 flex items-center gap-1"
                          >
                            <FiCheck /> Visto
                          </button>
                        )}
                      </div>

                      {fb.comentario && (
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl mb-4 relative mt-2">
                          <div className="absolute top-2 left-3 text-slate-300 text-2xl font-serif">
                            "
                          </div>
                          <p className="text-sm font-medium text-slate-600 relative z-10 pl-6 pr-2 italic">
                            {fb.comentario}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex text-amber-400 text-lg drop-shadow-sm">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FiStar
                              key={i}
                              className={
                                i < fb.avaliacao
                                  ? "fill-current"
                                  : "text-slate-200"
                              }
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-400">
                          Avaliação da Dificuldade
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TratamentoSalaPage;
