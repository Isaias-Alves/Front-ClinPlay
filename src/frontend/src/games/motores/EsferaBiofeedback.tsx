import { motion, useReducedMotion } from "framer-motion";
import type { PropsMotorVisual } from "../tipos";

/** Escala da esfera em cada fase. Cresce no esforço, encolhe no descanso. */
const ESCALA_POR_FASE: Record<string, number> = {
  ACAO_PRINCIPAL: 2.6,
  ACAO_SECUNDARIA: 1.4,
  PAUSA: 1,
  PREPARANDO: 1,
};

const COR_POR_FASE: Record<string, string> = {
  ACAO_PRINCIPAL: "#34d399",
  ACAO_SECUNDARIA: "#60a5fa",
  PAUSA: "#1e293b",
  PREPARANDO: "#f59e0b",
};

/**
 * Motor visual original: uma esfera que expande na contração e recolhe no
 * relaxamento. Serve a exercícios de contração/relaxamento sustentados.
 */
export function EsferaBiofeedback({ estado }: PropsMotorVisual) {
  const { fase } = estado;
  const emEsforco = fase === "ACAO_PRINCIPAL";
  // Motor padrão do app: numa série de 10 minutos os laços infinitos
  // mantêm o compositor ativo sem pausa. Respeitar a preferência do
  // sistema poupa bateria e atende quem tem sensibilidade a movimento.
  const reduzirMovimento = useReducedMotion();

  return (
    <div className="relative flex h-56 w-56 items-center justify-center">
      {/* Anéis de referência */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20"
      >
        <div
          className={`absolute h-56 w-56 rounded-full border border-white/20 ${
            reduzirMovimento ? "" : "animate-pulse"
          }`}
        />
        <div className="absolute h-80 w-80 rounded-full border border-white/10" />
      </div>

      <motion.div
        animate={{
          scale: ESCALA_POR_FASE[fase] ?? 1,
          backgroundColor: COR_POR_FASE[fase] ?? "#1e293b",
          boxShadow: emEsforco
            ? "0 0 50px rgba(52, 211, 153, 0.4)"
            : "0 0 20px rgba(0,0,0,0.2)",
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className="relative z-20 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/10"
      >
        {emEsforco && !reduzirMovimento && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-0 rounded-full bg-emerald-400"
          />
        )}
      </motion.div>
    </div>
  );
}

export default EsferaBiofeedback;
