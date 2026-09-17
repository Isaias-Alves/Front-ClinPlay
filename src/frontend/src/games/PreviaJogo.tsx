import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { ConfigMotor, EstadoMotor, FaseExercicio } from "./tipos";
import type { JogoDefinicao } from "./tipos";

/**
 * Ciclo curto da demonstração, em segundos. Bem mais rápido que uma
 * prescrição real (3 s de contração, 3 s de relaxamento, 2 s de pausa): a
 * prévia precisa mostrar o movimento inteiro antes de a pessoa desistir de
 * olhar. A fase de preparo fica de fora — ali não acontece nada.
 */
const CICLO: Array<{ fase: FaseExercicio; duracao: number }> = [
  { fase: "ACAO_PRINCIPAL", duracao: 1.6 },
  { fase: "ACAO_SECUNDARIA", duracao: 1.3 },
  // Pausa curta: longa o bastante para o alvo da pista registar a chegada,
  // curta o bastante para a esfera não passar tempo demais apagada (na pausa
  // ela fica cinza-escuro, quase invisível sobre o fundo).
  { fase: "PAUSA", duracao: 0.45 },
];

/** Mesma cadência do motor real, para a prévia se mover igual ao exercício. */
const INTERVALO_MS = 50;

const CONFIG_DEMO: ConfigMotor = {
  acaoPrincipal: "Contraia",
  acaoSecundaria: "Relaxe",
  tempoPrincipal: CICLO[0].duracao,
  tempoSecundario: CICLO[1].duracao,
  tempoPausa: CICLO[2].duracao,
  seriesTotais: 1,
  repeticoesTotais: 1,
};

/** Quadro exibido quando a animação está parada (movimento reduzido). */
const QUADRO_PARADO: EstadoMotor = {
  fase: "ACAO_PRINCIPAL",
  tempoRestante: 1,
  // Perto do fim da contração: é o instante em que a esfera está grande e a
  // bolinha já chegou ao alvo — o que melhor resume cada motor num quadro só.
  progresso: 0.92,
  serieAtual: 1,
  repAtual: 1,
  pausado: true,
};

/**
 * Percorre o ciclo de fases enquanto `ativo`, devolvendo o mesmo
 * `EstadoMotor` que o exercício de verdade entrega aos jogos.
 */
function useCicloDemonstracao(ativo: boolean): EstadoMotor {
  const [passo, setPasso] = useState(0);
  const [decorrido, setDecorrido] = useState(0);

  useEffect(() => {
    if (!ativo) return;

    let inicio = performance.now();
    const id = window.setInterval(() => {
      const total = (performance.now() - inicio) / 1000;

      setPasso((atual) => {
        if (total < CICLO[atual].duracao) {
          setDecorrido(total);
          return atual;
        }
        inicio = performance.now();
        setDecorrido(0);
        return (atual + 1) % CICLO.length;
      });
    }, INTERVALO_MS);

    return () => window.clearInterval(id);
  }, [ativo]);

  const { fase, duracao } = CICLO[passo];

  return {
    fase,
    tempoRestante: Math.max(0, Math.ceil(duracao - decorrido)),
    progresso: Math.min(1, decorrido / duracao),
    serieAtual: 1,
    repAtual: 1,
    pausado: !ativo,
  };
}

/**
 * Só mantém a prévia rodando quando ela está de facto à vista.
 *
 * Três motores animando ao mesmo tempo — dois deles com laços `Infinity` —
 * gastam bateria e compositor de graça enquanto a pessoa rola a página ou
 * troca de aba. Num app mobile-first isso não é detalhe.
 */
function useVisivel<T extends Element>(ref: React.RefObject<T | null>) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = ref.current;
    if (!alvo) return;

    const observador = new IntersectionObserver(
      ([entrada]) => setVisivel(entrada.isIntersecting),
      { rootMargin: "80px" },
    );
    observador.observe(alvo);

    const aoTrocarAba = () =>
      document.hidden ? setVisivel(false) : setVisivel(true);
    document.addEventListener("visibilitychange", aoTrocarAba);

    return () => {
      observador.disconnect();
      document.removeEventListener("visibilitychange", aoTrocarAba);
    };
  }, [ref]);

  return visivel;
}

interface PreviaJogoProps {
  jogo: JogoDefinicao;
  /** Rótulo alternativo para quem usa leitor de tela. */
  rotulo?: string;
}

/**
 * Prévia animada de um minigame, na vitrine de motores.
 *
 * Renderiza o **componente real** do jogo num ciclo curto, em vez de exibir
 * um GIF gravado. Um GIF fluido destas animações passaria de 300 kB cada — os
 * três juntos pesariam mais que todo o JavaScript do app (87 kB comprimido) —
 * e ficaria desatualizado no primeiro ajuste feito no motor. Aqui o que se vê
 * é exatamente o que o paciente verá, nítido em qualquer densidade de tela.
 *
 * O fundo escuro reproduz o da tela de exercício (`bg-slate-900`), para onde
 * os motores foram desenhados: sobre o cartão branco as bordas claras deles
 * sumiriam.
 */
export function PreviaJogo({ jogo, rotulo }: PreviaJogoProps) {
  const caixaRef = useRef<HTMLDivElement>(null);
  const visivel = useVisivel(caixaRef);
  const reduzirMovimento = useReducedMotion();

  const animar = visivel && !reduzirMovimento;
  const estadoAnimado = useCicloDemonstracao(animar);
  const estado = reduzirMovimento ? QUADRO_PARADO : estadoAnimado;

  const Motor = jogo.componente;

  /**
   * Um motor sem tela própria não tem o que pré-visualizar. Emprestar a
   * esfera aqui seria repetir o problema que o nome honesto resolveu: o
   * cartão mostraria um desenho que aquele motor não produz.
   */
  if (!jogo.disponivel) {
    return (
      <div className="flex h-36 w-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
        <p className="px-6 text-center text-xs font-semibold text-slate-400">
          Ainda sem tela própria — nada para pré-visualizar.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={caixaRef}
      role="img"
      aria-label={rotulo ?? `Prévia do motor ${jogo.nome}`}
      className="relative h-36 w-full overflow-hidden rounded-2xl bg-slate-900"
    >
      {/* Brilho de fundo, igual ao da tela de exercício. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,0.16),transparent_65%)]"
      />

      {/*
        Palco de largura fixa: os motores se dimensionam em pixels (a esfera
        em `w-56`, a pista em `max-w-xl`), então reduzir por `scale` num palco
        de tamanho conhecido dá um resultado previsível em qualquer cartão. O
        `scale` roda na GPU e não recalcula layout.
      */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          aria-hidden
          className="flex w-[420px] shrink-0 items-center justify-center"
          style={{ transform: `scale(${jogo.escalaPrevia})` }}
        >
          {/* Só monta o motor quando está à vista: desmontado, nenhum laço
              de animação continua correndo em segundo plano. */}
          {(visivel || reduzirMovimento) && (
            <Motor estado={estado} config={CONFIG_DEMO} />
          )}
        </div>
      </div>
    </div>
  );
}

export default PreviaJogo;
