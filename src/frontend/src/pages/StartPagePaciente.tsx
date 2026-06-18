import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header, BuscarClinicaModal } from "@components";
import { useApp } from "../contexts/AppContext";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  FiPlay,
  FiLock,
  FiClock,
  FiActivity,
  FiCheckCircle,
  FiX,
  FiYoutube,
  FiStar,
  FiUser,
} from "react-icons/fi";
import { FaFireAlt } from "react-icons/fa";

const WS_BASE_URL = "https://clinplay-api.onrender.com/ws";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

// ==========================================
// MOTOR DE REGRAS DE TEMPO DO FRONTEND
// ==========================================
const verificarStatusPrescricao = (prescricao: any) => {
  // 1. Bloqueio manual do terapeuta (Vem do backend)
  if (!prescricao.disponivel) {
    return { disponivel: false, mensagem: "Pausado pelo profissional" };
  }

  // 2. Se nunca fez, está livre
  if (!prescricao.feedbacks || prescricao.feedbacks.length === 0) {
    return { disponivel: true, mensagem: "Pronto para iniciar" };
  }

  const custom = prescricao.customizacao || {};
  const vezesAoDia = custom.vezesAoDia || 1;
  const tempoInativoSegundos = custom.tempoInativo || 0;
  const diasInativo = custom.diasInativo || 0;

  // Organizar histórico do mais recente para o mais antigo
  const feedbacks = [...prescricao.feedbacks].sort(
    (a, b) => new Date(b.quando).getTime() - new Date(a.quando).getTime(),
  );

  const ultimoFeedback = feedbacks[0];
  const dataUltimo = new Date(ultimoFeedback.quando);
  const agora = new Date();

  // Zerar as horas para comparar apenas os dias do calendário
  const hojeInicio = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    agora.getDate(),
  );
  const ultimoDiaInicio = new Date(
    dataUltimo.getFullYear(),
    dataUltimo.getMonth(),
    dataUltimo.getDate(),
  );

  const diffDias = Math.floor(
    (hojeInicio.getTime() - ultimoDiaInicio.getTime()) / (1000 * 60 * 60 * 24),
  );

  // A) Verificação de Dias Inativos (Ex: Dia sim, dia não)
  if (diffDias > 0 && diffDias <= diasInativo) {
    const dataLiberacao = new Date(ultimoDiaInicio);
    dataLiberacao.setDate(dataLiberacao.getDate() + diasInativo + 1);
    return {
      disponivel: false,
      mensagem: `Repouso. Volta dia ${dataLiberacao.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`,
    };
  }

  // Identificar quantos treinos já foram feitos HOJE
  const feedbacksHoje = feedbacks.filter((fb) => {
    return new Date(fb.quando) >= hojeInicio;
  });

  // B) Verificação de Meta Diária (vezesAoDia)
  if (feedbacksHoje.length >= vezesAoDia) {
    const dataLiberacao = new Date(hojeInicio);
    dataLiberacao.setDate(dataLiberacao.getDate() + diasInativo + 1);
    return {
      disponivel: false,
      mensagem: `Meta atingida. Volta ${diasInativo > 0 ? "dia " + dataLiberacao.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "amanhã"}`,
    };
  }

  // C) Verificação de Cooldown / Pausa entre sessões hoje (tempoInativo)
  if (feedbacksHoje.length > 0) {
    const tempoInativoHoras = custom.tempoInativo || 0;
    // Multiplicamos as horas por 60(min) * 60(seg) * 1000(ms)
    const proximaSessao = new Date(
      dataUltimo.getTime() + tempoInativoHoras * 60 * 60 * 1000,
    );
    if (agora < proximaSessao) {
      return {
        disponivel: false,
        mensagem: `Aguarde até as ${proximaSessao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
      };
    }
  }

  return { disponivel: true, mensagem: "Iniciar" };
};

export function StartPagePaciente() {
  const navigate = useNavigate();
  const {
    usuario,
    clinicas,
    clinicaSelecionadaId,
    setClinicaSelecionadaId,
    tipoUsuario,
  } = useApp();

  const [isBuscaClinicaOpen, setIsBuscaClinicaOpen] = useState(false);
  const [prescricaoSelecionada, setPrescricaoSelecionada] = useState<
    any | null
  >(null);
  const [tratamentoDaPrescricao, setTratamentoDaPrescricao] = useState<
    string | null
  >(null);

  const [liveTratamentos, setLiveTratamentos] = useState<Record<string, any>>(
    {},
  );
  const [conectadoWS, setConectadoWS] = useState(false);

  const todosTratamentosBase = useMemo(() => {
    let trats: any[] = [];
    if (clinicaSelecionadaId) {
      const clinica = clinicas.find(
        (c) => (c.clinicaId || c.id) === clinicaSelecionadaId,
      );
      if (clinica && clinica.tratamentos) {
        trats = clinica.tratamentos.map((t: any) => ({
          ...t,
          clinicaNome: clinica.nome,
        }));
      }
    } else {
      clinicas.forEach((c) => {
        if (c.tratamentos) {
          trats = [
            ...trats,
            ...c.tratamentos.map((t: any) => ({ ...t, clinicaNome: c.nome })),
          ];
        }
      });
    }
    return trats;
  }, [clinicas, clinicaSelecionadaId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || todosTratamentosBase.length === 0) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}?token=${token}`),
      reconnectDelay: 5000,
      onConnect: () => {
        setConectadoWS(true);
        todosTratamentosBase.forEach((t) => {
          client.subscribe(`/topic/tratamento/${t.id}`, (message) => {
            const evento = JSON.parse(message.body);

            if (
              evento.evento === "ESTADO_ATUAL" ||
              evento.evento === "TRATAMENTO_EDITADO" ||
              evento.evento === "FEEDBACK_CRIADO"
            ) {
              setLiveTratamentos((prev) => ({
                ...prev,
                [t.id]: { ...evento.tratamento, clinicaNome: t.clinicaNome },
              }));
            } else if (
              evento.evento === "PRESCRICAO_ADICIONADA" ||
              evento.evento === "PRESCRICAO_REMOVIDA" ||
              evento.evento === "PRESCRICAO_EDITADA"
            ) {
              client.publish({
                destination: `/app/tratamento/${t.id}`,
                body: JSON.stringify({ tipo: "OBTER" }),
              });
            }
          });

          client.publish({
            destination: `/app/tratamento/${t.id}`,
            body: JSON.stringify({ tipo: "OBTER" }),
          });
        });
      },
      onDisconnect: () => setConectadoWS(false),
    });

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [todosTratamentosBase]);

  // Processa as travas de tempo do frontend
  const tratamentosProcessados = useMemo(() => {
    const renderizar = todosTratamentosBase.map((base) => {
      const live = liveTratamentos[base.id];
      return live ? { ...base, ...live } : base;
    });

    return renderizar.map((t) => {
      if (!t.prescricoes) return { ...t, isActiveNow: false };

      const prescricoesAvaliadas = t.prescricoes.map((p: any) => {
        const status = verificarStatusPrescricao(p);
        return { ...p, statusFrontend: status };
      });

      const isActiveNow = prescricoesAvaliadas.some(
        (p: any) => p.statusFrontend.disponivel === true,
      );
      return { ...t, prescricoes: prescricoesAvaliadas, isActiveNow };
    });
  }, [todosTratamentosBase, liveTratamentos]);

  const hojeStr = new Date().toISOString().split("T")[0];
  const ehFinalizado = (t: any) =>
    !!(t.fim && t.fim.split("T")[0] <= hojeStr);
  const naoExpirado = (t: any) => !t.fim || t.fim.split("T")[0] > hojeStr;

  const tratamentosAtivos = tratamentosProcessados.filter(
    (t) => naoExpirado(t) && t.isActiveNow,
  );
  const tratamentosPausados = tratamentosProcessados.filter(
    (t) => naoExpirado(t) && !t.isActiveNow,
  );
  const tratamentosFinalizados = tratamentosProcessados.filter(ehFinalizado);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const handleAbrirDetalhes = (prescricao: any, tratamentoId: string) => {
    setPrescricaoSelecionada(prescricao);
    setTratamentoDaPrescricao(tratamentoId);
  };

  const handleIniciarExercicio = () => {
    if (!prescricaoSelecionada || !tratamentoDaPrescricao) return;
    const jogoSlug = prescricaoSelecionada.exercicioJogo
      ? prescricaoSelecionada.exercicioJogo.toLowerCase()
      : "generico";
    navigate(`/exercicio/${prescricaoSelecionada.id}/jogar/${jogoSlug}`, {
      state: {
        prescricao: prescricaoSelecionada,
        tratamentoId: tratamentoDaPrescricao,
      },
    });
  };

  const formatarData = (dataStr: string) => {
    const [ano, mes, dia] = dataStr.split("T")[0].split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const renderizarVideo = (url?: string) => {
    if (!url) return null;
    let embedUrl = url;
    if (url.includes("youtube.com/watch?v="))
      embedUrl = url.replace("watch?v=", "embed/");
    else if (url.includes("youtu.be/"))
      embedUrl = url.replace("youtu.be/", "youtube.com/embed/");

    return (
      <iframe
        src={embedUrl}
        className="w-full h-full border-0"
        allowFullScreen
        title="Demonstração do Exercício"
      ></iframe>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-50"></div>
      <div className="absolute top-0 w-full h-[400px] bg-gradient-to-b from-emerald-50/60 to-transparent z-0 pointer-events-none"></div>

      <div className="pt-4 px-4 sm:px-6 relative z-10">
        <Header
          clinicas={clinicas}
          clinicaSelecionadaId={clinicaSelecionadaId}
          tipoUsuario={tipoUsuario}
          onSelectClinica={setClinicaSelecionadaId}
          onNovaClinica={() => setIsBuscaClinicaOpen(true)}
          usuarioLogado={{ nome: usuario?.nome, avatarUrl: usuario?.avatar }}
          onNavigatePerfil={() => navigate("/perfil")}
          onNavigateConfiguracoes={() => navigate("/configuracoes")}
          onLogout={handleLogout}
        />

        <main className="max-w-4xl mx-auto mt-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-12"
          >
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FiActivity className="text-lg" /> Tratamentos Disponíveis
                </h2>
                <div className="flex items-center justify-end">
                  <div
                    className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${conectadoWS ? "bg-emerald-100 text-emerald-600 shadow-sm border border-emerald-200" : "bg-amber-100 text-amber-500 shadow-sm border border-amber-200"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${conectadoWS ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}
                    ></div>
                    {conectadoWS ? "Ao vivo" : "Conectando ao servidor..."}
                  </div>
                </div>
              </div>

              {tratamentosAtivos.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center relative z-10">
                  <p className="text-slate-400 font-medium text-sm">
                    Você não tem exercícios pendentes neste momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {tratamentosAtivos.map((tratamento) => (
                    <motion.div
                      key={tratamento.id}
                      variants={itemVariants}
                      className="bg-white rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-200 overflow-hidden relative z-10"
                    >
                      {/* ... (CABEÇALHO DO TRATAMENTO: AVATAR E XP) ... */}
                      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-sm overflow-hidden">
                                {tratamento.profissionalAvatar ? (
                                  <img
                                    src={tratamento.profissionalAvatar}
                                    alt="Profissional"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FiUser className="text-lg" />
                                )}
                              </div>
                              <div className="flex flex-col text-slate-600 text-start min-w-0 flex-1">
                                <h3 className="text-sm font-bold text-slate-700 truncate">
                                  Dr(a).{" "}
                                  {tratamento.profissionalNome ||
                                    // AQUI TAMBÉM FAZEMOS FALLBACK SE VIER DENTRO DE UM OBJETO:
                                    tratamento.profissional?.nome ||
                                    "Não atribuído"}
                                </h3>
                                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5 truncate">
                                  {tratamento.profissionalCrefito ||
                                  tratamento.profissional?.crefito
                                    ? `CREFITO: ${tratamento.profissionalCrefito || tratamento.profissional?.crefito}`
                                    : "Profissional Responsável"}
                                </h4>
                              </div>
                            </div>
                            {tratamento.sequencia > 0 && (
                              <span className="flex items-center shrink-0 gap-1 text-sm font-bold bg-orange-100 border border-orange-200 text-orange-600 px-3 py-1 rounded-xl ml-2 shadow-sm">
                                <FaFireAlt /> {tratamento.sequencia}
                              </span>
                            )}
                          </div>
                          <hr className="border-t border-slate-200 my-4"></hr>
                          <div className="flex justify-start items-center">
                            <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                              {tratamento.descricao || (
                                <span className="animate-pulse text-slate-400 font-medium text-sm">
                                  Sincronizando dados...
                                </span>
                              )}
                            </h3>
                          </div>
                        </div>

                        {/* XP MINECRAFT */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner flex flex-col items-center justify-center shrink-0 min-w-[180px]">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
                            Nível de Progresso
                          </p>
                          <div className="w-full mt-1 relative">
                            <div
                              className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-black text-[#82E600] z-10 tracking-widest"
                              style={{
                                textShadow: "2px 2px 0 rgba(0,0,0,0.8)",
                              }}
                            >
                              {tratamento.progresso
                                ? tratamento.progresso.toFixed(0)
                                : "0"}
                            </div>
                            <div className="w-full bg-slate-600 h-3 border-[2px] border-slate-500 p-[1px] relative flex">
                              <div
                                className="h-full bg-[#82E600] transition-all duration-500 ease-out relative"
                                style={{
                                  width: `${tratamento.progresso || 0}%`,
                                }}
                              >
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/40"></div>
                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-black/30"></div>
                              </div>
                              <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                  backgroundImage: `repeating-linear-gradient(to right, transparent, transparent calc(100% / 18 - 1px), #94a3b8 calc(100% / 18 - 1px), #94a3b8 calc(100% / 18))`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* LISTA DE EXERCÍCIOS COM A TRAVA APLICADA */}
                      <div className="p-4 space-y-2">
                        {tratamento.prescricoes.map((prescricao: any) => {
                          const status = prescricao.statusFrontend;

                          return (
                            <div
                              key={prescricao.id}
                              onClick={() =>
                                status.disponivel &&
                                handleAbrirDetalhes(prescricao, tratamento.id)
                              }
                              // AQUI ESTÁ A CORREÇÃO RESPONSIVA PARA O BOTÃO NÃO VAZAR!
                              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all ${
                                status.disponivel
                                  ? "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm cursor-pointer group"
                                  : "bg-slate-50 border-slate-100 opacity-75 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors ${
                                    status.disponivel
                                      ? "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white"
                                      : "bg-slate-200 text-slate-400"
                                  }`}
                                >
                                  {status.disponivel ? (
                                    <FiPlay className="ml-1" />
                                  ) : (
                                    <FiLock />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4
                                    className={`font-bold truncate ${status.disponivel ? "text-slate-800" : "text-slate-500"}`}
                                  >
                                    {prescricao.exercicioNome}
                                  </h4>
                                  <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">
                                    {(() => {
                                      const hojeInicio = new Date();
                                      hojeInicio.setHours(0, 0, 0, 0);
                                      const feitas = (prescricao.feedbacks || []).filter(
                                        (fb: any) => new Date(fb.quando) >= hojeInicio,
                                      ).length;
                                      const total = prescricao.customizacao?.vezesAoDia || 1;
                                      return `${feitas}/${total} Sessões Diárias`;
                                    })()}
                                  </p>
                                </div>
                              </div>

                              <div className="self-end sm:self-auto shrink-0">
                                {status.disponivel ? (
                                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                    {status.mensagem}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-amber-500 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                                    <FiClock className="shrink-0" />{" "}
                                    <span className="truncate">
                                      {status.mensagem}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* SEÇÃO DE PAUSADOS E AGUARDANDO */}
            {tratamentosPausados.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FiClock className="text-lg" /> Em Repouso / Concluídos Hoje
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tratamentosPausados.map((tratamento) => (
                    <motion.div
                      key={tratamento.id}
                      variants={itemVariants}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm opacity-80 relative z-10 flex flex-col justify-between"
                    >
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          {tratamento.clinicaNome}
                        </p>
                        <h3 className="text-lg font-bold text-slate-700">
                          {tratamento.descricao}
                        </h3>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <FiCheckCircle className="text-emerald-500" /> Repouso
                          Ativo
                        </span>
                        <span className="bg-slate-100 px-2 py-1 rounded-md">
                          {tratamento.progresso
                            ? tratamento.progresso.toFixed(0)
                            : "0"}
                          %
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* SEÇÃO DE FINALIZADOS */}
            {tratamentosFinalizados.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xs font-bold text-rose-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <FiCheckCircle className="text-lg" /> Tratamentos Finalizados
                </h2>
                <div className="space-y-4">
                  {tratamentosFinalizados.map((tratamento) => (
                    <motion.div
                      key={tratamento.id}
                      variants={itemVariants}
                      className="bg-white rounded-3xl border border-rose-100 shadow-sm opacity-75 relative z-10 overflow-hidden"
                    >
                      <div className="p-5 border-b border-rose-50 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                            {tratamento.clinicaNome}
                          </p>
                          <h3 className="text-base font-bold text-slate-600 truncate">
                            {tratamento.descricao || "Tratamento"}
                          </h3>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl">
                          Finalizado
                        </span>
                      </div>

                      {tratamento.prescricoes &&
                        tratamento.prescricoes.length > 0 && (
                          <div className="p-3 space-y-1.5">
                            {tratamento.prescricoes.map((prescricao: any) => (
                              <div
                                key={prescricao.id}
                                className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3 cursor-not-allowed"
                              >
                                <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                                  <FiLock />
                                </div>
                                <span className="text-sm font-medium text-slate-400 truncate">
                                  {prescricao.exercicioNome}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        </main>
      </div>

      {/* MODAL DE DETALHES DO EXERCÍCIO */}
      {prescricaoSelecionada && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm sm:p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full sm:max-w-md bg-white rounded-t-[40px] sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative"
            >
              <button
                onClick={() => setPrescricaoSelecionada(null)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors shadow-sm"
              >
                <FiX className="text-lg" />
              </button>

              <div className="w-full h-56 bg-slate-900 relative flex items-center justify-center shrink-0">
                {prescricaoSelecionada.exercicioVideoUrl ? (
                  renderizarVideo(prescricaoSelecionada.exercicioVideoUrl)
                ) : (
                  <>
                    <FiYoutube className="text-5xl text-red-500/80" />
                    <div className="absolute bottom-4 left-4 right-4 text-center">
                      <p className="text-xs text-white/70 font-medium">
                        Nenhum vídeo demonstrativo cadastrado.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-800">
                    {prescricaoSelecionada.exercicioNome}
                  </h3>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">
                      {prescricaoSelecionada.customizacao?.series} Séries
                    </span>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg">
                      {prescricaoSelecionada.customizacao?.repeticoes}{" "}
                      Repetições
                    </span>
                    {prescricaoSelecionada.objetivo && (
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg flex items-center gap-1">
                        🎯 {prescricaoSelecionada.objetivo}
                      </span>
                    )}
                  </div>

                  {prescricaoSelecionada.exercicioDescricao && (
                    <p className="text-sm font-medium text-slate-600 mt-4 leading-relaxed">
                      {prescricaoSelecionada.exercicioDescricao}
                    </p>
                  )}
                  {prescricaoSelecionada.observacao && (
                    <p className="text-sm font-medium text-amber-700 bg-amber-50 border border-amber-100 p-3 rounded-xl mt-4">
                      <span className="font-bold">Nota do profissional:</span>{" "}
                      {prescricaoSelecionada.observacao}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FiCheckCircle className="text-blue-500" /> Histórico de
                    Execuções
                  </h4>

                  {!prescricaoSelecionada.feedbacks ||
                  prescricaoSelecionada.feedbacks.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-sm font-medium text-slate-400">
                        Você ainda não executou este exercício.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[...prescricaoSelecionada.feedbacks]
                        .reverse()
                        .slice(0, 3)
                        .map((fb: any) => (
                          <div
                            key={fb.id}
                            className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm flex items-center justify-between"
                          >
                            <div>
                              <p className="text-xs font-bold text-slate-700">
                                {formatarData(fb.quando)}
                              </p>
                              {fb.comentario && (
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                                  "{fb.comentario}"
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-amber-400 text-sm">
                              <span className="font-bold text-slate-700 mr-1">
                                {fb.avaliacao}
                              </span>
                              <FiStar className="fill-current" />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <button
                  onClick={handleIniciarExercicio}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2 text-lg"
                >
                  <FiPlay className="fill-current" /> Começar Exercício
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}

      <BuscarClinicaModal
        isOpen={isBuscaClinicaOpen}
        onClose={() => setIsBuscaClinicaOpen(false)}
      />
    </div>
  );
}

export default StartPagePaciente;
