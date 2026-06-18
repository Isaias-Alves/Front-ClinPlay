import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@contexts";
import { useTratamentoSocket } from "../hooks/useTratamentoSocket";
import { FiX, FiPause, FiPlay, FiStar, FiCheck, FiAward } from "react-icons/fi";

type FaseExercicio =
  | "PREPARANDO"
  | "ACAO_PRINCIPAL"
  | "ACAO_SECUNDARIA"
  | "PAUSA"
  | "CONCLUIDO";

export function ExercicioJogarPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notificar } = useApp();

  const prescricao = location.state?.prescricao;
  const tratamentoId = location.state?.tratamentoId;

  useEffect(() => {
    if (!prescricao || !tratamentoId) {
      notificar("Sessão inválida. Retornando ao início.", "erro");
      navigate("/inicio");
    }
  }, [prescricao, tratamentoId, navigate, notificar]);

  // ==========================================
  // CONFIGURAÇÃO VINDA DO BACKEND (Refletindo a ExercicioConfig)
  // ==========================================
  const config = prescricao?.customizacao || {};

  // Parâmetros de Jogo
  const acaoPrincipalStr = config.acaoPrincipal || "Contraia";
  const acaoSecundariaStr = config.acaoSecundaria || "Relaxe";
  const tempoPrincipal = Math.max(0.5, Number(config.tempoPrincipal) || 3);
  const tempoSecundario = Math.max(0.5, Number(config.tempoSecundario) || 3);
  const tempoPausa = Math.max(0.5, Number(config.tempoDescanso) || 2);

  // Parâmetros de Volume
  const seriesTotais = Math.max(1, Number(config.series) || 1);
  const repeticoesTotais = Math.max(1, Number(config.repeticoes) || 10);

  const [fase, setFase] = useState<FaseExercicio>("PREPARANDO");
  const [tempoRestante, setTempoRestante] = useState<number>(3); // 3s de preparação inicial
  const [serieAtual, setSerieAtual] = useState<number>(1);
  const [repAtual, setRepAtual] = useState<number>(1);
  const [isPausado, setIsPausado] = useState<boolean>(false);

  const [avaliacao, setAvaliacao] = useState<number>(0);
  const [comentario, setComentario] = useState<string>("");
  const [enviandoFeedback, setEnviandoFeedback] = useState<boolean>(false);

  const { enviar } = useTratamentoSocket(tratamentoId || "", {
    onEvento: (evento) => {
      if (evento.evento === "FEEDBACK_CRIADO") {
        notificar("Progresso sincronizado com sucesso!", "sucesso");
        navigate("/inicio");
      }
    },
    onErro: (erro) => {
      notificar(erro.mensagem || "Erro ao salvar progresso.", "erro");
      setEnviandoFeedback(false);
    },
  });

  // ==========================================
  // MOTOR DO JOGO (Corrigido para evitar o Double Render do Strict Mode)
  // ==========================================
  useEffect(() => {
    if (isPausado || fase === "CONCLUIDO") return;

    // Se ainda há tempo, apenas iniciamos um timeout de 1 segundo para decrementar
    if (tempoRestante > 0) {
      const timer = setTimeout(
        () => setTempoRestante((prev) => prev - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }

    // Se o tempo chegou a 0, fazemos a transição de fase de forma limpa
    switch (fase) {
      case "PREPARANDO":
        setFase("ACAO_PRINCIPAL");
        setTempoRestante(tempoPrincipal);
        break;

      case "ACAO_PRINCIPAL":
        setFase("ACAO_SECUNDARIA");
        setTempoRestante(tempoSecundario);
        break;

      case "ACAO_SECUNDARIA":
        setFase("PAUSA");
        setTempoRestante(tempoPausa);
        break;

      case "PAUSA":
        // Lógica de Repetições
        if (repAtual < repeticoesTotais) {
          setRepAtual((r) => r + 1);
          setFase("ACAO_PRINCIPAL");
          setTempoRestante(tempoPrincipal);
        }
        // Lógica de Séries
        else if (serieAtual < seriesTotais) {
          setSerieAtual((s) => s + 1);
          setRepAtual(1);
          setFase("PREPARANDO"); // Pequena pausa entre séries
          setTempoRestante(3);
        }
        // Fim do exercício
        else {
          setFase("CONCLUIDO");
        }
        break;
    }
  }, [
    tempoRestante,
    fase,
    isPausado,
    repAtual,
    serieAtual,
    seriesTotais,
    repeticoesTotais,
    tempoPrincipal,
    tempoSecundario,
    tempoPausa,
  ]);

  const getTextoInstrucao = () => {
    switch (fase) {
      case "PREPARANDO":
        return "Prepare-se...";
      case "ACAO_PRINCIPAL":
        return acaoPrincipalStr;
      case "ACAO_SECUNDARIA":
        return acaoSecundariaStr;
      case "PAUSA":
        return "Descanse...";
      case "CONCLUIDO":
        return "Treino Finalizado!";
      default:
        return "";
    }
  };

  const getScaleEsfera = () => {
    switch (fase) {
      case "ACAO_PRINCIPAL":
        return 2.6; // Cresce no principal
      case "ACAO_SECUNDARIA":
        return 1.4; // Diminui no secundário
      case "PAUSA":
        return 1.0; // Mínimo no descanso
      case "PREPARANDO":
        return 1.0;
      default:
        return 1.0;
    }
  };

  const handleSair = () => {
    if (
      confirm(
        "Deseja interromper o exercício? O seu progresso atual não será guardado.",
      )
    ) {
      navigate(-1);
    }
  };

  const handleEnviarFeedback = () => {
    if (avaliacao === 0) {
      notificar("Por favor, avalie a dificuldade do exercício.", "erro");
      return;
    }
    setEnviandoFeedback(true);
    enviar({
      tipo: "CRIAR_FEEDBACK",
      prescricaoId: prescricao.id,
      avaliacao: avaliacao,
      comentario: comentario.trim() || undefined,
    });
  };

  if (!prescricao || !tratamentoId) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col relative overflow-hidden font-sans">
      <header className="p-6 flex items-center justify-between z-10">
        <button
          onClick={handleSair}
          className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all"
        >
          <FiX className="text-2xl" />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-bold tracking-widest uppercase text-slate-400">
            {prescricao.exercicioNome}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
              Sessão em curso
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPausado(!isPausado)}
          disabled={fase === "CONCLUIDO"}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-md transition-all ${isPausado ? "bg-amber-500 text-white shadow-lg" : "bg-white/10 hover:bg-white/20 text-white"}`}
        >
          {isPausado ? (
            <FiPlay className="text-2xl" />
          ) : (
            <FiPause className="text-2xl" />
          )}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="text-center mb-16 h-32 flex flex-col justify-end">
          <AnimatePresence mode="wait">
            <motion.h2
              key={fase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-4xl sm:text-5xl font-black tracking-tight mb-4 uppercase italic"
            >
              {getTextoInstrucao()}
            </motion.h2>
          </AnimatePresence>

          <div className="text-7xl font-mono tabular-nums font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
            {fase !== "CONCLUIDO" ? tempoRestante : "✓"}
          </div>
        </div>

        {/* Esfera de Biofeedback */}
        <div className="relative w-56 h-56 flex items-center justify-center mb-16">
          {/* Círculos de fundo centrados na esfera */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-64 h-64 border border-white/20 rounded-full absolute animate-pulse"></div>
            <div className="w-[24rem] h-[24rem] border border-white/10 rounded-full absolute"></div>
          </div>
          <motion.div
            animate={{
              scale: getScaleEsfera(),
              backgroundColor:
                fase === "ACAO_PRINCIPAL"
                  ? "#34d399"
                  : fase === "ACAO_SECUNDARIA"
                    ? "#60a5fa"
                    : fase === "PAUSA"
                      ? "#1e293b"
                      : "#f59e0b",
              boxShadow:
                fase === "ACAO_PRINCIPAL"
                  ? "0 0 50px rgba(52, 211, 153, 0.4)"
                  : "0 0 20px rgba(0,0,0,0.2)",
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="w-24 h-24 rounded-full z-20 relative flex items-center justify-center border-4 border-white/10"
          >
            {fase === "ACAO_PRINCIPAL" && (
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 bg-emerald-400 rounded-full"
              />
            )}
          </motion.div>
        </div>

        {/* HUD de Progresso */}
        {fase !== "CONCLUIDO" && (
          <div className="flex items-center gap-10 bg-white/5 backdrop-blur-xl px-10 py-5 rounded-[32px] border border-white/10 shadow-2xl">
            <div className="text-center">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
                Série
              </p>
              <p className="text-3xl font-black">
                {serieAtual}
                <span className="text-slate-600 text-xl font-medium">
                  /{seriesTotais}
                </span>
              </p>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500 mb-1">
                Repetição
              </p>
              <p className="text-3xl font-black">
                {repAtual}
                <span className="text-slate-600 text-xl font-medium">
                  /{repeticoesTotais}
                </span>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Modal de Feedback Final */}
      <AnimatePresence>
        {fase === "CONCLUIDO" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full sm:max-w-md bg-white rounded-[40px] shadow-2xl flex flex-col p-8 text-slate-800"
            >
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
                <FiAward />
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-black tracking-tight mb-2">
                  Excelente Trabalho!
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  O seu relatório de execução será enviado para o profissional
                  agora.
                </p>
              </div>

              <div className="flex justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setAvaliacao(star)}
                    className="transition-transform active:scale-90"
                  >
                    <FiStar
                      className={`text-4xl ${avaliacao >= star ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                    />
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Observações do Treino
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Como foi o esforço? Sentiu fadiga?"
                  className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[24px] outline-none text-sm focus:border-emerald-500 transition-all resize-none h-28"
                />
              </div>

              <button
                onClick={handleEnviarFeedback}
                disabled={enviandoFeedback}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-[24px] shadow-xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
              >
                {enviandoFeedback ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Finalizar e Guardar</>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExercicioJogarPage;
