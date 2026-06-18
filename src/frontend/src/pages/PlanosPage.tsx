import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../contexts/AppContext";
import {
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiX,
  FiCalendar,
} from "react-icons/fi";
import { RiMedalLine, RiRocketLine, RiVipCrown2Line } from "react-icons/ri";
import { assinaturaServices } from "@services";

export function PlanosPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { planos, isLoadingGlobal, notificar } = useApp();

  const carouselRef = useRef<HTMLDivElement>(null);
  const [dragWidth, setDragWidth] = useState(0);

  // Verifica se estamos no fluxo de alterar plano de uma clínica existente

  const clinicaIdParaAlteracao = location.state?.clinicaIdParaAlteracao;

  // Estados para o Modal de Validade
  const [planoSelecionado, setPlanoSelecionado] = useState<string | null>(null);
  const [isSubmittingPlano, setIsSubmittingPlano] = useState(false);

  const planosOrdenados = [...planos].sort(
    (a, b) => a.maxProfissionais - b.maxProfissionais,
  );

  useEffect(() => {
    if (carouselRef.current) {
      setDragWidth(
        carouselRef.current.scrollWidth - carouselRef.current.offsetWidth,
      );
    }
  }, [planosOrdenados]);

  const getPlanStyle = (idx: number) => {
    const styles = [
      {
        icon: <RiRocketLine />,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-100",
      },
      {
        icon: <RiMedalLine />,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
      },
      {
        icon: <RiVipCrown2Line />,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
      },
    ];
    return styles[idx % styles.length];
  };

  // Função para calcular a data e avançar ou atualizar direto
  const handleSelecionarDuracao = async (dias: number) => {
    if (!planoSelecionado) return;

    const dataAtual = new Date();
    dataAtual.setDate(dataAtual.getDate() + dias);
    const validade = dataAtual.toISOString().split("T")[0]; // YYYY-MM-DD

    if (clinicaIdParaAlteracao) {
      // FLUXO DE EDIÇÃO: Aderir ao plano na clínica existente
      setIsSubmittingPlano(true);
      try {
        await assinaturaServices.aderir(clinicaIdParaAlteracao, {
          planoId: planoSelecionado,
          validade: validade,
        });
        notificar("Plano alterado com sucesso!", "sucesso");
        navigate(-1); // Volta para a tela de detalhes
      } catch (error: any) {
        const msg = error.response?.data || "Erro ao alterar o plano.";
        notificar(typeof msg === "string" ? msg : "Erro.", "erro");
      } finally {
        setIsSubmittingPlano(false);
      }
    } else {
      // FLUXO DE CRIAÇÃO: Segue para o formulário levando os dados
      navigate("/clinicas/formulario", {
        state: { planoId: planoSelecionado, validade },
      });
    }
  };

  if (isLoadingGlobal) return null;

  return (
    <div className="min-h-screen bg-slate-100/50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <motion.div
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-400/15 rounded-full blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], x: [0, -50, 0], y: [0, 30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"
      />

      <header className="text-center mb-10 max-w-2xl relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight"
        >
          {clinicaIdParaAlteracao
            ? "Alterar Plano da Unidade"
            : "O plano ideal para a sua clínica"}
        </motion.h1>
        <p className="text-slate-500 font-medium text-sm md:text-base px-4">
          {clinicaIdParaAlteracao
            ? "Selecione a nova assinatura para atualizar os limites de profissionais e pacientes da sua clínica."
            : "Cresça sem limites. Escolha o plano que melhor se adapta ao volume de profissionais e pacientes da sua unidade."}
        </p>

        {clinicaIdParaAlteracao && (
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2.5 bg-white text-slate-500 hover:text-slate-700 font-bold rounded-full shadow-sm text-sm inline-flex items-center gap-2 transition-all active:scale-95"
          >
            <FiArrowLeft /> Voltar para a Clínica
          </button>
        )}
      </header>

      <div
        className="relative w-full max-w-6xl z-10 overflow-hidden py-8 px-2"
        ref={carouselRef}
      >
        <motion.div
          className="flex gap-6 cursor-grab active:cursor-grabbing px-4"
          drag="x"
          dragConstraints={{ right: 0, left: -dragWidth }}
          whileTap={{ cursor: "grabbing" }}
        >
          {planosOrdenados.map((plano, i) => {
            const style = getPlanStyle(i);
            const isRecomendado = i === 1;

            return (
              <motion.div
                key={plano.id}
                whileHover={{ y: -8 }}
                className={`min-w-[300px] sm:min-w-[340px] bg-white rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-300
                  ${
                    isRecomendado
                      ? "shadow-2xl shadow-emerald-900/10 border-2 border-emerald-400"
                      : "shadow-xl shadow-slate-200/60 border border-slate-200"
                  }`}
              >
                {isRecomendado && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-md">
                    Recomendado
                  </div>
                )}

                <div>
                  <div
                    className={`w-16 h-16 ${style.bg} ${style.color} border ${style.border} rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm`}
                  >
                    {style.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">
                    {plano.nome}
                  </h2>
                  <div
                    className={`h-1.5 w-10 rounded-full mb-8 ${isRecomendado ? "bg-emerald-500" : "bg-slate-200"}`}
                  />

                  <ul className="space-y-4 mb-10">
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <FiCheck className="text-emerald-500 text-sm" />
                      </div>
                      <span className="text-slate-600 text-sm font-medium">
                        Até{" "}
                        <b className="text-slate-800 font-bold">
                          {plano.maxProfissionais}
                        </b>{" "}
                        profissionais
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <FiCheck className="text-emerald-500 text-sm" />
                      </div>
                      <span className="text-slate-600 text-sm font-medium">
                        Até{" "}
                        <b className="text-slate-800 font-bold">
                          {plano.maxPacientes}
                        </b>{" "}
                        pacientes
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <FiCheck className="text-emerald-500 text-sm" />
                      </div>
                      <span className="text-slate-600 text-sm font-medium">
                        Até{" "}
                        <b className="text-slate-800 font-bold">
                          {plano.maxExercicios}
                        </b>{" "}
                        exercícios
                      </span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setPlanoSelecionado(plano.id)}
                  className={`w-full py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 group shadow-md active:scale-95
                    ${
                      isRecomendado
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                >
                  {clinicaIdParaAlteracao
                    ? "Aplicar Plano"
                    : "Selecionar Plano"}
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <div className="flex justify-center mt-2">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 select-none animate-pulse">
          <FiArrowLeft /> Arraste para explorar <FiArrowRight />
        </p>
      </div>

      {/* MODAL DE TEMPO DE ADESÃO */}
      <AnimatePresence>
        {planoSelecionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                  <FiCalendar className="text-emerald-500 text-lg" /> Duração do
                  Plano
                </h3>
                <button
                  onClick={() =>
                    !isSubmittingPlano && setPlanoSelecionado(null)
                  }
                  disabled={isSubmittingPlano}
                  className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-colors disabled:opacity-50"
                >
                  <FiX className="text-lg" />
                </button>
              </div>

              <div className="p-6 space-y-3 relative">
                {isSubmittingPlano && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-sm font-bold text-slate-600">
                      Atualizando assinatura...
                    </p>
                  </div>
                )}

                <p className="text-sm text-slate-500 mb-4 text-center font-medium">
                  Selecione por quanto tempo deseja vincular este plano à sua
                  clínica:
                </p>

                <button
                  onClick={() => handleSelecionarDuracao(30)}
                  disabled={isSubmittingPlano}
                  className="w-full py-4 bg-white border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 font-bold rounded-2xl transition-all active:scale-95 shadow-sm"
                >
                  30 Dias (1 Mês)
                </button>
                <button
                  onClick={() => handleSelecionarDuracao(90)}
                  disabled={isSubmittingPlano}
                  className="w-full py-4 bg-white border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600 font-bold rounded-2xl transition-all active:scale-95 shadow-sm"
                >
                  90 Dias (3 Meses)
                </button>
                <button
                  onClick={() => handleSelecionarDuracao(365)}
                  disabled={isSubmittingPlano}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-2"
                >
                  1 Ano{" "}
                  <span className="text-amber-400 text-xs tracking-widest uppercase ml-1">
                    Recomendado
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PlanosPage;
