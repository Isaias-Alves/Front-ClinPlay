import { useState } from "react";
import { FiCheckCircle } from "react-icons/fi";
import { clinicasServices } from "@services";
import { useApp } from "@contexts";
import { mensagemDeErro } from "@utils";

interface AprovacaoAutomaticaExerciciosProps {
  clinicaId: string;
  ativo: boolean;
}

/**
 * Switch da aprovação automática de exercícios da clínica.
 *
 * Ligado, o exercício criado por qualquer profissional entra já aprovado,
 * sem passar por quem tem `adminExercicios`. O backend só aceita a troca
 * vinda do dono ou de quem tem `adminClinica`; quem renderiza este
 * componente deve aplicar a mesma regra.
 */
export const AprovacaoAutomaticaExercicios = ({
  clinicaId,
  ativo,
}: AprovacaoAutomaticaExerciciosProps) => {
  const { notificar, confirmar, refreshData } = useApp();
  /** Valor pedido e ainda não refletido no contexto; evita o switch voltar durante o refresh. */
  const [pendente, setPendente] = useState<boolean | null>(null);
  const ligado = pendente ?? ativo;

  const alternar = async () => {
    const novo = !ligado;

    // Ligar tira a revisão de todos os exercícios novos; desligar não tem
    // risco e não precisa de confirmação.
    if (
      novo &&
      !(await confirmar({
        titulo: "Aprovar exercícios automaticamente?",
        mensagem:
          "Os exercícios criados por qualquer profissional desta clínica ficam disponíveis na hora, sem revisão de um administrador.",
        rotuloConfirmar: "Ativar",
      }))
    )
      return;

    setPendente(novo);
    try {
      await clinicasServices.atualizarAprovacaoAutomatica(clinicaId, novo);
      await refreshData();
      notificar(
        novo
          ? "Aprovação automática de exercícios ativada."
          : "Os exercícios novos voltam a passar por revisão.",
        "sucesso",
      );
    } catch (erro) {
      notificar(
        mensagemDeErro(erro, "Não foi possível alterar a aprovação de exercícios."),
        "erro",
      );
    } finally {
      setPendente(null);
    }
  };

  return (
    <label className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4 cursor-pointer">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <FiCheckCircle className="text-emerald-500" /> Aprovação automática
          de exercícios
        </p>
        <p className="text-sm font-semibold text-slate-600">
          {ligado
            ? "Exercícios novos ficam disponíveis na hora, sem revisão."
            : "Exercícios novos aguardam a revisão de um administrador."}
        </p>
      </div>
      <div
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${ligado ? "bg-emerald-500" : "bg-slate-300"} ${pendente !== null ? "opacity-60" : ""}`}
      >
        <input
          type="checkbox"
          role="switch"
          aria-label="Aprovação automática de exercícios"
          checked={ligado}
          disabled={pendente !== null}
          onChange={alternar}
          className="sr-only"
        />
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 shadow-sm ${ligado ? "translate-x-5" : "translate-x-1"}`}
        />
      </div>
    </label>
  );
};

export default AprovacaoAutomaticaExercicios;
