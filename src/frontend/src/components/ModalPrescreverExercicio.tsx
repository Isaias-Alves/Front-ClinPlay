import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiX,
  FiSearch,
  FiActivity,
  FiSliders,
  FiSave,
  FiEdit2,
} from "react-icons/fi";
import {
  formatarHorasParaHHMM,
  formatarHHMMParaHoras,
  validarNumero,
  atributosNumero,
  validarHHMM,
} from "@utils";
import type {
  ExercicioConfig,
  ExercicioInfoResponse,
  PrescricaoView,
} from "@interfaces";
import { PatternFormat } from "react-number-format"; // IMPORT ADICIONADO AQUI!
import { nomeDoJogo, rotulosDosTempos } from "@games";

/** Corpo de `ADICIONAR_PRESCRICAO` enviado pela sala de tratamento. */
export interface PrescricaoPayload {
  exercicioId: string;
  objetivo: string;
  observacao: string;
  disponivel: boolean;
  customizacao: ExercicioConfig;
}

/**
 * Campos do formulário. `tempoInativo` é texto porque a interface o edita
 * como HH:MM; vira número de horas só na hora de montar o payload.
 */
type FormPrescricao = Omit<
  ExercicioConfig,
  "tempoInativo" | "tempoDescansoSeries"
> & {
  objetivo: string;
  observacao: string;
  tempoInativo: string;
  tempoDescansoSeries: number;
};

/** Campos numéricos editáveis na grade de ajustes finos. */
type CampoNumerico = Extract<
  keyof FormPrescricao,
  | "vezesAoDia"
  | "series"
  | "repeticoes"
  | "tempoPrincipal"
  | "tempoSecundario"
  | "tempoDescanso"
  | "tempoDescansoSeries"
>;

/** Contagens do motor, na ordem em que aparecem na tela. */
const CAMPOS_CONTAGEM: Array<{ label: string; key: CampoNumerico }> = [
  { label: "Sessões/Dia", key: "vezesAoDia" },
  { label: "Séries", key: "series" },
  { label: "Reps", key: "repeticoes" },
];

/** Tempos do motor; os rótulos saem de `rotulosDosTempos`. */
const CAMPOS_TEMPO = [
  { key: "tempoPrincipal", rotulo: "principal" },
  { key: "tempoSecundario", rotulo: "secundario" },
  { key: "tempoDescanso", rotulo: "descanso" },
  { key: "tempoDescansoSeries", rotulo: "descansoSeries" },
] as const;

const CAMPOS_NUMERICOS: CampoNumerico[] = [
  ...CAMPOS_CONTAGEM.map((c) => c.key),
  ...CAMPOS_TEMPO.map((c) => c.key),
];

/** O que o modal precisa saber do exercício escolhido (ou já prescrito). */
type ExercicioSelecionado = Pick<ExercicioInfoResponse, "id" | "nome" | "jogo">;

/**
 * Formulário preenchido a partir de uma configuração: o `configPadrao` do
 * exercício, ao prescrever, ou a `customizacao` da prescrição, ao editar.
 */
const formularioDe = (
  config: Partial<ExercicioConfig> | null | undefined,
  textos: { objetivo?: string | null; observacao?: string | null } = {},
): FormPrescricao => ({
  objetivo: textos.objetivo ?? "",
  observacao: textos.observacao ?? "Siga as instruções do exercício.",
  acaoPrincipal: config?.acaoPrincipal || "Contração",
  acaoSecundaria: config?.acaoSecundaria || "Relaxamento",
  vezesAoDia: config?.vezesAoDia ?? 1,
  series: config?.series ?? 3,
  repeticoes: config?.repeticoes ?? 10,
  diasInativo: config?.diasInativo ?? 0,
  tempoInativo: formatarHorasParaHHMM(config?.tempoInativo ?? 0),
  tempoPrincipal: config?.tempoPrincipal ?? 3,
  tempoSecundario: config?.tempoSecundario ?? 3,
  tempoDescanso: config?.tempoDescanso ?? 6,
  // Exercícios anteriores ao campo: parte da pausa entre repetições, que era
  // o que o paciente fazia entre as séries até aqui.
  tempoDescansoSeries:
    config?.tempoDescansoSeries ?? config?.tempoDescanso ?? 6,
});

/** Mensagem de erro de um campo do modal. */
const Erro = ({ mensagem }: { mensagem?: string }) =>
  mensagem ? (
    <p role="alert" className="mt-1 text-[10px] font-bold text-red-400">
      {mensagem}
    </p>
  ) : null;

interface ModalPrescreverExercicioProps {
  isOpen: boolean;
  onClose: () => void;
  exercicios: ExercicioInfoResponse[];
  carregando: boolean;
  onConfirm: (payload: PrescricaoPayload) => void;
  /** Quando presente, o modal abre direto nos parâmetros desta prescrição. */
  prescricaoEmEdicao?: PrescricaoView | null;
}

