import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowRight, FiArrowLeft, FiPlay } from "react-icons/fi";
import { RiGamepadLine, RiRocketLine, RiShip2Line } from "react-icons/ri";

const JOGOS_DISPONIVEIS = [
  {
    id: "FLAPPY_BIRD",
    nome: "Flappy Bio",
    desc: "Ideal para treinos de contração rápida (Fast Fibers). O personagem sobe instantaneamente ao detetar esforço.",
    icon: <RiGamepadLine />,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    id: "SPACE_SHOOTER",
    nome: "Resistência Espacial",
    desc: "Focado em sustentação (Tônicas). Requer que o paciente mantenha a contração para manter a nave em órbita.",
    icon: <RiRocketLine />,
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    id: "SUBMARINO",
    nome: "Controle Abissal",
    desc: "Treino de controle fino e relaxamento. O biofeedback é invertido ou exige descida controlada.",
    icon: <RiShip2Line />,
    color: "text-cyan-500",
    bg: "bg-cyan-50",
  },
];

export function JogosPage() {
  const navigate = useNavigate();
  const { clinicaId } = useParams<{ clinicaId: string }>();

  const carouselRef = useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState(0);

  useEffect(() => {
    if (carouselRef.current) {
      setDragWidth(
        carouselRef.current.scrollWidth - carouselRef.current.offsetWidth,
      );
    }
  }, []);

  const handleSelecionarJogo = (jogoId: string) => {
    navigate(`/clinica/${clinicaId}/exercicios/novo`, {
      state: { jogoSelecionado: jogoId },
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/15 rounded-full blur-[100px] pointer-events-none"
      />

      <header className="text-center mb-10 max-w-2xl relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-6 py-2.5 bg-white text-slate-500 hover:text-slate-800 font-bold rounded-full shadow-sm text-sm inline-flex items-center gap-2 transition-all active:scale-95 border border-slate-100"
        >
          <FiArrowLeft /> Voltar para o Painel
        </button>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight"
        >
          Selecione o Motor Visual
        </motion.h1>
        <p className="text-slate-500 font-medium text-sm md:text-base px-4">
          Cada motor possui uma dinâmica de Biofeedback diferente. Escolha o que
          melhor se adapta ao objetivo clínico.
        </p>
      </header>

      <div
        className="relative w-full max-w-6xl z-10 overflow-hidden py-8 px-2"
        ref={carouselRef}
      >
        <motion.div
          className="flex gap-6 cursor-grab active:cursor-grabbing px-4"
          drag="x"
          dragConstraints={{ right: 0, left: -dragWidth }}
          whileTap={{ cursor: "grabbing" }}
        >
          {JOGOS_DISPONIVEIS.map((jogo) => (
            <motion.div
              key={jogo.id}
              whileHover={{ y: -8 }}
              className="min-w-[300px] sm:min-w-[360px] bg-white rounded-3xl p-8 flex flex-col justify-between shadow-xl shadow-slate-200/60 border border-slate-200 transition-all duration-300"
            >
              <div>
                <div
                  className={`w-16 h-16 ${jogo.bg} ${jogo.color} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm`}
                >
                  {jogo.icon}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3">
                  {jogo.nome}
                </h2>
                <p className="text-sm font-medium text-slate-400 leading-relaxed mb-8">
                  {jogo.desc}
                </p>
              </div>

              <button
                onClick={() => handleSelecionarJogo(jogo.id)}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 group shadow-md active:scale-95"
              >
                <FiPlay /> Iniciar Configuração{" "}
                <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default JogosPage;
