import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";

interface NotificacaoProps {
  isOpen: boolean;
  onClose: () => void;
  mensagem: string;
  tipo: "sucesso" | "erro";
}

export const NotificacaoModal = ({
  isOpen,
  onClose,
  mensagem,
  tipo,
}: NotificacaoProps) => {
  // Auto-fechamento após 3 segundos
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-6 right-4 left-4 z-50 p-4 rounded-2xl shadow-lg border flex items-center justify-between ${
            tipo === "sucesso"
              ? "bg-white border-emerald-100"
              : "bg-white border-red-100"
          }`}
        >
          <div className="flex items-center gap-3">
            {tipo === "sucesso" ? (
              <FiCheckCircle className="text-emerald-500 text-xl" />
            ) : (
              <FiAlertCircle className="text-red-500 text-xl" />
            )}
            <p className="text-sm font-semibold text-slate-700">{mensagem}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <FiX />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
