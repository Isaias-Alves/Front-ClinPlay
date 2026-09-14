import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiSave,
  FiYoutube,
  FiMessageSquare,
  FiSliders,
  FiClock,
  FiCalendar,
  FiActivity,
} from "react-icons/fi";
import { clinicasServices } from "@services";
import { useApp } from "@contexts";
import { obterJogo } from "@games";
import {
  mensagemDeErro,
  validarNumero,
  atributosNumero,
  validarHHMM,
  validarUrlYoutube,
} from "@utils";

interface ExercicioFormData {
  nome: string;
  descricao: string;
  videoUrl: string;
  mensagem: string;
  diasInativoForm: string; // Captura amigável no select para converter em diasInativo
  tempoInativoForm: string; // Captura amigável em HH:MM para converter em segundos
  configPadrao: {
    acaoPrincipal: string;
    acaoSecundaria: string;
    vezesAoDia: number;
    series: number;
    repeticoes: number;
    tempoPrincipal: number;
    tempoSecundario: number;
    tempoDescanso: number;
  };
}

/** Mensagem de erro do campo. */
const Erro = ({ mensagem }: { mensagem?: string }) =>
  mensagem ? (
    <p role="alert" className="mt-1 block text-[11px] font-bold text-red-500">
      {mensagem}
    </p>
  ) : null;

