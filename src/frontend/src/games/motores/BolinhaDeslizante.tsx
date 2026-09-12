import { motion, useReducedMotion } from "framer-motion";
import type { EstadoMotor, PropsMotorVisual } from "../tipos";

/**
 * Fração da pista já percorrida, de 0 (partida, à esquerda) a 1 (alvo, à
 * direita), para cada fase:
 *
 * - PREPARANDO:       parada no ponto de partida;
 * - ACAO_PRINCIPAL:   desliza da esquerda para a direita ao longo da contração;
 * - ACAO_SECUNDARIA:  volta ao início durante o relaxamento;
 * - PAUSA/CONCLUIDO:  em repouso à esquerda.
 *
 * A função é contínua nas transições de fase (o fim da principal e o começo
 * da secundária valem ambos 1), então a bolinha nunca "salta".
 */
const avancoDaFase = ({ fase, progresso }: EstadoMotor): number => {
  switch (fase) {
    case "ACAO_PRINCIPAL":
      return progresso;
    case "ACAO_SECUNDARIA":
      return 1 - progresso;
    default:
      return 0;
  }
};

/** A partir daqui a contração conta como levada até o alvo. */
const LIMIAR_ALVO = 0.97;

const descreverEstado = (
  { fase }: EstadoMotor,
  { acaoPrincipal, acaoSecundaria }: PropsMotorVisual["config"],
): string => {
  switch (fase) {
    case "ACAO_PRINCIPAL":
      return `${acaoPrincipal}: a bolinha avança para o alvo à direita.`;
    case "ACAO_SECUNDARIA":
      return `${acaoSecundaria}: a bolinha volta ao ponto de partida.`;
    case "PAUSA":
      return "Descanso: a bolinha está parada na partida.";
    case "CONCLUIDO":
      return "Treino finalizado.";
    default:
      return "Preparando: a bolinha aguarda na partida.";
  }
};

/**
 * Segundo motor visual: uma bolinha que desliza da esquerda para a direita
 * acompanhando a contração e retorna ao ponto de partida no relaxamento.
 *
 * A leitura é linear em vez de radial, o que dá ao paciente uma noção clara
 * de "quanto falta" — útil em contrações sustentadas longas, em que a esfera
 * pulsante não comunica bem o tempo restante.
 *
 * Posição e rastro são animados só com `transform` (translateX/scaleX), que
 * o navegador resolve na GPU. Animar `left`/`width`, como na primeira
 * versão, forçava um recálculo de layout a cada 50 ms e engasgava em
 * telemóveis mais modestos.
 */
export function BolinhaDeslizante({ estado, config }: PropsMotorVisual) {
  const { fase } = estado;
  const reduzirMovimento = useReducedMotion();

  const avanco = avancoDaFase(estado);
  const avancando = fase === "ACAO_PRINCIPAL";
  const retornando = fase === "ACAO_SECUNDARIA";
  const emMovimento = avancando || retornando;
  const alvoAtingido = avancando && avanco > LIMIAR_ALVO;

  const corBolinha = avancando
    ? "bg-emerald-400"
    : retornando
      ? "bg-sky-400"
      : "bg-slate-600";

  // Acompanha o relógio do motor (uma marcação a cada 50 ms): a transição
  // existe só para suavizar entre marcações, nunca para definir a duração
  // do exercício.
  const seguirMotor = { duration: 0.08, ease: "linear" } as const;

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-5 px-2">
      <div
        role="img"
        aria-label={descreverEstado(estado, config)}
        className="relative h-28 w-full"
      >
        {/* Trilho */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-white/10"
        />

        {/*
          Faixa útil: recuada 1.75rem de cada lado, exatamente metade da
          bolinha (3rem) mais folga. Como a bolinha é posicionada por
          `translateX` em percentagem *desta* faixa, ela nunca escapa da
          pista, em qualquer largura de tela.
        */}
        <div aria-hidden className="absolute inset-y-0 left-7 right-7">
          {/* Trecho já percorrido */}
          <motion.div
            className="absolute inset-x-0 top-1/2 h-3 origin-left -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500/30 to-emerald-400/70"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: avanco }}
            transition={seguirMotor}
          />

          {/* Partida */}
          <div className="absolute left-0 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/20" />

          {/* Alvo */}
          <motion.div
            className="absolute right-0 top-1/2 flex h-16 w-16 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2"
            animate={{
              borderColor: alvoAtingido
                ? "rgba(52, 211, 153, 0.9)"
                : "rgba(255,255,255,0.15)",
              backgroundColor: alvoAtingido
                ? "rgba(52, 211, 153, 0.15)"
                : "rgba(255,255,255,0.03)",
              scale: alvoAtingido ? 1.15 : 1,
            }}
            transition={{ duration: 0.25 }}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                alvoAtingido ? "bg-emerald-400" : "bg-white/25"
              }`}
            />
          </motion.div>

          {/*
            Carro: ocupa toda a faixa útil, então `translateX` em percentagem
            corresponde à fração da pista percorrida. A bolinha vai presa na
            sua borda esquerda.
          */}
          <motion.div
            className="absolute inset-y-0 left-0 w-full"
            animate={{ x: `${avanco * 100}%` }}
            transition={seguirMotor}
          >
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2">
              {emMovimento && !reduzirMovimento && (
                <motion.div
                  className={`absolute inset-0 -m-2 rounded-full ${corBolinha} opacity-25 blur-md`}
                  animate={{ scale: [1, 1.25, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
              )}
              <div
                className={`h-12 w-12 rounded-full border-4 border-white/20 shadow-lg transition-colors duration-300 ${corBolinha}`}
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Legenda das extremidades */}
      <div className="flex w-full items-center justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <span className={retornando ? "text-sky-400" : undefined}>
          {config.acaoSecundaria}
        </span>
        <span className={alvoAtingido ? "text-emerald-400" : undefined}>
          {config.acaoPrincipal}
        </span>
      </div>
    </div>
  );
}

export default BolinhaDeslizante;
