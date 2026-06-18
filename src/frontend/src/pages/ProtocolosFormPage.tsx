import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  FiArrowLeft,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiUserPlus,
  FiUserMinus,
  FiCalendar,
} from "react-icons/fi";
import { BottomBar } from "@components";
import {
  protocolosServices,
  exerciciosServices,
  clinicasServices,
  tratamentoServices,
} from "@services";
import { ProtocoloRequestApi, ExercicioInfoResponse } from "@interfaces";

interface ProtocoloFormInputs {
  nome: string;
}

interface NovoVinculoPaciente {
  id: string;
  nome: string;
  dataInicio: string;
}

/**
 * Componente do formulário para criação e edição de Protocolos.
 * Permite a inclusão de múltiplos exercícios e o vínculo simultâneo de múltiplos pacientes,
 * com definição de datas de início individuais por paciente.
 * @returns {JSX.Element} A página de formulário.
 */
export function ProtocolosFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdicao = Boolean(id);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProtocoloFormInputs>({
    defaultValues: { nome: "" },
  });

  // Estados de dados da API
  const [exerciciosDisponiveis, setExerciciosDisponiveis] = useState<
    ExercicioInfoResponse[]
  >([]);
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState<
    ExercicioInfoResponse[]
  >([]);
  const [pacientesAtivos, setPacientesAtivos] = useState<any[]>([]);
  const [clinProfissionalIdReal, setClinProfissionalIdReal] = useState<
    string | null
  >(null);

  // Novos estados para gerenciamento múltiplo de pacientes
  const [novosPacientesVinculados, setNovosPacientesVinculados] = useState<
    NovoVinculoPaciente[]
  >([]);
  const [tratamentosExistentes, setTratamentosExistentes] = useState<any[]>([]);

  const [buscaExercicio, setBuscaExercicio] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(false);

  const clinPlanId = location.state?.clinPlanId || "";
  const usuarioLocalString = localStorage.getItem("usuario");
  const usuarioLocal = usuarioLocalString
    ? JSON.parse(usuarioLocalString)
    : null;
  const profesionalId = usuarioLocal?.id;
  const profissionalCrefito = usuarioLocal?.crefito;

  useEffect(() => {
    carregarDependencias();
  }, [id, clinPlanId, profesionalId]);

  /**
   * Carrega os exercícios disponíveis, os pacientes da clínica, o ID de vínculo do profissional
   * e, se for edição, os tratamentos/pacientes já vinculados a este protocolo.
   */
  const carregarDependencias = async () => {
    if (!profesionalId) return;

    setCarregandoDados(true);
    try {
      const promessas = [
        exerciciosServices.buscarExerciciosDoProfissional(profesionalId),
      ];

      if (clinPlanId) {
        promessas.push(
          clinicasServices.carregarListaPacientesAtivos(clinPlanId),
        );
        promessas.push(clinicasServices.carregarListaProfissionais(clinPlanId));
      }

      const resultados = await Promise.all(promessas);

      const todosExercicios = resultados[0];
      setExerciciosDisponiveis(todosExercicios || []);

      let profissionalVinculoId = clinProfissionalIdReal;

      if (clinPlanId) {
        const pacientes = resultados[1];
        if (pacientes) setPacientesAtivos(pacientes);

        const profissionais = resultados[2];
        if (profissionais && profissionalCrefito) {
          const meuVinculo = profissionais.find(
            (p: any) => p.crefito === profissionalCrefito,
          );
          if (meuVinculo) {
            profissionalVinculoId = meuVinculo.id;
            setClinProfissionalIdReal(meuVinculo.id);
          }
        }
      }

      // Se for edição, carregamos os dados do protocolo e os pacientes já vinculados
      if (isEdicao && id) {
        const protocolo = await protocolosServices.buscarPorId(id);
        setValue("nome", protocolo.nome);

        if (protocolo.exercicioIds && protocolo.exercicioIds.length > 0) {
          const selecionados = (todosExercicios || []).filter(
            (ex: ExercicioInfoResponse) =>
              protocolo.exercicioIds.includes(ex.id),
          );
          setExerciciosSelecionados(selecionados);
        }

        // Busca tratamentos existentes deste profissional para filtrar os deste protocolo
        if (profissionalVinculoId) {
          const todosTratamentos =
            await tratamentoServices.listarPorProfissional(
              profissionalVinculoId,
            );
          const filtrados = todosTratamentos.filter(
            (t: any) => t.protocoloId === id,
          );
          setTratamentosExistentes(filtrados);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dependências do formulário", error);
    } finally {
      setCarregandoDados(false);
    }
  };

  /**
   * Adiciona um paciente à lista de novos vínculos pendentes de salvamento.
   * @param {string} pacienteId - O ID do paciente selecionado no select.
   */
  const handleAdicionarPacienteParaVinculo = (pacienteId: string) => {
    if (!pacienteId) return;

    // Verifica se já não está na lista de novos ou de existentes
    if (novosPacientesVinculados.find((p) => p.id === pacienteId)) return;
    if (tratamentosExistentes.find((t) => t.clinPacienteId === pacienteId)) {
      alert("Este paciente já está vinculado a este protocolo.");
      return;
    }

    const pacienteDados = pacientesAtivos.find((p) => p.id === pacienteId);
    if (pacienteDados) {
      setNovosPacientesVinculados((prev) => [
        ...prev,
        { id: pacienteDados.id, nome: pacienteDados.nome, dataInicio: "" },
      ]);
    }
  };

  /**
   * Atualiza a data de início específica de um paciente na lista de novos vínculos.
   * @param {string} pacienteId - O ID do paciente.
   * @param {string} data - A data selecionada (YYYY-MM-DD).
   */
  const handleAlterarDataInicioNovoPaciente = (
    pacienteId: string,
    data: string,
  ) => {
    setNovosPacientesVinculados((prev) =>
      prev.map((p) => (p.id === pacienteId ? { ...p, dataInicio: data } : p)),
    );
  };

  /**
   * Remove um paciente da lista de novos vínculos antes de submeter.
   * @param {string} pacienteId - O ID do paciente a ser removido da lista temporária.
   */
  const handleRemoverNovoPacienteDaLista = (pacienteId: string) => {
    setNovosPacientesVinculados((prev) =>
      prev.filter((p) => p.id !== pacienteId),
    );
  };

  /**
   * Cancela e remove um tratamento definitivo diretamente na API (Desfazer vínculo existente).
   * @param {string} tratamentoId - O ID do tratamento a ser excluído.
   */
  const handleDeletarTratamentoExistente = async (tratamentoId: string) => {
    if (
      !window.confirm(
        "Deseja realmente remover o vínculo deste paciente com este protocolo? O tratamento será excluído.",
      )
    )
      return;

    try {
      await tratamentoServices.deletar(tratamentoId);
      setTratamentosExistentes((prev) =>
        prev.filter((t) => t.id !== tratamentoId),
      );
      alert("Vínculo removido com sucesso!");
    } catch (error) {
      console.error("Erro ao deletar tratamento", error);
      alert("Não foi possível remover o vínculo do paciente.");
    }
  };

  const adicionarExercicio = (ex: ExercicioInfoResponse) => {
    if (!exerciciosSelecionados.find((e) => e.id === ex.id)) {
      setExerciciosSelecionados((prev) => [...prev, ex]);
    }
  };

  const removerExercicio = (exercicioId: string) => {
    setExerciciosSelecionados((prev) =>
      prev.filter((e) => e.id !== exercicioId),
    );
  };

  /**
   * Submete o formulário executando a criação/edição do protocolo e o lote de requisições de tratamentos.
   * @param {ProtocoloFormInputs} data - Dados do formulário base.
   */
  const onSubmit = async (data: ProtocoloFormInputs) => {
    if (!clinPlanId) {
      alert(
        "Erro: ID da clínica não encontrado. Volte e selecione uma clínica.",
      );
      return;
    }

    // Validação de segurança: se houver novos pacientes, todos precisam ter data de início preenchida
    const dataFaltando = novosPacientesVinculados.some((p) => !p.dataInicio);
    if (dataFaltando) {
      alert(
        "Por favor, preencha a data de início de todos os pacientes selecionados.",
      );
      return;
    }

    setSalvando(true);
    try {
      const payloadProtocolo: ProtocoloRequestApi = {
        nome: data.nome,
        clinPlanId: clinPlanId,
        exercicioIds: exerciciosSelecionados.map((ex) => ex.id),
      };

      let protocoloIdFinal = id;

      // PASSO 1: Salvar Protocolo
      if (isEdicao && id) {
        await protocolosServices.atualizar(id, payloadProtocolo);
      } else {
        const novoProtocolo =
          await protocolosServices.cadastrar(payloadProtocolo);
        protocoloIdFinal = novoProtocolo.id;
      }

      // PASSO 2 e 3: Processar lista de novos pacientes em lote (múltiplas requisições paralelas)
      if (novosPacientesVinculados.length > 0 && protocoloIdFinal) {
        if (!clinProfissionalIdReal) {
          alert(
            "Protocolo salvo, mas os vínculos de pacientes falharam: ID de profissional não identificado na clínica.",
          );
          setSalvando(false);
          return;
        }

        const promessasVincular = novosPacientesVinculados.map(
          async (paciente) => {
            const payloadTratamento = {
              clinPacienteId: paciente.id,
              clinProfissionalId: clinProfissionalIdReal,
              inicio: paciente.dataInicio,
              sequencia: 1,
            };
            // Cria o tratamento para o paciente
            const novoTratamento =
              await tratamentoServices.cadastrar(payloadTratamento);
            // Vincula o protocolo ao tratamento criado
            await tratamentoServices.definirProtocolo(
              novoTratamento.id,
              protocoloIdFinal!,
            );
          },
        );

        await Promise.all(promessasVincular);
      }

      alert("Operação concluída com sucesso!");
      navigate("/protocolos");
    } catch (error) {
      console.error("Erro ao processar o formulário", error);
      alert("Erro ao salvar. Verifique o console para obter detalhes.");
    } finally {
      setSalvando(false);
    }
  };

  const exerciciosFiltrados = exerciciosDisponiveis
    .filter((e) => e.nome?.toLowerCase().includes(buscaExercicio.toLowerCase()))
    .filter((e) => !exerciciosSelecionados.find((s) => s.id === e.id));

  // Filtra do select de pacientes aqueles que ainda não estão em processo de novos vínculos
  const opçõesPacientesDisponiveis = pacientesAtivos.filter(
    (pa) => !novosPacientesVinculados.some((np) => np.id === pa.id),
  );

  if (carregandoDados) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        A carregar dados necessários...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-4 shadow-sm border-b border-slate-200">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">
            {isEdicao ? (
              <>
                Editar <span className="text-emerald-500">protocolo</span>
              </>
            ) : (
              <>
                Novo <span className="text-emerald-500">protocolo</span>
              </>
            )}
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Secção 1: Dados Básicos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              Nome do protocolo
            </label>
            <input
              {...register("nome", { required: "O nome é obrigatório" })}
              placeholder="Ex.: Protocolo Lombalgia"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 transition-all text-sm"
            />
            {errors.nome && (
              <span className="text-red-500 text-xs">
                {errors.nome.message}
              </span>
            )}
          </div>
        </div>

        {/* Secção 2: Gerenciamento Múltiplo de Pacientes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FiUserPlus className="text-emerald-500 text-lg" />
            <h2 className="text-sm font-bold text-slate-700">
              Prescrever a Pacientes
            </h2>
          </div>

          {/* Seletor para adicionar à lista */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              Selecionar paciente para adicionar
            </label>
            <select
              onChange={(e) => {
                handleAdicionarPacienteParaVinculo(e.target.value);
                e.target.value = ""; // limpa após selecionar
              }}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-emerald-500 transition-all text-sm text-slate-700"
            >
              <option value="">
                -- Escolha um paciente para adicionar à lista --
              </option>
              {opçõesPacientesDisponiveis.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Renderização da lista de NOVOS vínculos com datas individuais abaixo */}
          {novosPacientesVinculados.length > 0 && (
            <div className="space-y-3 mt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Novos pacientes a vincular
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {novosPacientesVinculados.map((paciente) => (
                  <div
                    key={paciente.id}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-700 truncate">
                        {paciente.nome}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoverNovoPacienteDaLista(paciente.id)
                        }
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Remover da lista"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <FiCalendar /> Data de Início *
                      </label>
                      <input
                        type="date"
                        value={paciente.dataInicio}
                        required
                        onChange={(e) =>
                          handleAlterarDataInicioNovoPaciente(
                            paciente.id,
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 outline-none focus:border-emerald-500 text-xs text-slate-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Renderização da lista de vínculos EXISTENTES (Modo Edição) */}
          {isEdicao && tratamentosExistentes.length > 0 && (
            <div className="space-y-3 mt-6 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider">
                Pacientes atualmente em tratamento com este protocolo
              </h3>
              <div className="space-y-2">
                {tratamentosExistentes.map((tratamiento) => {
                  const pacienteNome =
                    pacientesAtivos.find(
                      (p) => p.id === tratamiento.clinPacienteId,
                    )?.nome || "Paciente Vinculado";
                  return (
                    <div
                      key={tratamiento.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-blue-50/50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {pacienteNome}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Iniciado em: {tratamiento.inicio}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeletarTratamentoExistente(tratamiento.id)
                        }
                        className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 bg-white border border-red-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                      >
                        <FiUserMinus /> Desvincular
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Secção 3: Exercícios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lista Disponível */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3 h-fit max-h-[500px] overflow-y-auto">
            <h2 className="text-sm font-bold text-slate-700">
              Adicionar exercícios
            </h2>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <FiSearch className="text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar exercícios..."
                value={buscaExercicio}
                onChange={(e) => setBuscaExercicio(e.target.value)}
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>

            <div className="space-y-2 mt-3">
              {exerciciosFiltrados.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  Nenhum exercício encontrado.
                </p>
              )}
              {exerciciosFiltrados.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-semibold text-slate-700 leading-tight truncate">
                      {ex.nome}
                    </p>
                    <span className="text-xs text-slate-500">
                      {ex.categoria}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => adicionarExercicio(ex)}
                    className="w-8 h-8 rounded-full border border-emerald-500 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-all"
                  >
                    <FiPlus />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Lista Selecionada */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3 h-fit max-h-[500px] overflow-y-auto">
            <h2 className="text-sm font-bold text-slate-700">
              Exercícios incluídos ({exerciciosSelecionados.length})
            </h2>

            {exerciciosSelecionados.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                Nenhum exercício selecionado
              </div>
            ) : (
              <div className="space-y-2">
                {exerciciosSelecionados.map((ex) => (
                  <div
                    key={ex.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-semibold text-slate-700 leading-tight truncate">
                        {ex.nome}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerExercicio(ex.id)}
                      className="text-red-400 hover:text-red-600 p-2 transition-colors"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={salvando}
            className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 text-sm"
          >
            {salvando
              ? "A salvar..."
              : isEdicao
                ? "Salvar alterações"
                : "Concluir e Salvar"}
          </button>
        </div>
      </main>

      <BottomBar tipo="profissional" ativo="protocolos" />
    </div>
  );
}

export default ProtocolosFormPage;