export function ExercicioFormPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { clinicaId } = useParams<{ clinicaId: string }>();
  const { notificar } = useApp();

  const jogoSelecionado: string | undefined = location.state?.jogoSelecionado;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExercicioFormData>({
    defaultValues: {
      diasInativoForm: "0",
      tempoInativoForm: "00:00",
      configPadrao: {
        acaoPrincipal: "Contração",
        acaoSecundaria: "Relaxamento",
        vezesAoDia: 1,
        series: 3,
        repeticoes: 10,
        tempoPrincipal: 3,
        tempoSecundario: 3,
        tempoDescanso: 6,
      },
    },
  });

  // Navegar durante a renderização dispara aviso do React e pode causar
  // atualização de estado durante o render do Router; vai para um efeito.
  useEffect(() => {
    if (!jogoSelecionado || !clinicaId) navigate(-1);
  }, [jogoSelecionado, clinicaId, navigate]);

  /**
   * O formulário é longo e o botão fica no rodapé. Sem isto, um campo
   * inválido lá em cima faz o `handleSubmit` abortar em silêncio: o
   * profissional toca em "Enviar" e a tela não reage. O aviso diz o que
   * houve e o `scrollIntoView` leva até o campo.
   */
  const aoInvalidar = () => {
    notificar("Revise os campos destacados em vermelho.", "erro");
    document
      .querySelector('[aria-invalid="true"]')
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const onSubmit = async (data: ExercicioFormData) => {
    if (!jogoSelecionado || !clinicaId) return;

    setIsSubmitting(true);
    try {
      // Conversão amigável da máscara HH:MM para horas exigidas pelo banco de dados
      const [horas, minutos] = (data.tempoInativoForm || "00:00")
        .split(":")
        .map(Number);
      const tempoInativo = horas + (isNaN(minutos) ? 0 : minutos) / 60;

      // Montagem do payload exato mapeando o DTO e a entidade Java
      const payload = {
        nome: data.nome,
        descricao: data.descricao,
        jogo: jogoSelecionado,
        videoUrl: data.videoUrl,
        mensagem: data.mensagem,
        configPadrao: {
          acaoPrincipal: data.configPadrao.acaoPrincipal,
          acaoSecundaria: data.configPadrao.acaoSecundaria,
          vezesAoDia: Number(data.configPadrao.vezesAoDia),
          series: Number(data.configPadrao.series),
          repeticoes: Number(data.configPadrao.repeticoes),
          diasInativo: Number(data.diasInativoForm),
          tempoInativo: tempoInativo,
          tempoPrincipal: Number(data.configPadrao.tempoPrincipal),
          tempoSecundario: Number(data.configPadrao.tempoSecundario),
          tempoDescanso: Number(data.configPadrao.tempoDescanso),
        },
      };

      await clinicasServices.solicitarExercicio(clinicaId, payload);

      notificar(
        "Exercício submetido para aprovação/criação com sucesso!",
        "sucesso",
      );
      navigate("/inicio-profissional");
    } catch (error) {
      notificar(mensagemDeErro(error, "Erro ao cadastrar exercício."), "erro");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-100/50 pb-20 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white text-slate-500 hover:text-slate-800 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center gap-2 font-bold text-sm"
          >
            <FiArrowLeft /> Trocar Jogo
          </button>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
        >
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h1 className="text-2xl font-extrabold text-slate-800">
              Criar Novo Exercício
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Motor visual do biofeedback:{" "}
              <span className="font-bold text-emerald-600">
                {obterJogo(jogoSelecionado).nome}
              </span>
            </p>
          </div>

          <form
            noValidate
            onSubmit={handleSubmit(onSubmit, aoInvalidar)}
            className="p-8 space-y-10"
          >
            {/* INFORMAÇÕES GERAIS */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200/60 pb-3">
                <FiMessageSquare className="text-lg" /> Informações
                Identificadoras
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    NOME DO EXERCÍCIO
                  </label>
                  <input
                    {...register("nome", {
                      required: "O nome é obrigatório",
                      maxLength: {
                        value: 100,
                        message: "Máximo de 100 caracteres",
                      },
                    })}
                    maxLength={100}
                    aria-invalid={!!errors.nome}
                    className="w-full p-3.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none transition-all font-semibold text-slate-700"
                    placeholder="Ex: Treino de Fast Fibers - Inicial"
                  />
                  {errors.nome && (
                    <span className="text-red-500 text-xs font-bold mt-1 block">
                      {errors.nome.message}
                    </span>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    DESCRIÇÃO / ORIENTAÇÃO AO PACIENTE
                  </label>
                  <textarea
                    {...register("descricao", {
                      maxLength: {
                        value: 1000,
                        message: "Máximo de 1000 caracteres",
                      },
                    })}
                    maxLength={1000}
                    className="w-full p-3.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl outline-none h-24 resize-none text-slate-600 font-medium"
                    placeholder="Oriente o paciente sobre o posicionamento e postura antes de iniciar o jogo..."
                  />
                  <Erro mensagem={errors.descricao?.message} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <FiYoutube className="text-red-500" /> VÍDEO DEMONSTRATIVO
                    (URL)
                  </label>
                  <input
                    {...register("videoUrl", { validate: validarUrlYoutube })}
                    className={`w-full p-3.5 bg-white border ${errors.videoUrl ? "border-red-400 focus:border-red-400" : "border-slate-200 focus:border-emerald-500"} rounded-xl outline-none text-slate-600`}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  {errors.videoUrl && (
                    <span className="text-red-500 text-xs font-bold mt-1 block">
                      {errors.videoUrl.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* DIVISÃO 1: CONFIGURAÇÕES DE EXECUÇÃO (MECÂNICAS DO JOGO) */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
              <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200/60 pb-3">
                <FiActivity className="text-lg" /> Divisão 1: Parâmetros do Jogo
                (Mecânica Ativa)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    TEXTO DA AÇÃO PRINCIPAL
                  </label>
                  <input
                    type="text"
                    {...register("configPadrao.acaoPrincipal", {
                      required: "Obrigatório",
                      maxLength: { value: 40, message: "Máximo de 40" },
                    })}
                    maxLength={40}
                    aria-invalid={!!errors.configPadrao?.acaoPrincipal}
                    placeholder="Ex: Contrair / Inspirar"
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold text-slate-700"
                  />
                  <Erro mensagem={errors.configPadrao?.acaoPrincipal?.message} />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    * Comando exibido na tela no momento de pico de esforço.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    TEXTO DA AÇÃO SECUNDÁRIA
                  </label>
                  <input
                    type="text"
                    {...register("configPadrao.acaoSecundaria", {
                      required: "Obrigatório",
                      maxLength: { value: 40, message: "Máximo de 40" },
                    })}
                    maxLength={40}
                    aria-invalid={!!errors.configPadrao?.acaoSecundaria}
                    placeholder="Ex: Relaxar / Expirar"
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-semibold text-slate-700"
                  />
                  <Erro mensagem={errors.configPadrao?.acaoSecundaria?.message} />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    * Comando exibido na tela na segunda fase do movimento.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2">
                <div>
                  <label
                    className="block text-[10px] font-bold text-slate-700 mb-1.5"
                    title="Duração da ação principal em segundos"
                  >
                    TEMPO PRINCIPAL (s)
                  </label>
                  <input
                    {...atributosNumero("tempoPrincipal")}
                    {...register("configPadrao.tempoPrincipal", {
                      validate: (v) => validarNumero(v, "tempoPrincipal"),
                    })}
                    aria-invalid={!!errors.configPadrao?.tempoPrincipal}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-center focus:border-indigo-500"
                  />
                  <Erro mensagem={errors.configPadrao?.tempoPrincipal?.message} />
                </div>
                <div>
                  <label
                    className="block text-[10px] font-bold text-slate-700 mb-1.5"
                    title="Duração da ação secundária em segundos"
                  >
                    TEMPO SECUNDÁRIO (s)
                  </label>
                  <input
                    {...atributosNumero("tempoSecundario")}
                    {...register("configPadrao.tempoSecundario", {
                      validate: (v) => validarNumero(v, "tempoSecundario"),
                    })}
                    aria-invalid={!!errors.configPadrao?.tempoSecundario}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-center focus:border-indigo-500"
                  />
                  <Erro mensagem={errors.configPadrao?.tempoSecundario?.message} />
                </div>
                <div>
                  <label
                    className="block text-[10px] font-bold text-slate-700 mb-1.5"
                    title="Pausa entre as repetições"
                  >
                    PAUSA/DESCANSO (s)
                  </label>
                  <input
                    {...atributosNumero("tempoDescanso")}
                    {...register("configPadrao.tempoDescanso", {
                      validate: (v) => validarNumero(v, "tempoDescanso"),
                    })}
                    aria-invalid={!!errors.configPadrao?.tempoDescanso}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-center focus:border-indigo-500"
                  />
                  <Erro mensagem={errors.configPadrao?.tempoDescanso?.message} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1.5">
                    SÉRIES NO JOGO
                  </label>
                  <input
                    {...atributosNumero("series")}
                    {...register("configPadrao.series", {
                      validate: (v) => validarNumero(v, "series"),
                    })}
                    aria-invalid={!!errors.configPadrao?.series}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-center focus:border-indigo-500"
                  />
                  <Erro mensagem={errors.configPadrao?.series?.message} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1.5">
                    REPETIÇÕES/SÉRIE
                  </label>
                  <input
                    {...atributosNumero("repeticoes")}
                    {...register("configPadrao.repeticoes", {
                      validate: (v) => validarNumero(v, "repeticoes"),
                    })}
                    aria-invalid={!!errors.configPadrao?.repeticoes}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-center focus:border-indigo-500"
                  />
                  <Erro mensagem={errors.configPadrao?.repeticoes?.message} />
                </div>
              </div>
            </div>

            {/* DIVISÃO 2: CONFIGURAÇÕES DE ROTINA (FREQUÊNCIA DE AGENDAMENTO) */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-6">
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200/60 pb-3">
                <FiCalendar className="text-lg" /> Divisão 2: Parâmetros de
                Calendário e Frequência
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    EXECUÇÕES DIÁRIAS
                  </label>
                  <input
                    {...atributosNumero("vezesAoDia")}
                    {...register("configPadrao.vezesAoDia", {
                      validate: (v) => validarNumero(v, "vezesAoDia"),
                    })}
                    aria-invalid={!!errors.configPadrao?.vezesAoDia}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:border-emerald-500"
                  />
                  <Erro mensagem={errors.configPadrao?.vezesAoDia?.message} />
                  <span className="text-[12px] text-slate-400 mt-2 mb-5 block leading-normal">
                    * Quantas sessões completas o paciente precisa fechar no dia
                    para bater a meta.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    INTERVALO DIÁRIO (FREQUÊNCIA)
                  </label>
                  <select
                    {...register("diasInativoForm")}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-700 appearance-none cursor-pointer focus:border-emerald-500"
                  >
                    <option value="0">Todos os dias (Sem pausa)</option>
                    <option value="1">Dia sim, dia não (A cada 2 dias)</option>
                    <option value="2">A cada 3 dias</option>
                    <option value="6">
                      Uma vez por semana (A cada 7 dias)
                    </option>
                  </select>
                  <span className="text-[12px] text-amber-600 font-medium mt-2 mb-5 block leading-normal">
                    💡 <strong>O que significa?</strong> Define os dias de
                    descanso. Ex: "Dia sim, dia não".
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <FiClock /> PAUSA ENTRE SESSÕES
                  </label>
                  <input
                    type="text"
                    {...register("tempoInativoForm", {
                      // O padrão anterior (`\d{1,2}:\d{2}`) deixava passar
                      // "99:99", que virava 100,65 h de bloqueio — quatro
                      // dias sem o paciente conseguir repetir o exercício.
                      validate: validarHHMM,
                    })}
                    inputMode="numeric"
                    aria-invalid={!!errors.tempoInativoForm}
                    placeholder="02:30"
                    maxLength={5}
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-700 text-center tracking-widest placeholder:text-slate-300 placeholder:font-normal focus:border-emerald-500"
                  />
                  {errors.tempoInativoForm && (
                    <span className="text-red-500 text-xs font-bold mt-1 block">
                      {errors.tempoInativoForm.message}
                    </span>
                  )}
                  <span className="text-[12px] text-slate-400 mt-2 block leading-normal">
                    * Tempo mínimo de descanso em <strong>Horas:Minutos</strong>{" "}
                    obrigatório antes de liberar o exercício novamente.
                    <br />
                  </span>
                </div>
              </div>
            </div>

            {/* Mensagem de Solicitação */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                JUSTIFICATIVA CLÍNICA DA CRIAÇÃO (MENSAGEM AO ADMINISTRADOR)
              </label>
              <input
                {...register("mensagem", {
                  maxLength: {
                    value: 500,
                    message: "Máximo de 500 caracteres",
                  },
                })}
                maxLength={500}
                className="w-full p-3.5 bg-amber-50/50 border border-amber-200 focus:border-amber-400 rounded-xl outline-none text-slate-700 font-medium"
                placeholder="Ex: Solicito este motor para trabalhar contrações tônicas sustentadas em pacientes com disfunções específicas..."
              />
              <Erro mensagem={errors.mensagem?.message} />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2 text-lg"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <FiSave className="text-xl" /> Enviar Exercício para Análise
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default ExercicioFormPage;