export const ModalPrescreverExercicio: React.FC<
  ModalPrescreverExercicioProps
> = ({
  isOpen,
  onClose,
  exercicios,
  carregando,
  onConfirm,
  prescricaoEmEdicao,
}) => {
  const editando = Boolean(prescricaoEmEdicao);
  const [buscaExercicio, setBuscaExercicio] = useState("");
  const [exercicioParaPrescrever, setExercicioParaPrescrever] =
    useState<ExercicioSelecionado | null>(null);

  const [formPrescricao, setFormPrescricao] = useState<FormPrescricao>(() =>
    formularioDe(null),
  );

  /**
   * Erros por campo. Este modal não usa `react-hook-form`, e antes não
   * validava nada: dava para zerar séries e repetições, ou deixar o objetivo
   * em branco, e o `onConfirm` disparava do mesmo jeito. Quem recebia os
   * parâmetros quebrados era o paciente, na hora de executar.
   */
  const [erros, setErros] = useState<Partial<Record<string, string>>>({});

  // Limpa o estado interno sempre que o modal fechar. Feito durante a
  // renderização (padrão "ajustar estado ao mudar de prop") e não num
  // `useEffect`: o efeito só corria depois da pintura, o que fazia a busca
  // antiga reaparecer por um quadro ao reabrir o modal.
  const [estavaAberto, setEstavaAberto] = useState(isOpen);
  if (estavaAberto !== isOpen) {
    setEstavaAberto(isOpen);
    if (!isOpen) {
      setBuscaExercicio("");
      setExercicioParaPrescrever(null);
    } else if (prescricaoEmEdicao) {
      setErros({});
      setExercicioParaPrescrever({
        id: prescricaoEmEdicao.exercicioId,
        nome: prescricaoEmEdicao.exercicioNome,
        jogo: prescricaoEmEdicao.exercicioJogo,
      });
      setFormPrescricao(
        formularioDe(prescricaoEmEdicao.customizacao, prescricaoEmEdicao),
      );
    }
  }

  // Recalculado a cada tecla: os rótulos seguem a ação digitada acima.
  const rotulos = rotulosDosTempos(
    exercicioParaPrescrever?.jogo,
    formPrescricao.acaoPrincipal,
    formPrescricao.acaoSecundaria,
  );

  const exerciciosFiltrados = exercicios.filter(
    (ex) =>
      ex.nome.toLowerCase().includes(buscaExercicio.toLowerCase()) ||
      ex.jogo.toLowerCase().includes(buscaExercicio.toLowerCase()),
  );

  const handlePrepararPrescricao = (ex: ExercicioInfoResponse) => {
    setExercicioParaPrescrever(ex);
    setErros({});
    setFormPrescricao(formularioDe(ex.configPadrao));
  };

  const validar = (): boolean => {
    const achados: Record<string, string> = {};

    if (!formPrescricao.objetivo.trim())
      achados.objetivo = "Descreva o objetivo desta prescrição";
    if (!formPrescricao.acaoPrincipal.trim())
      achados.acaoPrincipal = "Obrigatório";
    if (!formPrescricao.acaoSecundaria.trim())
      achados.acaoSecundaria = "Obrigatório";

    for (const campo of [...CAMPOS_NUMERICOS, "diasInativo" as const]) {
      const resultado = validarNumero(formPrescricao[campo], campo);
      if (resultado !== true) achados[campo] = resultado;
    }

    const hora = validarHHMM(formPrescricao.tempoInativo);
    if (hora !== true) achados.tempoInativo = hora;

    setErros(achados);
    return Object.keys(achados).length === 0;
  };

  const handleConfirmar = () => {
    if (!exercicioParaPrescrever) return;
    if (!validar()) return;

    const payload = {
      exercicioId: exercicioParaPrescrever.id,
      objetivo: formPrescricao.objetivo,
      observacao: formPrescricao.observacao,
      disponivel: prescricaoEmEdicao?.disponivel ?? true,
      customizacao: {
        acaoPrincipal: formPrescricao.acaoPrincipal,
        acaoSecundaria: formPrescricao.acaoSecundaria,
        vezesAoDia: Number(formPrescricao.vezesAoDia),
        series: Number(formPrescricao.series),
        repeticoes: Number(formPrescricao.repeticoes),
        diasInativo: Number(formPrescricao.diasInativo),
        tempoInativo: formatarHHMMParaHoras(formPrescricao.tempoInativo),
        tempoPrincipal: Number(formPrescricao.tempoPrincipal),
        tempoSecundario: Number(formPrescricao.tempoSecundario),
        tempoDescanso: Number(formPrescricao.tempoDescanso),
        tempoDescansoSeries: Number(formPrescricao.tempoDescansoSeries),
      },
    };

    onConfirm(payload);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-md">
                  {editando ? <FiEdit2 /> : <FiPlus />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {editando
                      ? "Editar prescrição"
                      : exercicioParaPrescrever
                        ? "Parâmetros Mecânicos"
                        : "Acervo de Exercícios"}
                  </h3>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">
                    {editando
                      ? "As mudanças valem a partir da próxima sessão do paciente."
                      : exercicioParaPrescrever
                        ? "Ajuste os limites do jogo."
                        : "Selecione a atividade para anexar."}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 bg-white relative">
              <AnimatePresence mode="wait">
                {!exercicioParaPrescrever ? (
                  <motion.div
                    key="listagem"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6"
                  >
                    <div className="relative mb-6">
                      <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                      <input
                        type="text"
                        placeholder="Buscar por nome ou motor..."
                        value={buscaExercicio}
                        onChange={(e) => setBuscaExercicio(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-2xl outline-none transition-colors text-sm font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {carregando ? (
                        <div className="col-span-full flex justify-center py-10">
                          <div className="w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : exerciciosFiltrados.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-slate-400 text-sm font-medium">
                          Nenhum exercício encontrado.
                        </div>
                      ) : (
                        exerciciosFiltrados.map((ex) => (
                          <div
                            key={ex.id}
                            onClick={() => handlePrepararPrescricao(ex)}
                            className="p-4 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-emerald-400 hover:bg-emerald-50 transition-colors cursor-pointer group"
                          >
                            <div className="min-w-0 pr-3">
                              <h4 className="text-sm font-bold text-slate-700 truncate group-hover:text-emerald-800">
                                {ex.nome}
                              </h4>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mt-1">
                                {nomeDoJogo(ex.jogo)}
                              </p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-colors shrink-0 shadow-sm">
                              <FiPlus className="text-lg" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="formulario"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="p-6 space-y-6"
                  >
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                          <FiActivity />
                        </div>
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-800">
                            {exercicioParaPrescrever.nome}
                          </h4>
                          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">
                            Motor: {nomeDoJogo(exercicioParaPrescrever.jogo)}
                          </p>
                        </div>
                      </div>
                      {!editando && (
                        <button
                          onClick={() => setExercicioParaPrescrever(null)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm"
                        >
                          Trocar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Objetivo Específico
                        </label>
                        <input
                          type="text"
                          value={formPrescricao.objetivo}
                          onChange={(e) =>
                            setFormPrescricao({
                              ...formPrescricao,
                              objetivo: e.target.value,
                            })
                          }
                          aria-invalid={!!erros.objetivo}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                          placeholder="Ex: Aumentar resistência..."
                        />
                        <Erro mensagem={erros.objetivo} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Ação Principal
                        </label>
                        <input
                          type="text"
                          value={formPrescricao.acaoPrincipal}
                          onChange={(e) =>
                            setFormPrescricao({
                              ...formPrescricao,
                              acaoPrincipal: e.target.value,
                            })
                          }
                          maxLength={40}
                          aria-invalid={!!erros.acaoPrincipal}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                        />
                        <Erro mensagem={erros.acaoPrincipal} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Ação Secundária
                        </label>
                        <input
                          type="text"
                          value={formPrescricao.acaoSecundaria}
                          onChange={(e) =>
                            setFormPrescricao({
                              ...formPrescricao,
                              acaoSecundaria: e.target.value,
                            })
                          }
                          maxLength={40}
                          aria-invalid={!!erros.acaoSecundaria}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                        />
                        <Erro mensagem={erros.acaoSecundaria} />
                      </div>
                      <div className="md:col-span-2 pt-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Instrução ao Paciente (Nota)
                        </label>
                        <textarea
                          value={formPrescricao.observacao}
                          onChange={(e) =>
                            setFormPrescricao({
                              ...formPrescricao,
                              observacao: e.target.value,
                            })
                          }
                          maxLength={500}
                          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-medium h-20 resize-none"
                        ></textarea>
                      </div>
                    </div>

                    <div className="p-5 bg-slate-900 rounded-3xl text-white shadow-lg">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-slate-700 pb-3">
                        <FiSliders /> Parâmetros do Motor
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {CAMPOS_CONTAGEM.map((campo) => (
                          <div
                            key={campo.key}
                            className="bg-slate-800 p-2 rounded-xl border border-slate-700"
                          >
                            <label
                              htmlFor={`prescricao-${campo.key}`}
                              className="block text-[9px] font-bold text-slate-400 uppercase text-center mb-1"
                            >
                              {campo.label}
                            </label>
                            <input
                              id={`prescricao-${campo.key}`}
                              {...atributosNumero(campo.key)}
                              // Guardar como texto enquanto edita: `Number("")`
                              // é 0, então apagar o campo para redigitar
                              // trocava o valor por zero sem avisar.
                              value={formPrescricao[campo.key]}
                              onChange={(e) =>
                                setFormPrescricao({
                                  ...formPrescricao,
                                  [campo.key]: e.target
                                    .value as unknown as number,
                                })
                              }
                              aria-invalid={!!erros[campo.key]}
                              title={erros[campo.key]}
                              className={`w-full p-2 bg-slate-900 border rounded-lg outline-none text-center font-bold text-white text-sm ${
                                erros[campo.key]
                                  ? "border-red-500"
                                  : "border-slate-700 focus:border-emerald-500"
                              }`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                        {CAMPOS_TEMPO.map((campo) => {
                          const { rotulo, dica } = rotulos[campo.rotulo];
                          return (
                            <div
                              key={campo.key}
                              className="bg-slate-800 p-3 rounded-xl border border-slate-700"
                            >
                              <label
                                htmlFor={`prescricao-${campo.key}`}
                                className="block text-[10px] font-bold text-slate-300 uppercase mb-1.5"
                              >
                                {rotulo} (s)
                              </label>
                              <input
                                id={`prescricao-${campo.key}`}
                                {...atributosNumero(campo.key)}
                                value={formPrescricao[campo.key]}
                                onChange={(e) =>
                                  setFormPrescricao({
                                    ...formPrescricao,
                                    [campo.key]: e.target
                                      .value as unknown as number,
                                  })
                                }
                                aria-invalid={!!erros[campo.key]}
                                aria-describedby={`prescricao-${campo.key}-dica`}
                                className={`w-full p-2 bg-slate-900 border rounded-lg outline-none text-center font-bold text-white text-sm ${
                                  erros[campo.key]
                                    ? "border-red-500"
                                    : "border-slate-700 focus:border-emerald-500"
                                }`}
                              />
                              <p
                                id={`prescricao-${campo.key}-dica`}
                                className="mt-1.5 text-[10px] leading-snug text-slate-400"
                              >
                                {dica}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* As caixas de contagem têm ~80px; não cabe uma
                          mensagem embaixo de cada uma. A caixa errada fica
                          com a borda vermelha e o motivo aparece aqui. */}
                      {CAMPOS_NUMERICOS.some((c) => erros[c]) && (
                        <p
                          role="alert"
                          className="mt-3 rounded-xl bg-red-500/10 p-2.5 text-[11px] font-bold text-red-300"
                        >
                          {CAMPOS_NUMERICOS.map((c) => erros[c])
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2">
                            Intervalo Dias (A cada X dias)
                          </label>
                          <input
                            {...atributosNumero("diasInativo")}
                            value={formPrescricao.diasInativo}
                            onChange={(e) =>
                              setFormPrescricao({
                                ...formPrescricao,
                                diasInativo: e.target
                                  .value as unknown as number,
                              })
                            }
                            aria-invalid={!!erros.diasInativo}
                            className={`w-full p-2.5 bg-slate-900 border rounded-lg outline-none font-bold text-white ${
                              erros.diasInativo
                                ? "border-red-500"
                                : "border-slate-700 focus:border-emerald-500"
                            }`}
                          />
                          <Erro mensagem={erros.diasInativo} />
                        </div>

                        {/* ========================================================= */}
                        {/* MÁSCARA APLICADA PARA REMOVER A INTROMISSÃO DO NAVEGADOR  */}
                        {/* ========================================================= */}
                        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2">
                            Pausa Diária (Duração)
                          </label>
                          <PatternFormat
                            format="##:##"
                            inputMode="numeric"
                            mask="_"
                            value={formPrescricao.tempoInativo}
                            onValueChange={(values) =>
                              setFormPrescricao({
                                ...formPrescricao,
                                tempoInativo: values.formattedValue,
                              })
                            }
                            placeholder="00:00"
                            aria-invalid={!!erros.tempoInativo}
                            className={`w-full p-2.5 bg-slate-900 border rounded-lg outline-none font-bold text-white text-center ${
                              erros.tempoInativo
                                ? "border-red-500"
                                : "border-slate-700 focus:border-emerald-500"
                            }`}
                          />
                          <Erro mensagem={erros.tempoInativo} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                      <button
                        onClick={
                          editando
                            ? onClose
                            : () => setExercicioParaPrescrever(null)
                        }
                        className="w-full sm:flex-1 py-4 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl transition-all active:scale-95"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleConfirmar}
                        className="w-full sm:flex-2 py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95"
                      >
                        <FiSave className="text-xl shrink-0" />
                        {editando ? "Salvar alterações" : "Confirmar Prescrição"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
