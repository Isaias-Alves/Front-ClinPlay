import { useState } from "react";
import { FiPlay } from "react-icons/fi";
import { extrairIdYoutube } from "@utils";

interface VideoExercicioProps {
  url?: string | null;
  /** Texto alternativo da miniatura. */
  titulo?: string;
}

/**
 * Vídeo de demonstração do exercício, carregado só sob demanda.
 *
 * Embutir o iframe do YouTube direto custa cerca de 900 kB de scripts e
 * cookies de rastreio **na abertura da tela**, mesmo que o paciente nunca
 * assista — num plano de dados isso é dinheiro do usuário. Aqui a tela
 * mostra a miniatura (~15 kB, servida pelo próprio YouTube) e só monta o
 * iframe depois do toque.
 *
 * O domínio é o `youtube-nocookie.com`: sem o toque não há requisição
 * nenhuma ao YouTube além da imagem, e depois dele o rastreamento é o
 * mínimo possível. Numa aplicação de saúde isso não é detalhe.
 */
export const VideoExercicio = ({
  url,
  titulo = "Demonstração do exercício",
}: VideoExercicioProps) => {
  const [tocando, setTocando] = useState(false);
  const id = extrairIdYoutube(url);

  if (!id) return null;

  if (tocando) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
        className="h-full w-full border-0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title={titulo}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setTocando(true)}
      aria-label={`Reproduzir: ${titulo}`}
      className="group relative flex h-full w-full items-center justify-center overflow-hidden bg-slate-900"
    >
      <img
        src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover opacity-80"
      />
      {/* min-h/w-16 mantém o alvo de toque bem acima do mínimo de 44px. */}
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-2xl text-slate-900 shadow-xl transition-transform active:scale-95">
        <FiPlay className="ml-1" />
      </span>
    </button>
  );
};

export default VideoExercicio;
