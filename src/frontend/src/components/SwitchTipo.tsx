import { LuStethoscope, LuUser } from "react-icons/lu";

interface SwitchTipoProps {
  tipo: "paciente" | "profissional";
  onChange: () => void;
}

export const SwitchTipo = ({ tipo, onChange }: SwitchTipoProps) => {
  const isProfissional = tipo === "profissional";
  return (
    <div className="flex flex-col items-center gap-3 mb-6 w-full">
      <div
        onClick={onChange}
        className="relative w-full max-w-xs h-12 bg-slate-100 rounded-full p-1 cursor-pointer flex items-center border border-slate-200 shadow-inner"
      >
        <div
          className={`absolute w-[48%] h-10 bg-white rounded-full shadow-md border border-slate-100
                         transition-all duration-300 ease-in-out flex items-center justify-center gap-2 z-10
                         ${isProfissional ? "translate-x-[104%]" : "translate-x-0"}`}
        >
          {isProfissional ? (
            <>
              <LuStethoscope className="text-emerald-500" />
              <span className="text-xs font-bold text-slate-700">
                Profissional
              </span>
            </>
          ) : (
            <>
              <LuUser className="text-blue-500" />
              <span className="text-xs font-bold text-slate-700">Paciente</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
