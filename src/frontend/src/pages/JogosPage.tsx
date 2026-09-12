import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowLeft, FiArrowRight, FiPlay } from "react-icons/fi";
import { JOGOS } from "@games";
import { criarContainerVariants, criarItemVariants } from "@utils";

const containerVariants = criarContainerVariants(0.08);
const itemVariants = criarItemVariants();

/** Vitrine dos motores visuais disponíveis para um novo exercício. */
export function JogosPage() {
  const navigate = useNavigate();
  const { clinicaId } = useParams<{ clinicaId: string }>();

  const handleSelecionarJogo = (jogoId: string) => {
    navigate(`/clinica/${clinicaId}/exercicios/novo`, {
      state: { jogoSelecionado: jogoId },
    });
  };

  return (
    <div className="relative min-h-dvh overflow-hidden bg-slate-100/50 px-4 py-8 sm:px-6">
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-400/15 blur-[100px]"
      />

      <header className="relative z-10 mx-auto mb-10 max-w-2xl text-center">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-6 py-2.5 text-sm font-bold text-slate-500 shadow-sm transition-all active:scale-95 hover:text-slate-800"
        >
          <FiArrowLeft /> Voltar para o Painel
        </button>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 text-3xl font-extrabold tracking-tight text-slate-800 md:text-4xl"
        >
          Selecione o Motor Visual
        </motion.h1>
        <p className="px-2 text-sm font-medium text-slate-500 md:text-base">
          Cada motor possui uma dinâmica de Biofeedback diferente. Escolha o que
          melhor se adapta ao objetivo clínico.
        </p>
      </header>

      {/*
        Grade responsiva em vez do carrossel arrastável anterior: no telemóvel
        o drag horizontal competia com o scroll vertical da página e escondia
        os jogos seguintes atrás de um gesto pouco descobrível.
      */}
      <motion.ul
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {JOGOS.map((jogo) => (
          <motion.li
            key={jogo.id}
            variants={itemVariants}
            whileHover={jogo.disponivel ? { y: -6 } : undefined}
            className={`flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8 ${
              jogo.disponivel ? "" : "opacity-60"
            }`}
          >
            <div>
              <div
                className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-sm ${jogo.corFundo} ${jogo.corTexto}`}
              >
                {jogo.icone}
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-800">
                  {jogo.nome}
                </h2>
                {!jogo.disponivel && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Em breve
                  </span>
                )}
              </div>
              <p className="mb-8 text-sm font-medium leading-relaxed text-slate-400">
                {jogo.descricao}
              </p>
            </div>

            <button
              onClick={() => handleSelecionarJogo(jogo.id)}
              disabled={!jogo.disponivel}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-sm font-bold text-white shadow-md transition-all active:scale-95 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              {jogo.disponivel ? (
                <>
                  <FiPlay /> Iniciar Configuração
                  <FiArrowRight className="transition-transform group-hover:translate-x-1" />
                </>
              ) : (
                "Motor visual em desenvolvimento"
              )}
            </button>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}

export default JogosPage;
