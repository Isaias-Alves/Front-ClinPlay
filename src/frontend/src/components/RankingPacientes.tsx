import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiAward, FiUser } from "react-icons/fi";
import type { RankingPaciente } from "@interfaces";
import { tratamentoServices } from "@services";
import { criarContainerVariants, criarItemVariants } from "@utils";
import { FalhaAoCarregar } from "./FalhaAoCarregar";

const PERIODOS = [
  { dias: 7, rotulo: "7 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: undefined, rotulo: "Tudo" },
] as const;

type Dias = (typeof PERIODOS)[number]["dias"];

const containerVariants = criarContainerVariants(0.05);
const itemVariants = criarItemVariants();

/**
 * "Hoje", "ontem" ou "há N dias". Compara só a data: o horário vem do
 * servidor sem fuso, e para essa granularidade a diferença não importa.
 */
const ultimaAtividade = (iso: string): string => {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  const hoje = new Date();
  const dias = Math.round(
    (Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) -
      Date.UTC(a, m - 1, d)) /
      86_400_000,
  );
  if (dias <= 0) return "Última atividade hoje";
  if (dias === 1) return "Última atividade ontem";
  return `Última atividade há ${dias} dias`;
};

interface RankingPacientesProps {
  clinicaId: string;
}

/**
 * Pacientes do profissional que mais concluíram exercícios na clínica.
 * Cada linha tem uma barra proporcional ao primeiro colocado; o número ao
 * lado é o dado, a barra só ajuda a comparar de relance.
 */
export const RankingPacientes = ({ clinicaId }: RankingPacientesProps) => {
  const [dias, setDias] = useState<Dias>(30);
  const [tentativa, setTentativa] = useState(0);
  const chave = `${clinicaId}|${dias}|${tentativa}`;

  // Guardar a chave junto do resultado deixa "carregando" derivado: não é
  // preciso ligar uma flag de forma síncrona dentro do efeito.
  const [resultado, setResultado] = useState<{
    chave: string;
    lista: RankingPaciente[];
    falhou: boolean;
  } | null>(null);

  useEffect(() => {
    let ativo = true;
    tratamentoServices
      .ranking(clinicaId, dias)
      .then((lista) => ativo && setResultado({ chave, lista, falhou: false }))
      .catch(() => ativo && setResultado({ chave, lista: [], falhou: true }));
    return () => {
      ativo = false;
    };
  }, [chave, clinicaId, dias]);

  const carregando = resultado?.chave !== chave;
  const lista = resultado?.lista ?? [];
  const maximo = lista[0]?.execucoes || 1;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
          <FiAward className="text-emerald-500" /> Pacientes mais ativos
        </h2>
        <div
          role="group"
          aria-label="Período do ranking"
          className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 gap-1"
        >
          {PERIODOS.map((periodo) => (
            <button
              key={periodo.rotulo}
              type="button"
              aria-pressed={dias === periodo.dias}
              onClick={() => setDias(periodo.dias)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                dias === periodo.dias
                  ? "bg-white shadow-sm border border-slate-100 text-slate-700"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {periodo.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2">
        {carregando ? (
          <div className="space-y-2 p-2" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : resultado?.falhou ? (
          <FalhaAoCarregar
            oQue="o ranking"
            onTentarNovamente={() => setTentativa((t) => t + 1)}
          />
        ) : lista.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-bold text-slate-600">
              Nenhum exercício concluído nesse período.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Quando um paciente terminar um exercício, ele aparece aqui.
            </p>
          </div>
        ) : (
          <motion.ol
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-1"
          >
            {lista.map((paciente, indice) => (
              <motion.li
                key={paciente.pacienteId}
                variants={itemVariants}
                className="p-3 rounded-2xl flex items-center gap-3"
              >
                <span
                  className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-black ${
                    indice === 0
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {indice + 1}
                </span>
                <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  {paciente.avatar ? (
                    <img
                      src={paciente.avatar}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiUser className="text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-bold text-slate-700 truncate">
                      {paciente.nome}
                    </p>
                    <p className="shrink-0 text-sm font-black text-slate-800">
                      {paciente.execucoes}
                      <span className="ml-1 text-[11px] font-medium text-slate-400">
                        {paciente.execucoes === 1 ? "exercício" : "exercícios"}
                      </span>
                    </p>
                  </div>
                  <div
                    aria-hidden="true"
                    className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(paciente.execucoes / maximo) * 100}%`,
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="h-full rounded-full bg-emerald-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {ultimaAtividade(paciente.ultimaExecucao)}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        )}
      </div>

      <p className="text-[11px] text-slate-400 ml-1">
        Conta cada exercício concluído com a avaliação enviada no fim do jogo.
      </p>
    </section>
  );
};

export default RankingPacientes;
