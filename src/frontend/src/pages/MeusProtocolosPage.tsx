import { useState, useEffect } from "react";
import {
  FiBookOpen,
  FiClock,
  FiActivity,
  FiChevronDown,
  FiChevronUp,
  FiPlayCircle,
  FiHome,
} from "react-icons/fi";
import { BottomBar } from "@components";
import {
  tratamentoServices,
  protocolosServices,
  exerciciosServices,
  clinicasServices,
} from "@services";
import { TratamentoResponseApi, ExercicioInfoResponse } from "@interfaces";

interface TratamentoExibicao extends TratamentoResponseApi {
  protocoloNome?: string;
  // Permitimos campos dinâmicos adicionais que possam vir da API (como url_video ou urlVideo)
  exercicios?: (ExercicioInfoResponse & {
    url_video?: string;
    urlVideo?: string;
    nome_exercicio?: string;
  })[];
}

/**
 * Componente da página de visualização de protocolos para o Paciente.
 * Executa rigidamente o fluxo de duas etapas:
 * 1. GET /clin/paciente/self -> Obtém os vínculos e descobre o clinPacienteId real.
 * 2. GET /tratamento/self/{clinPacienteId} -> Usa o ID do vínculo na URL de forma correta.
 * 3. GET /protocolo/{id} e GET /exercicio/{id} -> Carrega os detalhes dos exercícios em paralelo.
 * @returns {JSX.Element} A página estruturada de tratamentos do paciente.
 */
