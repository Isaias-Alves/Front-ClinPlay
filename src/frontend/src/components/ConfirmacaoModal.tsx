import { AnimatePresence, motion } from "framer-motion";
import { FiAlertTriangle } from "react-icons/fi";

export interface PedidoConfirmacao {
  mensagem: string;
  /** Texto do botão que confirma. Padrão: "Confirmar". */
  rotuloConfirmar?: string;
  /** Ação destrutiva pinta o botão de vermelho. */
  destrutivo?: boolean;
}

interface ConfirmacaoModalProps extends PedidoConfirmacao {
  isOpen: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Substitui o `window.confirm` nativo.
 *
 * O diálogo do sistema trava a thread principal — num aparelho modesto ele
 * congela animação e toque enquanto está aberto — e aparece com a cara do
 * navegador, quebrando a identidade do app justo nos momentos mais
 * delicados (excluir conta, remover paciente, interromper exercício).
 *
 * Aberto de baixo no celular e centralizado a partir de `sm`: é onde o
 * polegar alcança. Os botões têm `min-h-12` para respeitar o alvo mínimo
 * de toque, e o destrutivo fica à direita, longe do gesto de voltar.
 */
export const ConfirmacaoModal = ({
  isOpen,
  mensagem,
  rotuloConfirmar = "Confirmar",
  destrutivo = false,
  onConfirmar,
  onCancelar,
}: ConfirmacaoModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancelar}
        className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center"
      >
        <motion.div
          role="alertdialog"
          aria-modal="true"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
        >
          <div className="mb-5 flex items-start gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${
                destrutivo
                  ? "bg-red-50 text-red-500"
                  : "bg-amber-50 text-amber-500"
              }`}
            >
              <FiAlertTriangle />
            </div>
            <p className="pt-1 text-sm font-medium leading-relaxed text-slate-700">
              {mensagem}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancelar}
              className="min-h-12 flex-1 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 transition-colors active:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              autoFocus
              onClick={onConfirmar}
              className={`min-h-12 flex-1 rounded-2xl text-sm font-bold text-white shadow-md transition-transform active:scale-95 ${
                destrutivo ? "bg-red-500" : "bg-emerald-500"
              }`}
            >
              {rotuloConfirmar}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default ConfirmacaoModal;
