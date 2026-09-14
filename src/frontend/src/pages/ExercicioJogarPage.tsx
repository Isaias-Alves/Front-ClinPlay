import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiAward, FiCheck, FiPause, FiPlay, FiStar, FiX } from "react-icons/fi";
import { useApp } from "@contexts";
import { useManterTelaAcesa, useTratamentoSocket } from "@hooks";
import { normalizarConfig, obterJogo, useMotorExercicio } from "@games";
import type { PrescricaoView } from "@interfaces";

const TEXTO_DA_FASE: Record<string, string> = {
  PREPARANDO: "Prepare-se...",
  PAUSA: "Descanse...",
  CONCLUIDO: "Treino Finalizado!",
};

/**
 * Shell de execução de um exercício.
 *
 * Cuida de cronometragem, HUD e envio de feedback; o visual fica a cargo do
 * minigame resolvido a partir do jogo da prescrição (ver `src/games`).
 */
export function ExercicioJogarPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { jogo: jogoDaUrl } = useParams<{ jogo: string }>();
  const { confirmar, notificar } = useApp();

  const prescricao = location.state?.prescricao as PrescricaoView | undefined;
  const tratamentoId = location.state?.tratamentoId as string | undefined;

  const sessaoValida = Boolean(prescricao && tratamentoId);

  useEffect(() => {
    if (!sessaoValida) {
      notificar("Sessão inválida. Retornando ao início.", "erro");
      navigate("/inicio", { replace: true });
    }
  }, [sessaoValida, navigate, notificar]);

  // O motor visual vem da prescrição; a URL é apenas o fallback.
  const jogo = obterJogo(prescricao?.exercicioJogo || jogoDaUrl);
  const MotorVisual = jogo.componente;

  const config = normalizarConfig(prescricao?.customizacao);
  const { estado, alternarPausa } = useMotorExercicio(config);
  const { fase, tempoRestante, serieAtual, repAtual, pausado } = estado;

  // O paciente acompanha o motor visual sem tocar no aparelho: sem isto a
  // tela apaga no meio da série. Liberado ao concluir ou ao pausar, para
  // não segurar a tela acesa à toa.
  useManterTelaAcesa(sessaoValida && fase !== "CONCLUIDO" && !pausado);

  const [avaliacao, setAvaliacao] = useState(0);
  const [comentario, setComentario] = useState("");
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);

  const { enviar } = useTratamentoSocket(tratamentoId ?? "", {
    onEvento: (evento) => {
      if (evento.evento === "FEEDBACK_CRIADO") {
        notificar("Progresso sincronizado com sucesso!", "sucesso");
        navigate("/inicio");
      }
    },
    onErro: (erro) => {
      notificar(erro?.mensagem || "Erro ao salvar progresso.", "erro");
      setEnviandoFeedback(false);
    },
  });

  const textoInstrucao =
    fase === "ACAO_PRINCIPAL"
      ? config.acaoPrincipal
      : fase === "ACAO_SECUNDARIA"
        ? config.acaoSecundaria
        : (TEXTO_DA_FASE[fase] ?? "");

  const handleSair = async () => {
    const sair = await confirmar({
      mensagem:
        "Deseja interromper o exercício? O seu progresso atual não será guardado.",
      rotuloConfirmar: "Interromper",
      destrutivo: true,
    });
    if (sair) navigate(-1);
  };

  const handleEnviarFeedback = () => {
    if (avaliacao === 0) {
      notificar("Por favor, avalie a dificuldade do exercício.", "erro");
      return;
    }
    setEnviandoFeedback(true);
    enviar({
      tipo: "CRIAR_FEEDBACK",
      prescricaoId: prescricao!.id,
      avaliacao,
      comentario: comentario.trim() || undefined,
    });
  };

  if (!sessaoValida) return null;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-slate-900 font-sans text-white">
      <header className="z-10 flex items-center justify-between p-4 sm:p-6">
        <button
          onClick={handleSair}
          aria-label="Sair do exercício"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md transition-all hover:bg-white/20"
        >
          <FiX className="text-2xl" />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-400">
            {prescricao!.exercicioNome}
          </h1>
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            <p className="text-[10px] font-bold uppercase tracking-tighter text-emerald-400">
              {jogo.nome}
            </p>
          </div>
        </div>

        <button
          onClick={alternarPausa}
          disabled={fase === "CONCLUIDO"}
          aria-label={pausado ? "Retomar exercício" : "Pausar exercício"}
          className={`flex h-12 w-12 items-center justify-center rounded-2xl backdrop-blur-md transition-all ${
            pausado
              ? "bg-amber-500 text-white shadow-lg"
              : "bg-white/10 text-white hover:bg-white/20"
          }`}
        >
          {pausado ? (
            <FiPlay className="text-2xl" />
          ) : (
            <FiPause className="text-2xl" />
          )}
        </button>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-10 px-4 pb-8">
        <div className="flex h-32 flex-col justify-end text-center">
          <AnimatePresence mode="wait">
            <motion.h2
              key={fase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 text-4xl font-black uppercase italic tracking-tight sm:text-5xl"
            >
              {textoInstrucao}
            </motion.h2>
          </AnimatePresence>

          <div className="bg-gradient-to-b from-white to-slate-500 bg-clip-text font-mono text-7xl font-black tabular-nums text-transparent">
            {fase !== "CONCLUIDO" ? tempoRestante : "✓"}
          </div>
        </div>

        {/* Minigame selecionado para este exercício */}
        <div className="flex w-full flex-1 items-center justify-center">
          <MotorVisual estado={estado} config={config} />
        </div>

        {fase !== "CONCLUIDO" && (
          <div className="flex items-center gap-8 rounded-[32px] border border-white/10 bg-white/5 px-8 py-4 shadow-2xl backdrop-blur-xl sm:gap-10 sm:px-10 sm:py-5">
            <div className="text-center">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Série
              </p>
              <p className="text-3xl font-black">
                {serieAtual}
                <span className="text-xl font-medium text-slate-600">
                  /{config.seriesTotais}
                </span>
              </p>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Repetição
              </p>
              <p className="text-3xl font-black">
                {repAtual}
                <span className="text-xl font-medium text-slate-600">
                  /{config.repeticoesTotais}
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
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/90 p-4 backdrop-blur-md sm:items-center"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="flex w-full flex-col rounded-[40px] bg-white p-8 text-slate-800 shadow-2xl sm:max-w-md"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-600 shadow-inner">
                <FiAward />
              </div>

              <div className="mb-8 text-center">
                <h2 className="mb-2 text-2xl font-black tracking-tight">
                  Excelente Trabalho!
                </h2>
                <p className="text-sm font-medium text-slate-500">
                  O seu relatório de execução será enviado para o profissional
                  agora.
                </p>
              </div>

              <div
                role="radiogroup"
                aria-label="Dificuldade do exercício"
                className="mb-8 flex justify-center gap-3"
              >
                {[1, 2, 3, 4, 5].map((estrela) => (
                  <button
                    key={estrela}
                    role="radio"
                    aria-checked={avaliacao === estrela}
                    aria-label={`${estrela} de 5`}
                    onClick={() => setAvaliacao(estrela)}
                    className="transition-transform active:scale-90"
                  >
                    <FiStar
                      className={`text-4xl ${
                        avaliacao >= estrela
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <label
                  htmlFor="observacoes-treino"
                  className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400"
                >
                  Observações do Treino
                </label>
                <textarea
                  id="observacoes-treino"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Como foi o esforço? Sentiu fadiga?"
                  maxLength={500}
                  className="h-28 w-full resize-none rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm outline-none transition-all focus:border-emerald-500"
                />
                <p className="mt-1.5 mr-1 text-right text-[10px] font-medium text-slate-400">
                  {comentario.length}/500
                </p>
              </div>

              <button
                onClick={handleEnviarFeedback}
                disabled={enviandoFeedback}
                className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-emerald-500 py-4 text-lg font-black text-white shadow-xl shadow-emerald-200 transition-all active:scale-95 hover:bg-emerald-600 disabled:opacity-70"
              >
                {enviandoFeedback ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <FiCheck /> Finalizar e Guardar
                  </>
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