export function MeusProtocolosPage() {
  const [vinculos, setVinculos] = useState<any[]>([]);
  const [vinculoSelecionado, setVinculoSelecionado] = useState<string>("");

  const [tratamentos, setTratamentos] = useState<TratamentoExibicao[]>([]);
  const [carregandoTratamentos, setCarregandoTratamentos] = useState(false);
  const [tratamentoAberto, setTratamentoAberto] = useState<string | null>(null);

  useEffect(() => {
    carregarVinculosIniciais();
  }, []);

  useEffect(() => {
    if (vinculoSelecionado) {
      carregarPlanoDeTratamentos(vinculoSelecionado);
    } else {
      setTratamentos([]);
    }
  }, [vinculoSelecionado]);

  /**
   * Realiza a primeira requisição do fluxo para descobrir os vínculos do paciente.
   * Endpoint consumido: GET /clin/paciente/self
   */
  const carregarVinculosIniciais = async () => {
    try {
      const meusVinculos = await clinicasServices.buscarMeusVinculos();
      setVinculos(meusVinculos || []);

      if (meusVinculos && meusVinculos.length === 1) {
        setVinculoSelecionado(meusVinculos[0].id);
      }
    } catch (error) {
      console.error(
        "Erro ao executar a primeira etapa (buscar vínculos)",
        error,
      );
    }
  };

  /**
   * Realiza a segunda requisição do fluxo utilizando o clinPacienteId selecionado.
   * Endpoint consumido: GET /tratamento/self/{clinPacienteId}
   * @param {string} clinPacienteId - O UUID do vínculo selecionado.
   */
  const carregarPlanoDeTratamentos = async (clinPacienteId: string) => {
    setCarregandoTratamentos(true);
    setTratamentoAberto(null);
    try {
      const listaTratamentos =
        await tratamentoServices.listarMeus(clinPacienteId);

      const tratamentosComDetalhes = await Promise.all(
        listaTratamentos.map(async (tratamento) => {
          if (tratamento.protocoloId) {
            try {
              const protocolo = await protocolosServices.buscarPorId(
                tratamento.protocoloId,
              );

              let exerciciosDetalhados: any[] = [];
              if (protocolo.exercicioIds && protocolo.exercicioIds.length > 0) {
                const promessasExercicios = protocolo.exercicioIds.map((exId) =>
                  exerciciosServices.buscarExercicioPorId(exId),
                );
                exerciciosDetalhados = await Promise.all(promessasExercicios);
              }

              return {
                ...tratamento,
                protocoloNome: protocolo.nome,
                exercicios: exerciciosDetalhados,
              };
            } catch (err) {
              console.error(
                `Falha ao obter dados complementares do protocolo ${tratamento.protocoloId}`,
                err,
              );
              return {
                ...tratamento,
                protocoloNome: "Protocolo Indisponível",
                exercicios: [],
              };
            }
          }
          return {
            ...tratamento,
            protocoloNome: "Sem protocolo definido",
            exercicios: [],
          };
        }),
      );

      setTratamentos(tratamentosComDetalhes);
    } catch (error) {
      console.error(
        "Erro ao executar a segunda etapa (buscar tratamentos por vínculo)",
        error,
      );
      setTratamentos([]);
    } finally {
      setCarregandoTratamentos(false);
    }
  };

  const toggleTratamento = (id: string) => {
    setTratamentoAberto(tratamentoAberto === id ? null : id);
  };

  /**
   * Abre o vídeo do exercício numa nova aba.
   */
  const handleAbrirVideo = (url?: string) => {
    if (url) {
      // Abre o link de forma segura numa nova aba
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      alert("Este exercício não possui um vídeo cadastrado.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white px-6 pt-10 pb-6 shadow-sm border-b border-slate-200">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-slate-800">
            Meus <span className="text-emerald-500">Tratamentos</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 mb-5">
            Selecione a clínica para visualizar os seus exercícios associados.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 ml-1">
              <FiHome /> Clínica de Atendimento
            </label>
            <select
              value={vinculoSelecionado}
              onChange={(e) => setVinculoSelecionado(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-sm text-slate-700 appearance-none cursor-pointer font-medium"
            >
              <option value="">-- Escolha uma clínica de atendimento --</option>
              {vinculos.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.clinPlan?.nome || v.nome || "Clínica de Fisioterapia"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-4">
        {!vinculoSelecionado ? (
          <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl bg-white p-4 font-medium shadow-sm">
            Selecione uma clínica no menu superior para buscar o seu plano de
            tratamentos ativo.
          </div>
        ) : carregandoTratamentos ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500 mb-2"></div>
            <p className="text-slate-400 text-sm font-medium">
              A consultar os seus protocolos e dados de exercícios...
            </p>
          </div>
        ) : tratamentos.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-200 flex flex-col items-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FiBookOpen className="text-3xl text-slate-300" />
            </div>
            <p className="text-slate-700 font-bold">
              Nenhum tratamento nesta clínica
            </p>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed max-w-xs mx-auto">
              Não foram encontrados protocolos de exercícios prescritos para a
              sua conta nesta unidade selecionada.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tratamentos.map((t) => (
              <div
                key={t.id}
                className={`bg-white rounded-2xl border ${
                  tratamentoAberto === t.id
                    ? "border-emerald-200 shadow-md"
                    : "border-slate-200 shadow-sm"
                } overflow-hidden transition-all`}
              >
                <div
                  onClick={() => toggleTratamento(t.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-colors ${
                        tratamentoAberto === t.id
                          ? "bg-emerald-500 text-white"
                          : "bg-emerald-50 text-emerald-500"
                      }`}
                    >
                      <FiActivity />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 truncate">
                        {t.protocoloNome}
                      </h3>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1.5">
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          {Math.round(t.progressao || 0)}% concluído
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                          <FiClock /> Início:{" "}
                          {new Date(t.inicio).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-slate-400">
                    {tratamentoAberto === t.id ? (
                      <FiChevronUp className="text-xl" />
                    ) : (
                      <FiChevronDown className="text-xl" />
                    )}
                  </div>
                </div>

                {tratamentoAberto === t.id && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">
                      Exercícios do Protocolo ({t.exercicios?.length || 0})
                    </h4>

                    {!t.exercicios || t.exercicios.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-4 bg-white rounded-xl border border-slate-100 font-medium">
                        Não existem exercícios vinculados a este protocolo de
                        tratamento.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {t.exercicios.map((ex, index) => (
                          <div
                            key={ex.id}
                            className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-300 w-4">
                                {index + 1}.
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-slate-700">
                                  {ex.nome_exercicio}
                                </p>
                                <span className="inline-block text-[10px] font-medium text-slate-500 mt-0.5 px-2 py-0.5 bg-slate-100 rounded-md">
                                  {ex.categoria}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              // Tenta utilizar o url_video ou urlVideo caso o formato de serialização do backend varie
                              onClick={() =>
                                handleAbrirVideo(ex.url_video || ex.urlVideo)
                              }
                              className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                              title="Ver Vídeo do Exercício"
                            >
                              <FiPlayCircle className="text-lg" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomBar tipo="paciente" ativo="protocolos" />
    </div>
  );
}

export default MeusProtocolosPage;
