import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header, BuscarClinicaModal } from "@components";
import { useApp } from "../contexts/AppContext";
import { authServices, clinicasServices } from "@services";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import {
  FiUsers,
  FiActivity,
  FiPlus,
  FiClock,
  FiShield,
  FiCheck,
  FiX,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiUserX,
  FiFilter,
  FiClipboard,
  FiUserCheck,
  FiMail,
  FiPhone,
  FiSave,
  FiSearch,
} from "react-icons/fi";
import { FaDumbbell } from "react-icons/fa";

const WS_BASE_URL = "https://clinplay-api.onrender.com/ws";

const getYoutubeThumbnail = (url?: string): string | null => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
};

const formatarCPF = (v: string) => {
  const d = (v || "").replace(/\D/g, "");
  if (d.length !== 11) return v || "---";
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const formatarTelefone = (v: string) => {
  const d = (v || "").replace(/\D/g, "");
  if (d.length === 11)
    return d.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, "($1) $2 $3-$4");
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return v || "---";
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

// Variantes para o Slide das abas
const swipeVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 50 : -50,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -50 : 50,
    opacity: 0,
  }),
};

type AbaId = "tratamentos" | "exercicios" | "pacientes" | "equipe";

export function StartPageProfissional() {
  const navigate = useNavigate();
  const {
    usuario,
    clinicas,
    clinicaSelecionadaId,
    setClinicaSelecionadaId,
    tipoUsuario,
    notificar,
  } = useApp();

  const [isBuscaClinicaOpen, setIsBuscaClinicaOpen] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(false);

  // Controle das abas e Swipe
  const [abaAtiva, setAbaAtiva] = useState<AbaId>("tratamentos");
  const [direcao, setDirecao] = useState(0);

  const [popupPendentesAberto, setPopupPendentesAberto] = useState(false);

  const clinicaAtual = clinicas.find(
    (c) => (c.clinicaId || c.id) === clinicaSelecionadaId,
  );

  const permissoes = clinicaAtual?.permissoes || {};
  const isSuperAdmin = permissoes.dono || permissoes.adminClinica;
  const isGestorProfissionais = isSuperAdmin || permissoes.adminProfissionais;
  const isGestorPacientes = isSuperAdmin || permissoes.adminPacientes;
  const isGestorExercicios = isSuperAdmin || permissoes.adminExercicios;
  const hasAnyAdminPower =
    isGestorProfissionais || isGestorPacientes || isGestorExercicios;

  const meusTratamentos = clinicaAtual?.tratamentos || [];
  const [meusExercicios, setMeusExercicios] = useState<any[]>([]);
  const [pendentesProfissionais, setPendentesProfissionais] = useState<any[]>(
    [],
  );
  const [pendentesPacientes, setPendentesPacientes] = useState<any[]>([]);
  const [pendentesExercicios, setPendentesExercicios] = useState<any[]>([]);
  const [equipe, setEquipe] = useState<any[]>([]);
  const [pacientesClinica, setPacientesClinica] = useState<any[]>([]);
  const [profissionalAbertoId, setProfissionalAbertoId] = useState<
    string | null
  >(null);
  const [solicitacaoAbertaId, setSolicitacaoAbertaId] = useState<string | null>(
    null,
  );
  const [filtroEspecialidade, setFiltroEspecialidade] = useState<string>("");
  const [filtroTratamento, setFiltroTratamento] = useState<string>("todos");
  const [modalResposta, setModalResposta] = useState<{
    id: string;
    nome: string;
    aprovado: boolean;
  } | null>(null);
  const [textoResposta, setTextoResposta] = useState("");
  const [processandoResposta, setProcessandoResposta] = useState(false);

  const [inputTratamentos, setInputTratamentos] = useState("");
  const [inputExercicios, setInputExercicios] = useState("");
  const [inputPacientes, setInputPacientes] = useState("");
  const [inputEquipe, setInputEquipe] = useState("");

  const [buscaTratamentos, setBuscaTratamentos] = useState("");
  const [buscaExercicios, setBuscaExercicios] = useState("");
  const [buscaPacientes, setBuscaPacientes] = useState("");
  const [buscaEquipe, setBuscaEquipe] = useState("");

  const [filtroAberto, setFiltroAberto] = useState(false);

  const totalPendentes =
    (isGestorProfissionais ? pendentesProfissionais.length : 0) +
    (isGestorPacientes ? pendentesPacientes.length : 0) +
    (isGestorExercicios ? pendentesExercicios.length : 0);

  const abas = [
    { id: "tratamentos" as AbaId, label: "Tratamentos", icon: FiUsers },
    { id: "exercicios" as AbaId, label: "Exercícios", icon: FiActivity },
    ...(isGestorPacientes
      ? [{ id: "pacientes" as AbaId, label: "Pacientes", icon: FiUser }]
      : []),
    ...(isGestorProfissionais
      ? [{ id: "equipe" as AbaId, label: "Equipe", icon: FiShield }]
      : []),
  ];

  // Identifica o índice seguro para o Swipe
  const currentIndex = Math.max(
    0,
    abas.findIndex((a) => a.id === abaAtiva),
  );
  const AbaIcon = abas[currentIndex]?.icon;

  const mudarAba = (novaAba: AbaId) => {
    if (novaAba === abaAtiva) return;
    const idxAntigo = abas.findIndex((a) => a.id === abaAtiva);
    const idxNovo = abas.findIndex((a) => a.id === novaAba);
    setDirecao(idxNovo > idxAntigo ? 1 : -1);
    setAbaAtiva(novaAba);
  };

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipeThreshold = 50;
    if (offset.x < -swipeThreshold && currentIndex < abas.length - 1) {
      mudarAba(abas[currentIndex + 1].id);
    } else if (offset.x > swipeThreshold && currentIndex > 0) {
      mudarAba(abas[currentIndex - 1].id);
    }
  };

  useEffect(() => {
    const ids = abas.map((a) => a.id);
    if (!ids.includes(abaAtiva)) setAbaAtiva("tratamentos");
    setFiltroAberto(false);
  }, [clinicaSelecionadaId, isGestorPacientes, isGestorProfissionais]);

  useEffect(() => {
    setFiltroAberto(false);
  }, [abaAtiva]);

  const carregarDashboard = async () => {
    if (!clinicaSelecionadaId) return;
    setCarregandoDados(true);
    try {
      if (hasAnyAdminPower) {
        const promises = [
          clinicasServices.listarProfissionais(clinicaSelecionadaId),
          clinicasServices.listarPacientes(clinicaSelecionadaId),
          clinicasServices.listarExercicios(clinicaSelecionadaId),
        ];
        const [profissionaisAtivos, pacientesAtivos, exerciciosAtivos] =
          await Promise.allSettled(promises);
        if (profissionaisAtivos.status === "fulfilled")
          setEquipe(profissionaisAtivos.value || []);
        if (pacientesAtivos.status === "fulfilled")
          setPacientesClinica(pacientesAtivos.value || []);
        if (exerciciosAtivos.status === "fulfilled")
          setMeusExercicios(exerciciosAtivos.value || []);
      } else {
        const exerciciosAtivos =
          await clinicasServices.listarExercicios(clinicaSelecionadaId);
        setMeusExercicios(exerciciosAtivos || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setCarregandoDados(false);
    }
  };

  useEffect(() => {
    carregarDashboard();
  }, [clinicaSelecionadaId, hasAnyAdminPower]);

  useEffect(() => {
    if (!clinicaSelecionadaId || !hasAnyAdminPower) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_BASE_URL}?token=${token}`),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(
          `/user/queue/clinica/${clinicaSelecionadaId}/solicitacoes`,
          (message) => {
            const data = JSON.parse(message.body);
            if (data.evento === "ESTADO_ATUAL") {
              if (data.profissionais)
                setPendentesProfissionais(data.profissionais);
              if (data.pacientes) setPendentesPacientes(data.pacientes);
              if (data.exercicios) setPendentesExercicios(data.exercicios);
            } else if (data.evento === "SOLICITACAO_CRIADA") {
              if (data.tipo === "PROFISSIONAL" && data.profissional)
                setPendentesProfissionais((prev) => [
                  ...prev,
                  data.profissional,
                ]);
              else if (data.tipo === "PACIENTE" && data.paciente)
                setPendentesPacientes((prev) => [...prev, data.paciente]);
              else if (data.tipo === "EXERCICIO" && data.exercicio)
                setPendentesExercicios((prev) => [...prev, data.exercicio]);
            } else if (data.evento === "SOLICITACAO_RESPONDIDA") {
              const id = data.solicitacaoId;
              if (data.tipo === "PROFISSIONAL")
                setPendentesProfissionais((prev) =>
                  prev.filter((x) => x.id !== id),
                );
              else if (data.tipo === "PACIENTE")
                setPendentesPacientes((prev) =>
                  prev.filter((x) => x.id !== id),
                );
              else if (data.tipo === "EXERCICIO")
                setPendentesExercicios((prev) =>
                  prev.filter((x) => x.id !== id),
                );
            }
          },
        );
        client.publish({
          destination: `/app/solicitacoes/${clinicaSelecionadaId}`,
          body: JSON.stringify({}),
        });
      },
    });

    client.activate();
    return () => {
      client.deactivate();
    };
  }, [clinicaSelecionadaId, hasAnyAdminPower]);

  const handleLogout = async () => {
    await authServices.logout();
    navigate("/");
  };

  const handleConfirmarResposta = async () => {
    if (!modalResposta) return;
    setProcessandoResposta(true);
    try {
      await clinicasServices.responderSolicitacao(modalResposta.id, {
        aprovado: modalResposta.aprovado,
        resposta: textoResposta.trim() !== "" ? textoResposta : undefined,
      });
      notificar(
        `Solicitação ${modalResposta.aprovado ? "aprovada" : "recusada"} com sucesso!`,
        "sucesso",
      );
      setModalResposta(null);
      setTextoResposta("");
      carregarDashboard();
    } catch (error: any) {
      const msgBackend = error.response?.data;
      notificar(
        typeof msgBackend === "string"
          ? msgBackend
          : "Ocorreu um erro na validação.",
        "erro",
      );
    } finally {
      setProcessandoResposta(false);
    }
  };

  const handleAtualizarPermissoes = async (prof: any) => {
    if (!clinicaSelecionadaId) return;
    try {
      await clinicasServices.atualizarPermissoesProfissional(
        clinicaSelecionadaId,
        prof.profissionalId,
        {
          adminClinica: prof.adminClinica,
          adminExercicios: prof.adminExercicios,
          adminPacientes: prof.adminPacientes,
          adminProfissionais: prof.adminProfissionais,
        },
      );
      notificar("Permissões atualizadas com sucesso.", "sucesso");
      setProfissionalAbertoId(null);
      carregarDashboard();
    } catch (error: any) {
      const msgBackend = error.response?.data;
      notificar(
        typeof msgBackend === "string"
          ? msgBackend
          : "Erro ao atualizar permissões.",
        "erro",
      );
    }
  };

  const handleRemoverProfissional = async (
    profissionalId: string,
    nome: string,
  ) => {
    if (!clinicaSelecionadaId) return;
    if (!window.confirm(`Deseja realmente remover ${nome} da clínica?`)) return;
    try {
      await clinicasServices.deletarProfissionalVinculado(
        clinicaSelecionadaId,
        profissionalId,
      );
      notificar("Profissional removido com sucesso.", "sucesso");
      setEquipe((prev) =>
        prev.filter((p) => p.profissionalId !== profissionalId),
      );
      setProfissionalAbertoId(null);
    } catch (error: any) {
      notificar(
        error.response?.data || "Erro ao remover profissional.",
        "erro",
      );
    }
  };

  const handleRemoverPaciente = async (pacienteId: string, nome: string) => {
    if (!clinicaSelecionadaId) return;
    if (!window.confirm(`Deseja realmente desvincular o paciente ${nome}?`))
      return;
    try {
      await clinicasServices.deletarPacienteVinculado(
        clinicaSelecionadaId,
        pacienteId,
      );
      notificar("Paciente desvinculado com sucesso.", "sucesso");
      setPacientesClinica((prev) =>
        prev.filter((p) => p.pacienteId !== pacienteId),
      );
    } catch (error: any) {
      notificar(
        error.response?.data || "Erro ao desvincular paciente.",
        "erro",
      );
    }
  };

  const handleVerPerfilPaciente = (paciente: any) => {
    navigate(`/perfil/${paciente.pacienteId}`, {
      state: { usuario: paciente, tipo: "paciente" },
    });
  };

  const hojeStr = new Date().toISOString().split("T")[0];

  const meuProfissionalId = equipe.find(
    (p) => p.email === usuario?.email,
  )?.profissionalId;

  const podeExpandirAccordion = (prof: any): boolean => {
    if (prof.dono) return false;
    if (meuProfissionalId && prof.profissionalId === meuProfissionalId)
      return false;
    if (permissoes.dono) return true;
    if (permissoes.adminClinica) return !prof.adminClinica;
    if (permissoes.adminProfissionais) return !prof.adminClinica;
    return false;
  };

  const togglesPermissao = isSuperAdmin
    ? [
        { key: "adminClinica", label: "Administração Geral", Icon: FiShield },
        {
          key: "adminExercicios",
          label: "Gerir Exercícios",
          Icon: FiClipboard,
        },
        { key: "adminPacientes", label: "Gerir Pacientes", Icon: FiUsers },
        { key: "adminProfissionais", label: "Gerir Equipe", Icon: FiUserCheck },
      ]
    : [
        {
          key: "adminExercicios",
          label: "Gerir Exercícios",
          Icon: FiClipboard,
        },
        { key: "adminPacientes", label: "Gerir Pacientes", Icon: FiUsers },
      ];

  const especialidadesUnicas = Array.from(
    new Set(equipe.map((p) => p.especialidade).filter(Boolean)),
  );

  const equipeFiltrada = equipe
    .filter((p) =>
      filtroEspecialidade ? p.especialidade === filtroEspecialidade : true,
    )
    .filter((p) => {
      const t = buscaEquipe.toLowerCase();
      return (
        !t ||
        p.nome?.toLowerCase().includes(t) ||
        p.especialidade?.toLowerCase().includes(t) ||
        p.crefito?.toLowerCase().includes(t)
      );
    });

  const pacientesFiltrados = pacientesClinica
    .filter((pac) => {
      const isEmTratamento = meusTratamentos.some(
        (t: any) => t.pacienteId === pac.pacienteId && !t.fim,
      );
      if (filtroTratamento === "sim") return isEmTratamento;
      if (filtroTratamento === "nao") return !isEmTratamento;
      return true;
    })
    .filter((pac) => {
      const t = buscaPacientes.toLowerCase();
      return (
        !t ||
        pac.nome?.toLowerCase().includes(t) ||
        pac.cpf?.replace(/\D/g, "").includes(buscaPacientes.replace(/\D/g, ""))
      );
    });

  const tratamentosFiltrados = meusTratamentos.filter((t: any) => {
    const termo = buscaTratamentos.toLowerCase();
    return (
      !termo ||
      t.pacienteNome?.toLowerCase().includes(termo) ||
      t.profissionalNome?.toLowerCase().includes(termo) ||
      t.descricao?.toLowerCase().includes(termo)
    );
  });

  const exerciciosFiltrados = meusExercicios.filter((ex) => {
    const termo = buscaExercicios.toLowerCase();
    return (
      !termo ||
      ex.nome?.toLowerCase().includes(termo) ||
      ex.jogo?.toLowerCase().includes(termo) ||
      ex.descricao?.toLowerCase().includes(termo)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative">
      <div className="pt-4 px-4 sm:px-6">
        <Header
          clinicas={clinicas}
          clinicaSelecionadaId={clinicaSelecionadaId}
          tipoUsuario={tipoUsuario}
          onSelectClinica={setClinicaSelecionadaId}
          onNovaClinica={() => setIsBuscaClinicaOpen(true)}
          onCriarClinica={() => navigate("/planos")}
          usuarioLogado={{ nome: usuario?.nome, avatarUrl: usuario?.avatar }}
          onNavigatePerfil={() => navigate("/perfil")}
          onNavigateConfiguracoes={() => navigate("/configuracoes")}
          onLogout={handleLogout}
        />

        <main className="max-w-3xl mx-auto mt-8">
          {!clinicaSelecionadaId ? (
            <div className="text-center py-16 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-3xl bg-white p-8 font-medium shadow-sm max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-slate-100 text-slate-300 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">
                <FiUsers />
              </div>
              Você ainda não ativou nenhuma clínica no painel.
              <br /> Clique no seletor de clínicas no menu superior para buscar
              um vínculo ou criar a sua própria unidade.
            </div>
          ) : carregandoDados ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* BADGE DE APROVAÇÕES PENDENTES */}
              <AnimatePresence>
                {hasAnyAdminPower && totalPendentes > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => setPopupPendentesAberto(true)}
                      className="w-full flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 hover:bg-amber-100 active:scale-[0.99] transition-colors"
                    >
                      <div className="flex items-center gap-2 text-amber-700">
                        <FiClock className="text-sm shrink-0" />
                        <span className="text-xs font-bold">
                          Solicitações Pendentes
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">
                          {totalPendentes}
                        </span>
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                        </span>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ---------------------------------------------------- */}
              {/* SWITCH DE ABAS (DESKTOP) */}
              <motion.div variants={itemVariants} className="hidden sm:block">
                <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200 shadow-inner gap-1">
                  {abas.map((aba) => (
                    <button
                      key={aba.id}
                      onClick={() => mudarAba(aba.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold transition-all duration-200 ${
                        abaAtiva === aba.id
                          ? "bg-white shadow-sm border border-slate-100 text-slate-700"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <aba.icon
                        className={`text-sm shrink-0 ${abaAtiva === aba.id ? "text-emerald-500" : ""}`}
                      />
                      {aba.label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* SWITCH DE ABAS (MOBILE - Título com Swipe) */}
              <motion.div variants={itemVariants} className="sm:hidden mb-4">
                <div className="flex items-center justify-between bg-slate-100 rounded-2xl p-2 border border-slate-200 shadow-inner">
                  <button
                    onClick={() =>
                      currentIndex > 0 && mudarAba(abas[currentIndex - 1].id)
                    }
                    className={`p-2 rounded-xl transition-all ${currentIndex > 0 ? "text-slate-500 hover:bg-white shadow-sm" : "text-slate-300 opacity-50 cursor-not-allowed"}`}
                  >
                    <FiChevronLeft className="text-xl" />
                  </button>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={abaAtiva}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2 font-bold text-sm text-slate-700"
                    >
                      {AbaIcon && (
                        <AbaIcon className="text-emerald-500 text-lg" />
                      )}
                      <span>{abas[currentIndex]?.label}</span>
                    </motion.div>
                  </AnimatePresence>

                  <button
                    onClick={() =>
                      currentIndex < abas.length - 1 &&
                      mudarAba(abas[currentIndex + 1].id)
                    }
                    className={`p-2 rounded-xl transition-all ${currentIndex < abas.length - 1 ? "text-slate-500 hover:bg-white shadow-sm" : "text-slate-300 opacity-50 cursor-not-allowed"}`}
                  >
                    <FiChevronRight className="text-xl" />
                  </button>
                </div>
              </motion.div>
              {/* ---------------------------------------------------- */}

              {/* CONTEÚDO DA ABA ATIVA (AGORA COM SWIPE VERTICAL LOCK) */}
              <AnimatePresence mode="wait" custom={direcao}>
                <motion.div
                  key={abaAtiva}
                  custom={direcao}
                  variants={swipeVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  drag="x"
                  dragDirectionLock
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="space-y-4 touch-pan-y"
                >
                  {/* ── ABA: TRATAMENTOS ── */}
                  {abaAtiva === "tratamentos" && (
                    <section className="space-y-4">
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <FiUsers className="text-emerald-500" /> Pacientes em
                        Tratamento
                      </h2>
                      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2">
                        {meusTratamentos.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-sm font-medium">
                            Nenhum tratamento ativo vinculado a esta clínica.
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 p-2 pb-1">
                              <div className="relative flex-1">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder="Buscar por paciente, profissional..."
                                  value={inputTratamentos}
                                  onChange={(e) =>
                                    setInputTratamentos(e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    setBuscaTratamentos(inputTratamentos)
                                  }
                                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 placeholder:text-slate-300 outline-none focus:border-slate-300 transition-colors"
                                />
                              </div>
                              <button
                                onClick={() =>
                                  setBuscaTratamentos(inputTratamentos)
                                }
                                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-2xl transition-colors active:scale-95 shrink-0"
                              >
                                Buscar
                              </button>
                            </div>
                            {tratamentosFiltrados.length === 0 ? (
                              <div className="p-6 text-center text-slate-400 text-sm font-medium">
                                Nenhum resultado para a busca.
                              </div>
                            ) : (
                              <div className="space-y-2 p-2 pt-1">
                                {tratamentosFiltrados.map((tratamento: any) => (
                                  <div
                                    key={tratamento.id}
                                    onClick={() =>
                                      navigate(
                                        `/tratamentos/sala/${tratamento.id}`,
                                        {
                                          state: { tratamentoBase: tratamento },
                                        },
                                      )
                                    }
                                    className="p-4 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-emerald-200 hover:shadow-sm hover:bg-slate-50 transition-all cursor-pointer group"
                                  >
                                    <div className="flex items-center gap-3 min-w-0 pr-3">
                                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                        {tratamento.pacienteAvatar ? (
                                          <img
                                            src={tratamento.pacienteAvatar}
                                            alt={tratamento.pacienteNome}
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <FiUser className="text-slate-400" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-slate-700 truncate group-hover:text-emerald-600 transition-colors">
                                          {tratamento.pacienteNome}
                                        </h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1.5 flex-wrap">
                                          {tratamento.descricao ? (
                                            <span className="uppercase tracking-widest text-emerald-500 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                                              {tratamento.descricao}
                                            </span>
                                          ) : (
                                            <span className="uppercase tracking-widest text-slate-300 font-bold">
                                              Sem descrição
                                            </span>
                                          )}
                                          {tratamento.profissionalNome && (
                                            <span className="font-medium">
                                              • Dr(a).{" "}
                                              {tratamento.profissionalNome}
                                            </span>
                                          )}
                                          {!!(
                                            tratamento.fim &&
                                            tratamento.fim.split("T")[0] <=
                                              hojeStr
                                          ) ? (
                                            <span className="font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest">
                                              Finalizado
                                            </span>
                                          ) : typeof tratamento.progresso ===
                                            "number" ? (
                                            <span className="font-bold text-emerald-600">
                                              •{" "}
                                              {tratamento.progresso.toFixed(0)}%
                                            </span>
                                          ) : null}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0">
                                      <FiUsers className="text-xl" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                        <div className="p-2 pt-0 mt-2">
                          <button
                            onClick={() => navigate("/tratamentos/formulario")}
                            className="w-full py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 border border-emerald-100 border-dashed"
                          >
                            <FiPlus className="text-lg" /> Prescrever novo
                            tratamento
                          </button>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── ABA: EXERCÍCIOS ── */}
                  {abaAtiva === "exercicios" && (
                    <section className="space-y-4">
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <FiActivity className="text-blue-500" /> Exercícios
                        Cadastrados
                      </h2>
                      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2">
                        {meusExercicios.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-sm font-medium">
                            Nenhum exercício cadastrado para esta clínica.
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 p-2 pb-1">
                              <div className="relative flex-1">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none" />
                                <input
                                  type="text"
                                  placeholder="Buscar por nome, jogo..."
                                  value={inputExercicios}
                                  onChange={(e) =>
                                    setInputExercicios(e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    e.key === "Enter" &&
                                    setBuscaExercicios(inputExercicios)
                                  }
                                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 placeholder:text-slate-300 outline-none focus:border-slate-300 transition-colors"
                                />
                              </div>
                              <button
                                onClick={() =>
                                  setBuscaExercicios(inputExercicios)
                                }
                                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-2xl transition-colors active:scale-95 shrink-0"
                              >
                                Buscar
                              </button>
                            </div>
                            {exerciciosFiltrados.length === 0 ? (
                              <div className="p-6 text-center text-slate-400 text-sm font-medium">
                                Nenhum resultado para a busca.
                              </div>
                            ) : (
                              <div className="space-y-2 p-2 pt-1">
                                {exerciciosFiltrados.map((ex) => {
                                  const thumbnail = getYoutubeThumbnail(ex.videoUrl);
                                  return (
                                    <div
                                      key={ex.id}
                                      onClick={() =>
                                        navigate(`/exercicios/${ex.id}`, {
                                          state: { exercicio: ex },
                                        })
                                      }
                                      className="p-3 border border-slate-100 rounded-2xl flex items-center gap-3 hover:border-blue-200 hover:shadow-sm hover:bg-slate-50 transition-all cursor-pointer group"
                                    >
                                      {/* Miniatura do vídeo ou fallback */}
                                      <div className="w-14 h-14 rounded-xl bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 border border-slate-800">
                                        {thumbnail ? (
                                          <img
                                            src={thumbnail}
                                            alt={ex.nome}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <FaDumbbell className="text-slate-500 text-xl" />
                                        )}
                                      </div>

                                      {/* Conteúdo */}
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <h3 className="text-sm font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                                            {ex.nome}
                                          </h3>
                                          {ex.jogo && (
                                            <>
                                              <span className="text-slate-300 shrink-0">—</span>
                                              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest shrink-0">
                                                {ex.jogo}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 flex-wrap">
                                          {ex.configPadrao && (
                                            <>
                                              <span className="font-bold text-slate-500">
                                                {ex.configPadrao.series} séries
                                              </span>
                                              <span>×</span>
                                              <span className="font-bold text-slate-500">
                                                {ex.configPadrao.repeticoes} reps
                                              </span>
                                            </>
                                          )}
                                          {ex.descricao && (
                                            <span className="truncate">
                                              {ex.configPadrao ? " • " : ""}{ex.descricao}
                                            </span>
                                          )}
                                        </p>
                                      </div>

                                      {/* Indicador de ação */}
                                      <FiChevronRight className="text-slate-300 group-hover:text-blue-400 transition-colors shrink-0 text-lg" />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                        <div className="p-2 pt-0 mt-2">
                          <button
                            onClick={() =>
                              navigate(`/clinica/${clinicaSelecionadaId}/jogos`)
                            }
                            className="w-full py-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95 border border-blue-100 border-dashed"
                          >
                            <FiPlus className="text-lg" /> Criar novo exercício
                          </button>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ── ABA: PACIENTES ── */}
                  {abaAtiva === "pacientes" && isGestorPacientes && (
                    <section className="space-y-4">
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <FiUsers className="text-emerald-500" /> Base de
                        Pacientes
                      </h2>
                      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 space-y-2">
                        <div className="flex items-center gap-2 p-2 pb-1">
                          <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Buscar por nome ou CPF..."
                              value={inputPacientes}
                              onChange={(e) =>
                                setInputPacientes(e.target.value)
                              }
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                setBuscaPacientes(inputPacientes)
                              }
                              className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 placeholder:text-slate-300 outline-none focus:border-slate-300 transition-colors"
                            />
                          </div>
                          <button
                            onClick={() => setBuscaPacientes(inputPacientes)}
                            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-2xl transition-colors active:scale-95 shrink-0"
                          >
                            Buscar
                          </button>
                          <button
                            onClick={() => setFiltroAberto(!filtroAberto)}
                            className={`p-2.5 rounded-2xl transition-colors active:scale-95 shrink-0 ${filtroTratamento !== "todos" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                            title="Filtros"
                          >
                            <FiFilter />
                          </button>
                        </div>
                        <AnimatePresence>
                          {filtroAberto && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="px-2 pb-1">
                                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Situação
                                  </span>
                                  <select
                                    value={filtroTratamento}
                                    onChange={(e) =>
                                      setFiltroTratamento(e.target.value)
                                    }
                                    className="text-xs font-bold bg-white border border-slate-200 text-slate-600 rounded-xl px-3 py-1.5 outline-none focus:border-emerald-400 transition-colors"
                                  >
                                    <option value="todos">Todos</option>
                                    <option value="sim">
                                      Em Tratamento Ativo
                                    </option>
                                    <option value="nao">Sem Tratamento</option>
                                  </select>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {pacientesFiltrados.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-sm font-medium">
                            Nenhum paciente encontrado.
                          </div>
                        ) : (
                          pacientesFiltrados.map((paciente) => (
                            <div
                              key={paciente.vinculoId}
                              className="p-4 bg-white border border-slate-50 border-b-slate-100 last:border-b-transparent flex items-center justify-between rounded-2xl hover:bg-slate-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                  {paciente.avatar ? (
                                    <img
                                      src={paciente.avatar}
                                      alt={paciente.nome}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <FiUser className="text-slate-400" />
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-700 text-sm">
                                    {paciente.nome}
                                  </h3>
                                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                    CPF: {formatarCPF(paciente.cpf)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() =>
                                    handleVerPerfilPaciente(paciente)
                                  }
                                  className="p-2.5 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-xl transition-colors active:scale-95"
                                  title="Ver Perfil"
                                >
                                  <FiUser className="text-lg" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleRemoverPaciente(
                                      paciente.pacienteId,
                                      paciente.nome,
                                    )
                                  }
                                  className="p-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-colors active:scale-95"
                                  title="Desvincular Paciente"
                                >
                                  <FiUserX className="text-lg" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  )}

                  {/* ── ABA: EQUIPE ── */}
                  {abaAtiva === "equipe" && isGestorProfissionais && (
                    <section className="space-y-4">
                      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <FiShield className="text-indigo-500" /> Gestão da
                        Equipe
                      </h2>
                      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 space-y-2">
                        {/* Busca + filtro */}
                        <div className="flex items-center gap-2 p-2 pb-1">
                          <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 text-sm pointer-events-none" />
                            <input
                              type="text"
                              placeholder="Buscar por nome, especialidade ou CREFITO..."
                              value={inputEquipe}
                              onChange={(e) => setInputEquipe(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && setBuscaEquipe(inputEquipe)
                              }
                              className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 placeholder:text-slate-300 outline-none focus:border-slate-300 transition-colors"
                            />
                          </div>
                          <button
                            onClick={() => setBuscaEquipe(inputEquipe)}
                            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-2xl transition-colors active:scale-95 shrink-0"
                          >
                            Buscar
                          </button>
                          <button
                            onClick={() => setFiltroAberto(!filtroAberto)}
                            className={`p-2.5 rounded-2xl transition-colors active:scale-95 shrink-0 ${filtroEspecialidade !== "" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                            title="Filtros"
                          >
                            <FiFilter />
                          </button>
                        </div>
                        <AnimatePresence>
                          {filtroAberto && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="px-2 pb-1">
                                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Especialidade
                                  </span>
                                  <select
                                    value={filtroEspecialidade}
                                    onChange={(e) =>
                                      setFiltroEspecialidade(e.target.value)
                                    }
                                    className="text-xs font-bold bg-white border border-slate-200 text-slate-600 rounded-xl px-3 py-1.5 outline-none focus:border-indigo-400 transition-colors"
                                  >
                                    <option value="">Todas</option>
                                    {especialidadesUnicas.map((esp) => (
                                      <option
                                        key={esp as string}
                                        value={esp as string}
                                      >
                                        {esp as string}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {equipeFiltrada.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-sm font-medium">
                            Nenhum profissional encontrado.
                          </div>
                        ) : (
                          equipeFiltrada.map((prof) => (
                            <div
                              key={prof.profissionalId}
                              className="border border-slate-100 rounded-2xl overflow-hidden"
                            >
                              {/* Linha principal */}
                              <div
                                onClick={
                                  podeExpandirAccordion(prof)
                                    ? () =>
                                        setProfissionalAbertoId(
                                          profissionalAbertoId ===
                                            prof.profissionalId
                                            ? null
                                            : prof.profissionalId,
                                        )
                                    : undefined
                                }
                                className={`p-4 flex items-center justify-between transition-colors ${podeExpandirAccordion(prof) ? "cursor-pointer hover:bg-slate-50" : ""}`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                    {prof.avatar ? (
                                      <img
                                        src={prof.avatar}
                                        alt={prof.nome}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <FiUser className="text-slate-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 truncate">
                                      {prof.nome}
                                      {prof.dono ? (
                                        <span className="text-[9px] bg-indigo-700 text-indigo-100 uppercase tracking-widest px-2 py-0.5 rounded-full font-bold shrink-0">
                                          Dono
                                        </span>
                                      ) : prof.adminClinica ? (
                                        <span className="text-[9px] bg-indigo-100 text-indigo-700 uppercase tracking-widest px-2 py-0.5 rounded-full font-bold shrink-0">
                                          Admin
                                        </span>
                                      ) : null}
                                    </h3>
                                    <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                                      {prof.especialidade || "Geral"} • CREFITO:{" "}
                                      {prof.crefito || "Não informado"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  {/* Ver perfil */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/perfil/${prof.profissionalId}`,
                                        {
                                          state: {
                                            usuario: prof,
                                            tipo: "profissional",
                                          },
                                        },
                                      );
                                    }}
                                    className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-xl transition-colors active:scale-95"
                                    title="Ver Perfil"
                                  >
                                    <FiUser />
                                  </button>
                                  {/* Remover — visível para isGestorProfissionais exceto no dono */}
                                  {!prof.dono &&
                                    prof.profissionalId !==
                                      meuProfissionalId && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoverProfissional(
                                            prof.profissionalId,
                                            prof.nome,
                                          );
                                        }}
                                        className="p-2 bg-red-50 text-red-400 hover:bg-red-100 rounded-xl transition-colors active:scale-95"
                                        title="Remover da clínica"
                                      >
                                        <FiUserX />
                                      </button>
                                    )}
                                  {/* Chevron — para quem pode expandir */}
                                  {podeExpandirAccordion(prof) && (
                                    <div className="text-slate-400">
                                      {profissionalAbertoId ===
                                      prof.profissionalId ? (
                                        <FiChevronUp />
                                      ) : (
                                        <FiChevronDown />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Accordion de permissões */}
                              <AnimatePresence>
                                {podeExpandirAccordion(prof) &&
                                  profissionalAbertoId ===
                                    prof.profissionalId && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden bg-slate-50/50"
                                    >
                                      <div className="p-4 border-t border-slate-100 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                          {togglesPermissao.map((perm) => {
                                            const isChecked =
                                              (prof as any)[perm.key] || false;
                                            return (
                                              <div
                                                key={perm.key}
                                                onClick={() => {
                                                  const atualizados = [
                                                    ...equipe,
                                                  ];
                                                  const target =
                                                    atualizados.find(
                                                      (p) =>
                                                        p.profissionalId ===
                                                        prof.profissionalId,
                                                    );
                                                  if (target)
                                                    (target as any)[perm.key] =
                                                      !(target as any)[
                                                        perm.key
                                                      ];
                                                  setEquipe(atualizados);
                                                }}
                                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all text-[13px] font-semibold ${
                                                  isChecked
                                                    ? "bg-emerald-50/30 border-emerald-200"
                                                    : "bg-white border-slate-200 hover:bg-slate-50"
                                                }`}
                                              >
                                                <div className="flex items-center gap-2.5">
                                                  <perm.Icon
                                                    className={`text-lg ${isChecked ? "text-emerald-500" : "text-slate-300"}`}
                                                  />
                                                  <span
                                                    className={
                                                      isChecked
                                                        ? "text-slate-800"
                                                        : "text-slate-600"
                                                    }
                                                  >
                                                    {perm.label}
                                                  </span>
                                                </div>
                                                <div
                                                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${isChecked ? "bg-emerald-500" : "bg-slate-200"}`}
                                                >
                                                  <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 shadow-sm ${isChecked ? "translate-x-4" : "translate-x-1"}`}
                                                  />
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                        <button
                                          onClick={() =>
                                            handleAtualizarPermissoes(prof)
                                          }
                                          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                          <FiSave className="text-lg" /> Salvar
                                          Permissões
                                        </button>
                                      </div>
                                    </motion.div>
                                  )}
                              </AnimatePresence>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>

      <BuscarClinicaModal
        isOpen={isBuscaClinicaOpen}
        onClose={() => setIsBuscaClinicaOpen(false)}
      />

      {/* POP-UP DE APROVAÇÕES PENDENTES */}
      <AnimatePresence>
        {popupPendentesAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setPopupPendentesAberto(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col"
            >
              {/* Cabeçalho do pop-up */}
              <div className="flex items-center justify-between px-6 py-4 bg-amber-50 border-b border-amber-100 rounded-t-3xl shrink-0">
                <h2 className="text-sm font-bold text-amber-700 flex items-center gap-2">
                  <FiClock />
                  Aprovações Pendentes
                  <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {totalPendentes}
                  </span>
                </h2>
                <button
                  onClick={() => setPopupPendentesAberto(false)}
                  className="p-1.5 hover:bg-amber-100 rounded-xl transition-colors text-amber-600"
                >
                  <FiX />
                </button>
              </div>

              {/* Conteúdo rolável */}
              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {/* Profissionais pendentes */}
                {isGestorProfissionais && pendentesProfissionais.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                      Profissionais
                    </h3>
                    {pendentesProfissionais.map((solicitacao) => (
                      <div
                        key={solicitacao.id}
                        className="border border-amber-100 rounded-2xl overflow-hidden bg-white shadow-sm"
                      >
                        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {solicitacao.profissionalAvatar ? (
                                <img
                                  src={solicitacao.profissionalAvatar}
                                  alt={solicitacao.profissionalNome}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <FiUser className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-700 text-sm truncate">
                                {solicitacao.profissionalNome}
                              </h3>
                              <p className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                                {solicitacao.profissionalEspecialidade ||
                                  "Geral"}{" "}
                                {solicitacao.profissionalCrefito && (
                                  <>
                                    • CREFITO: {solicitacao.profissionalCrefito}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setSolicitacaoAbertaId(
                                solicitacaoAbertaId === solicitacao.id
                                  ? null
                                  : solicitacao.id,
                              )
                            }
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors shrink-0 ml-2"
                          >
                            {solicitacaoAbertaId === solicitacao.id ? (
                              <FiChevronUp />
                            ) : (
                              <FiChevronDown />
                            )}
                          </button>
                        </div>

                        <AnimatePresence>
                          {solicitacaoAbertaId === solicitacao.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-3 pt-2 border-t border-amber-50">
                                <div className="ml-[52px] space-y-1.5">
                                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                                    <FiMail className="shrink-0" />
                                    {solicitacao.profissionalEmail || "---"}
                                  </p>
                                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                                    <FiPhone className="shrink-0" />
                                    {formatarTelefone(
                                      solicitacao.profissionalTelefone,
                                    )}
                                  </p>
                                  {solicitacao.mensagem && (
                                    <p className="text-[11px] text-slate-500 italic pt-1">
                                      "{solicitacao.mensagem}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="px-4 pb-4 pt-2 border-t border-amber-50 flex gap-2">
                          <button
                            onClick={() =>
                              setModalResposta({
                                id: solicitacao.id,
                                nome: solicitacao.profissionalNome,
                                aprovado: false,
                              })
                            }
                            className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-xl transition-colors active:scale-95"
                          >
                            <FiX /> Recusar
                          </button>
                          <button
                            onClick={() =>
                              setModalResposta({
                                id: solicitacao.id,
                                nome: solicitacao.profissionalNome,
                                aprovado: true,
                              })
                            }
                            className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-xl transition-colors active:scale-95"
                          >
                            <FiCheck /> Aceitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pacientes pendentes */}
                {isGestorPacientes && pendentesPacientes.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                      Pacientes
                    </h3>
                    {pendentesPacientes.map((solicitacao) => (
                      <div
                        key={solicitacao.id}
                        className="border border-amber-100 rounded-2xl overflow-hidden bg-white shadow-sm"
                      >
                        <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {solicitacao.pacienteAvatar ? (
                                <img
                                  src={solicitacao.pacienteAvatar}
                                  alt={solicitacao.pacienteNome}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <FiUser className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-slate-700 text-sm truncate">
                                {solicitacao.pacienteNome}
                              </h3>
                              <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                                CPF: {formatarCPF(solicitacao.pacienteCpf)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setSolicitacaoAbertaId(
                                solicitacaoAbertaId === solicitacao.id
                                  ? null
                                  : solicitacao.id,
                              )
                            }
                            className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors shrink-0 ml-2"
                          >
                            {solicitacaoAbertaId === solicitacao.id ? (
                              <FiChevronUp />
                            ) : (
                              <FiChevronDown />
                            )}
                          </button>
                        </div>

                        <AnimatePresence>
                          {solicitacaoAbertaId === solicitacao.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-3 pt-2 border-t border-amber-50">
                                <div className="ml-[52px] space-y-1.5">
                                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                                    <FiMail className="shrink-0" />
                                    {solicitacao.pacienteEmail || "---"}
                                  </p>
                                  <p className="text-[11px] text-slate-400 flex items-center gap-2">
                                    <FiPhone className="shrink-0" />
                                    {formatarTelefone(
                                      solicitacao.pacienteTelefone,
                                    )}
                                  </p>
                                  {solicitacao.mensagem && (
                                    <p className="text-[11px] text-slate-500 italic pt-1">
                                      "{solicitacao.mensagem}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="px-4 pb-4 pt-2 border-t border-amber-50 flex gap-2">
                          <button
                            onClick={() =>
                              setModalResposta({
                                id: solicitacao.id,
                                nome: solicitacao.pacienteNome,
                                aprovado: false,
                              })
                            }
                            className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-xl transition-colors active:scale-95"
                          >
                            <FiX /> Recusar
                          </button>
                          <button
                            onClick={() =>
                              setModalResposta({
                                id: solicitacao.id,
                                nome: solicitacao.pacienteNome,
                                aprovado: true,
                              })
                            }
                            className="flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-xl transition-colors active:scale-95"
                          >
                            <FiCheck /> Aceitar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Exercícios pendentes */}
                {isGestorExercicios && pendentesExercicios.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                      Exercícios
                    </h3>
                    {pendentesExercicios.map((solic) => (
                      <div
                        key={solic.id}
                        className="bg-white border border-amber-100 p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">
                            {solic.nome}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            Por: {solic.solicitanteNome}
                          </p>
                          {solic.mensagem && (
                            <p className="text-[10px] text-slate-400 italic truncate mt-1">
                              "{solic.mensagem}"
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() =>
                              setModalResposta({
                                id: solic.id,
                                nome: solic.nome,
                                aprovado: false,
                              })
                            }
                            className="p-2.5 bg-red-100 text-red-500 rounded-xl hover:bg-red-200 transition-colors active:scale-95"
                          >
                            <FiX />
                          </button>
                          <button
                            onClick={() =>
                              setModalResposta({
                                id: solic.id,
                                nome: solic.nome,
                                aprovado: true,
                              })
                            }
                            className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors active:scale-95"
                          >
                            <FiCheck />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMAÇÃO DE RESPOSTA */}
      <AnimatePresence>
        {modalResposta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 relative overflow-hidden"
            >
              <div
                className={`absolute top-0 left-0 w-full h-2 ${modalResposta.aprovado ? "bg-emerald-500" : "bg-red-500"}`}
              />
              <div className="mt-2 text-center">
                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                  {modalResposta.aprovado
                    ? "Aprovar Solicitação"
                    : "Recusar Solicitação"}
                </h3>
                <p className="text-sm text-slate-500 mt-2">
                  Deseja {modalResposta.aprovado ? "aceitar" : "recusar"} a
                  solicitação de{" "}
                  <span className="font-bold text-slate-700">
                    {modalResposta.nome}
                  </span>
                  ?
                </p>
              </div>
              <div className="mt-6">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Mensagem (Opcional)
                </label>
                <textarea
                  value={textoResposta}
                  onChange={(e) => setTextoResposta(e.target.value)}
                  placeholder={
                    modalResposta.aprovado
                      ? "Deixe uma mensagem..."
                      : "Explique o motivo da recusa..."
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 transition-colors resize-none h-24"
                  maxLength={500}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setModalResposta(null);
                    setTextoResposta("");
                  }}
                  disabled={processandoResposta}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors active:scale-95 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarResposta}
                  disabled={processandoResposta}
                  className={`flex-1 py-3 font-bold rounded-xl text-white shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 text-sm ${
                    modalResposta.aprovado
                      ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                      : "bg-red-500 hover:bg-red-600 shadow-red-200"
                  }`}
                >
                  {processandoResposta ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : modalResposta.aprovado ? (
                    <>
                      <FiCheck className="text-lg" /> Confirmar
                    </>
                  ) : (
                    <>
                      <FiX className="text-lg" /> Recusar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StartPageProfissional;
