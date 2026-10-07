import { useCallback, useEffect, useRef, useState } from "react";
import type { ConfigMotor, EstadoMotor, FaseExercicio } from "./tipos";

/** Segundos de preparação antes de cada série. */
const TEMPO_PREPARO = 3;

/** Frequência de atualização: suave o bastante para animar, barata no mobile. */
const INTERVALO_MS = 50;

const duracaoDaFase = (
  fase: FaseExercicio,
  config: ConfigMotor,
  fimDeSerie: boolean,
): number => {
  switch (fase) {
    case "PREPARANDO":
      return TEMPO_PREPARO;
    case "ACAO_PRINCIPAL":
      return config.tempoPrincipal;
    case "ACAO_SECUNDARIA":
      return config.tempoSecundario;
    case "PAUSA":
      return fimDeSerie ? config.tempoPausaSeries : config.tempoPausa;
    default:
      return 0;
  }
};

/**
 * Máquina de estados do exercício: fases, séries e repetições.
 *
 * Substitui o `setTimeout` de 1 em 1 segundo da versão anterior, que
 * acumulava desvio, tratava durações fracionárias (ex.: 2,5 s) de forma
 * errada e fazia cada fase durar uma marcação a mais do que o configurado.
 * Aqui o tempo decorrido é medido contra um relógio monotônico, de modo que
 * a duração real bate com a prescrita mesmo se o navegador engasgar.
 */
export function useMotorExercicio(config: ConfigMotor) {
  const [fase, setFase] = useState<FaseExercicio>("PREPARANDO");
  const [serieAtual, setSerieAtual] = useState(1);
  const [repAtual, setRepAtual] = useState(1);
  const [pausado, setPausado] = useState(false);
  const [decorrido, setDecorrido] = useState(0);

  /**
   * Instante (performance.now) em que a fase atual começou a correr.
   * Inicia em 0 e é definido no efeito: chamar `performance.now()` como
   * valor inicial do `useRef` executa-o em toda renderização.
   */
  const inicioRef = useRef(0);
  /** Tempo já acumulado na fase antes da pausa corrente. */
  const acumuladoRef = useRef(0);

  /** A pausa depois da última repetição é o descanso entre séries. */
  const fimDeSerie = repAtual >= config.repeticoesTotais;
  const duracao = duracaoDaFase(fase, config, fimDeSerie);

  const iniciarFase = useCallback((proxima: FaseExercicio) => {
    acumuladoRef.current = 0;
    inicioRef.current = performance.now();
    setDecorrido(0);
    setFase(proxima);
  }, []);

  /** Decide qual é a próxima fase quando a atual termina. */
  const avancar = useCallback(() => {
    switch (fase) {
      case "PREPARANDO":
        return iniciarFase("ACAO_PRINCIPAL");

      case "ACAO_PRINCIPAL":
        return iniciarFase("ACAO_SECUNDARIA");

      case "ACAO_SECUNDARIA":
        // Última repetição da última série: não há o que esperar.
        if (fimDeSerie && serieAtual >= config.seriesTotais)
          return setFase("CONCLUIDO");
        return iniciarFase("PAUSA");

      case "PAUSA":
        if (repAtual < config.repeticoesTotais) {
          setRepAtual((r) => r + 1);
          return iniciarFase("ACAO_PRINCIPAL");
        }
        if (serieAtual < config.seriesTotais) {
          setSerieAtual((s) => s + 1);
          setRepAtual(1);
          return iniciarFase("PREPARANDO");
        }
        return setFase("CONCLUIDO");

      default:
        return undefined;
    }
  }, [
    fase,
    fimDeSerie,
    repAtual,
    serieAtual,
    config.repeticoesTotais,
    config.seriesTotais,
    iniciarFase,
  ]);

  useEffect(() => {
    if (pausado || fase === "CONCLUIDO") return;

    inicioRef.current = performance.now();

    const id = window.setInterval(() => {
      const total =
        acumuladoRef.current + (performance.now() - inicioRef.current) / 1000;

      if (total >= duracao) {
        setDecorrido(duracao);
        avancar();
      } else {
        setDecorrido(total);
      }
    }, INTERVALO_MS);

    return () => window.clearInterval(id);
  }, [pausado, fase, duracao, avancar]);

  const alternarPausa = useCallback(() => {
    setPausado((estavaPausado) => {
      if (estavaPausado) {
        // Ao retomar, o relógio recomeça de onde parou.
        inicioRef.current = performance.now();
      } else {
        acumuladoRef.current += (performance.now() - inicioRef.current) / 1000;
      }
      return !estavaPausado;
    });
  }, []);

  const estado: EstadoMotor = {
    fase,
    tempoRestante: Math.max(0, Math.ceil(duracao - decorrido)),
    progresso: duracao > 0 ? Math.min(1, decorrido / duracao) : 0,
    serieAtual,
    repAtual,
    pausado,
    pausaEntreSeries: fase === "PAUSA" && fimDeSerie,
  };

  return { estado, alternarPausa };
}

/**
 * Normaliza a customização vinda do backend, aplicando limites mínimos.
 * Valores ausentes ou inválidos caem para o padrão clínico conservador.
 */
export const normalizarConfig = (
  customizacao: Record<string, unknown> | null | undefined,
): ConfigMotor => {
  const c = customizacao ?? {};
  const numero = (valor: unknown, padrao: number, minimo: number) => {
    const n = Number(valor);
    return Number.isFinite(n) && n > 0 ? Math.max(minimo, n) : padrao;
  };

  // A pausa entre séries aceita 0 (emendar as séries). Ausente nas
  // prescrições anteriores ao campo: herda a pausa entre repetições, que é
  // como o motor se comportava antes.
  const tempoPausa = numero(c.tempoDescanso, 2, 0.5);
  const pausaSeries = Number(c.tempoDescansoSeries);
  const tempoPausaSeries =
    c.tempoDescansoSeries !== null &&
    c.tempoDescansoSeries !== undefined &&
    c.tempoDescansoSeries !== "" &&
    Number.isFinite(pausaSeries) &&
    pausaSeries >= 0
      ? pausaSeries
      : tempoPausa;

  return {
    acaoPrincipal: String(c.acaoPrincipal || "Contraia"),
    acaoSecundaria: String(c.acaoSecundaria || "Relaxe"),
    tempoPrincipal: numero(c.tempoPrincipal, 3, 0.5),
    tempoSecundario: numero(c.tempoSecundario, 3, 0.5),
    tempoPausa,
    tempoPausaSeries,
    seriesTotais: Math.round(numero(c.series, 1, 1)),
    repeticoesTotais: Math.round(numero(c.repeticoes, 10, 1)),
  };
};
