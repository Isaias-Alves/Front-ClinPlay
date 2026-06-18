import { FaCaretRight } from "react-icons/fa";
import { LogoClinPlay } from "@assets";

interface LogotipoClinPlayProps {
  mt?: string;
  mb?: string;
}

/**
 * Componente LogotipoClinPlay que exibe o logotipo da ClinPlay com opções de margem personalizáveis
 */
const LogotipoClinPlay = ({
  mt = "mt-0",
  mb = "mb-0",
}: LogotipoClinPlayProps) => {
  return (
    <h1
      className={`grid grid-cols-[auto_1fr] items-start  gap-y-4 text-left text-color font-black text-5xl  mx-auto ${mb} ${mt}`}
    >
      <div className="row-span-2 self-center ">
        <LogoClinPlay className="w-25 h-25 text-[#59B89C] fill-none" />
      </div>
      <div className="leading-none mb-5">Clin</div>

      <span className="flex items-baseline mt-[-1em] relative">
        <span className="bg-linear-to-br from-[#59B89C] to-amber-300/50 to-99% bg-clip-text text-transparent leading-[0.8] tracking-tight">
          Pla
          <span className="tracking-[-0.12em] ml-[-0.12em] px-1">Y</span>
        </span>

        <FaCaretRight
          className="absolute text-amber-500/30"
          size={24}
          style={{
            left: "calc(95% - 0.1em)",
            top: "45%",
            transform: "translateY(15%)",
          }}
        />
      </span>
    </h1>
  );
};

export default LogotipoClinPlay;
