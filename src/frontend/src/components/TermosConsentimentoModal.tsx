import { termosDeUso, termosLgpd } from "@assets";
import { useTermosModal } from "@hooks";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiFileText, FiCheck } from "react-icons/fi";

/**
 * Interface para as propriedades do modal de termos
 */
interface TermosConsentimentoModalProps {
  /** Indica se o modal está visível */
  isOpen: boolean;
  /**
   * Fecha o modal sem aceitar os termos
   */
  onClose: () => void;
  /**
   * Fecha o modal aceitando os termos
   */
  onAccept: () => void;
}

/**
 *
 * Modal que aceita os termos de uso e consentimento
 * Bloqueia o aceite até que ambos termos sejam aceitos
 */
const TermosConsentimentoModal = ({
  isOpen,
  onClose,
  onAccept,
}: TermosConsentimentoModalProps) => {
  const {
    termosAceitos,
    setTermosAceitos,
    lgpdAceita,
    setLgpdAceita,
    todosAceitos,
    handleAccept,
  } = useTermosModal(onAccept);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        >
          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="flex w-full max-w-2xl max-h-[90vh] flex-col rounded-[32px] bg-white shadow-2xl overflow-hidden"
          >
            {/* Header Padronizado */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl shadow-sm border border-emerald-200">
                  <FiFileText />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800">
                    Termos e Consentimento
                  </h3>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                    Políticas de Privacidade e LGPD
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:bg-slate-200 bg-white border border-slate-200 rounded-xl transition-colors active:scale-95"
                aria-label="Fechar"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Body (Scrollable Content) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 text-sm text-slate-600 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
              <section>
                <h3 className="mb-4 text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                  1. Termos de Uso
                </h3>
                <div className="space-y-3">
                  {termosDeUso.map((paragrafo: string, index: number) => (
                    <p
                      key={`termos-${index}`}
                      className="text-justify leading-relaxed font-medium text-slate-500"
                    >
                      {paragrafo}
                    </p>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                  2. Tratamento de Dados (LGPD)
                </h3>
                <div className="space-y-3">
                  {termosLgpd.map((paragrafo: string, index: number) => (
                    <p
                      key={`lgpd-${index}`}
                      className="text-justify leading-relaxed font-medium text-slate-500"
                    >
                      {paragrafo}
                    </p>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer com Cards Interativos */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
              <div className="space-y-3 mb-6">
                {/* Card Aceite 1 */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    termosAceitos
                      ? "bg-emerald-50/50 border-emerald-300 shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50 hover:border-emerald-200"
                  }`}
                >
                  <div className="mt-0.5 relative flex items-center justify-center shrink-0">
                    <input
                      type="checkbox"
                      checked={termosAceitos}
                      onChange={(e) => setTermosAceitos(e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-[6px] border-2 border-slate-300 checked:border-emerald-500 checked:bg-emerald-500 transition-all outline-none"
                    />
                    <FiCheck className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3] text-sm" />
                  </div>
                  <span
                    className={`text-sm font-medium select-none pt-0.5 ${
                      termosAceitos ? "text-slate-800" : "text-slate-600"
                    }`}
                  >
                    Declaro que li e concordo integralmente com os Termos de
                    Uso.
                  </span>
                </label>

                {/* Card Aceite 2 */}
                <label
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    lgpdAceita
                      ? "bg-emerald-50/50 border-emerald-300 shadow-sm"
                      : "bg-white border-slate-200 hover:bg-slate-50 hover:border-emerald-200"
                  }`}
                >
                  <div className="mt-0.5 relative flex items-center justify-center shrink-0">
                    <input
                      type="checkbox"
                      checked={lgpdAceita}
                      onChange={(e) => setLgpdAceita(e.target.checked)}
                      className="peer h-5 w-5 cursor-pointer appearance-none rounded-[6px] border-2 border-slate-300 checked:border-emerald-500 checked:bg-emerald-500 transition-all outline-none"
                    />
                    <FiCheck className="absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none stroke-[3] text-sm" />
                  </div>
                  <span
                    className={`text-sm font-medium select-none pt-0.5 ${
                      lgpdAceita ? "text-slate-800" : "text-slate-600"
                    }`}
                  >
                    Declaro que li e concordo com as Políticas de Privacidade e
                    Tratamento de Dados (LGPD).
                  </span>
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  type="button"
                  className="flex-1 py-3.5 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-xl border border-slate-200 transition-all active:scale-95 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAccept}
                  type="button"
                  disabled={!todosAceitos}
                  className={`flex-[2] py-3.5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm ${
                    todosAceitos
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 active:scale-95"
                      : "cursor-not-allowed bg-slate-200 text-slate-400"
                  }`}
                >
                  {todosAceitos && <FiCheck className="text-lg" />} Aceitar e
                  Continuar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TermosConsentimentoModal;
