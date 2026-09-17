import { LuStethoscope, LuUser } from "react-icons/lu";
import type { KeyboardEvent } from "react";

export type TipoCadastro = "paciente" | "profissional";

interface SwitchTipoProps {
  tipo: TipoCadastro;
  /** Alterna para o outro tipo. Só é chamado quando a escolha muda. */
  onChange: () => void;
}

const OPCOES: Array<{
  valor: TipoCadastro;
  rotulo: string;
  icone: typeof LuUser;
  cor: string;
}> = [
  { valor: "paciente", rotulo: "Paciente", icone: LuUser, cor: "text-blue-500" },
  {
    valor: "profissional",
    rotulo: "Profissional",
    icone: LuStethoscope,
    cor: "text-emerald-500",
  },
];

/**
 * Escolha entre cadastro de paciente e de profissional.
 *
 * A versão anterior desenhava só o rótulo da opção *selecionada*: metade do
 * controle ficava em branco e nada indicava que existia um segundo tipo. Quem
 * caía na tela via "Paciente" numa pílula e um espaço cinza vazio ao lado.
 *
 * Pior: era uma `div` com `onClick`, sem `tabindex`, `role` ou tratamento de
 * teclado. O controle não entrava na ordem de tabulação — a sequência ia do
 * nome direto para a data de nascimento. Quem navega por teclado, leitor de
 * tela ou controle adaptado não tinha como trocar o tipo e só conseguia criar
 * conta de paciente.
 *
 * Agora é um `radiogroup` de verdade: os dois rótulos ficam sempre visíveis, o
 * grupo é um único ponto de tabulação (tabindex rotativo) e as setas trocam a
 * seleção, como manda o padrão de grupo de opções.
 */
export const SwitchTipo = ({ tipo, onChange }: SwitchTipoProps) => {
  const isProfissional = tipo === "profissional";

  /**
   * `onChange` é um alternador: chamá-lo com a opção já ativa inverteria a
   * escolha em vez de mantê-la. Tocar em "Paciente" estando em "Paciente"
   * precisa não fazer nada.
   */
  const selecionar = (valor: TipoCadastro) => {
    if (valor !== tipo) onChange();
  };

  /**
   * Num `radiogroup` as setas movem a seleção — Tab entra e sai do grupo.
   * Espaço e Enter já são tratados nativamente pelo `<button>`.
   */
  const aoTeclar = (evento: KeyboardEvent<HTMLDivElement>) => {
    const teclas = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
    if (!teclas.includes(evento.key)) return;

    evento.preventDefault();
    onChange();

    // Move o foco junto com a seleção: o tabindex rotativo passa para a opção
    // recém-escolhida e o foco precisa acompanhar.
    const destino = isProfissional ? "paciente" : "profissional";
    evento.currentTarget
      .querySelector<HTMLButtonElement>(`[data-tipo="${destino}"]`)
      ?.focus();
  };

  return (
    <div className="mb-6 flex w-full flex-col items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Tipo de cadastro"
        onKeyDown={aoTeclar}
        className="relative flex h-12 w-full max-w-xs items-center rounded-full border border-slate-200 bg-slate-100 p-1 shadow-inner"
      >
        {/*
          Pastilha deslizante, atrás dos rótulos. `inset-y-1 left-1` com
          largura de metade menos o padding faz as duas posições caírem
          exatamente nas bordas internas, em qualquer largura de tela — o
          `translate-x-[104%]` anterior era um valor ajustado no olho.
        */}
        <span
          aria-hidden
          className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full border border-slate-100 bg-white shadow-md transition-transform duration-300 ease-in-out ${
            isProfissional ? "translate-x-full" : "translate-x-0"
          }`}
        />

        {OPCOES.map(({ valor, rotulo, icone: Icone, cor }) => {
          const ativo = valor === tipo;
          return (
            <button
              key={valor}
              // Sem isto o botão submeteria o formulário de cadastro em volta.
              type="button"
              role="radio"
              aria-checked={ativo}
              data-tipo={valor}
              // Tabindex rotativo: o grupo inteiro é uma parada de Tab só.
              tabIndex={ativo ? 0 : -1}
              onClick={() => selecionar(valor)}
              className={`relative z-10 flex h-10 flex-1 items-center justify-center gap-2 rounded-full text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                ativo ? "text-slate-700" : "text-slate-400"
              }`}
            >
              <Icone className={ativo ? cor : "text-slate-400"} />
              {rotulo}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SwitchTipo;
