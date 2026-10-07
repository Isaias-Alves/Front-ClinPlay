import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface PassoTutorial {
  /**
   * Valor do atributo `data-tutorial` do elemento destacado. Sem alvo, ou
   * com o alvo fora da tela (ex.: lista ainda vazia), o passo aparece sem
   * destaque — o texto precisa fazer sentido nos dois casos.
   */
  alvo?: string;
  titulo: string;
  texto: string;
}

interface TutorialProps {
  passos: PassoTutorial[];
  aberto: boolean;
  /** Chamado ao concluir, ao pular e com Esc. */
  onFechar: () => void;
}

interface Recorte {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Folga em volta do elemento destacado, em px. */
const FOLGA = 8;

const elementoDe = (alvo?: string) =>
  alvo ? document.querySelector(`[data-tutorial="${alvo}"]`) : null;

const medir = (alvo?: string): Recorte | null => {
  const r = elementoDe(alvo)?.getBoundingClientRect();
  if (!r || (r.width === 0 && r.height === 0)) return null;
  return {
    top: r.top - FOLGA,
    left: r.left - FOLGA,
    width: r.width + FOLGA * 2,
    height: r.height + FOLGA * 2,
  };
};

/**
 * Tour guiado: escurece a tela, recorta o elemento do passo atual e mostra
 * um cartão com o texto. Genérico de propósito — cada tela só declara os
 * passos e marca os alvos com `data-tutorial`.
 */
export function Tutorial({ passos, aberto, onFechar }: TutorialProps) {
  const [indice, setIndice] = useState(0);
  const [recorte, setRecorte] = useState<Recorte | null>(null);
  const tituloId = useId();
  const botaoPrincipal = useRef<HTMLButtonElement>(null);

  const passo = passos[indice];
  const ultimo = indice === passos.length - 1;
  const alvo = passo?.alvo;

  const fechar = () => {
    setIndice(0);
    onFechar();
  };

  // Acompanha o alvo: rola até ele e remede a cada scroll/resize, porque o
  // recorte é `fixed` e a página continua rolando por baixo.
  useEffect(() => {
    if (!aberto) return;

    elementoDe(alvo)?.scrollIntoView({ block: "center", behavior: "smooth" });

    let quadro = 0;
    const atualizar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => setRecorte(medir(alvo)));
    };

    atualizar();
    window.addEventListener("scroll", atualizar, true);
    window.addEventListener("resize", atualizar);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("scroll", atualizar, true);
      window.removeEventListener("resize", atualizar);
    };
  }, [aberto, alvo]);

  useEffect(() => {
    if (aberto) botaoPrincipal.current?.focus();
  }, [aberto, indice]);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setIndice(0);
      onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto, onFechar]);

  if (!aberto || !passo) return null;

  // Cartão no lado oposto ao destaque, para não cobri-lo.
  const cartaoNoTopo =
    !!recorte && recorte.top + recorte.height / 2 > window.innerHeight / 2;

  return createPortal(
    <div
      className="fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
    >
      {recorte ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-2xl ring-2 ring-emerald-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.72)] transition-all duration-300 ease-out"
          style={recorte}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-slate-900/70" />
      )}

      <div
        className={`fixed inset-x-4 ${cartaoNoTopo ? "top-4" : "bottom-4"} mx-auto max-w-sm bg-white rounded-3xl shadow-2xl p-5`}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
          Passo {indice + 1} de {passos.length}
        </p>
        <h2 id={tituloId} className="text-lg font-extrabold text-slate-800">
          {passo.titulo}
        </h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          {passo.texto}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={fechar}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Pular tutorial
          </button>
          <div className="flex gap-2">
            {indice > 0 && (
              <button
                type="button"
                onClick={() => setIndice((i) => i - 1)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
              >
                Voltar
              </button>
            )}
            <button
              ref={botaoPrincipal}
              type="button"
              onClick={ultimo ? fechar : () => setIndice((i) => i + 1)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-colors active:scale-95 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
            >
              {ultimo ? "Concluir" : "Próximo"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default Tutorial;
