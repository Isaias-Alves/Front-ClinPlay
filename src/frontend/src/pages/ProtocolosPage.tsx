import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiBookOpen,
} from "react-icons/fi";
import { BottomBar } from "@components";
import { protocolosServices } from "@services";
import { clinicasServices } from "@services"; // Ajuste o caminho se estiver apenas em "@services"
import { ProtocoloResponseApi } from "@interfaces";

interface ClinicaSimples {
  id: string;
  nome: string;
}

/**
 * Componente da página de listagem de protocolos.
 * Busca os dados diretamente da API e exibe os protocolos cadastrados pelo profissional,
 * filtrados pela clínica selecionada.
 * @returns {JSX.Element} A página de protocolos.
 */
export function ProtocolosPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [clinicas, setClinicas] = useState<ClinicaSimples[]>([]);
  const [clinicaSelecionada, setClinicaSelecionada] = useState<string>(
    location.state?.clinPlanId || "",
  );

  const [protocolos, setProtocolos] = useState<ProtocoloResponseApi[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarClinicas();
  }, []);

  useEffect(() => {
    if (clinicaSelecionada) {
      carregarProtocolos(clinicaSelecionada);
    } else {
      setProtocolos([]);
    }
  }, [clinicaSelecionada]);

  /**
   * Busca as clínicas vinculadas ao profissional logado usando a API real.
   */
  const carregarClinicas = async () => {
    try {
      const dados = await clinicasServices.buscarClinicasDoProfissional();
      setClinicas(dados);
    } catch (error) {
      console.error("Erro ao carregar clínicas", error);
    }
  };

  /**
   * Busca a lista de protocolos vinculados ao plano da clínica na API.
   */
  const carregarProtocolos = async (clinPlanId: string) => {
    setCarregando(true);
    try {
      const dados = await protocolosServices.listar(clinPlanId);
      setProtocolos(dados);
    } catch (error) {
      console.error("Erro ao carregar protocolos", error);
      setProtocolos([]);
    } finally {
      setCarregando(false);
    }
  };

  /**
   * Solicita a exclusão de um protocolo à API e atualiza a lista local.
   * @param {string} id - O ID (UUID) do protocolo a ser excluído.
   */
  const deletarProtocolo = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este protocolo?")) return;
    try {
      await protocolosServices.deletar(id);
      setProtocolos((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Erro ao deletar protocolo", error);
      alert("Erro ao excluir protocolo. Tente novamente.");
    }
  };

  const protocolosFiltrados = protocolos.filter((p) =>
    p.nome.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-6 shadow-sm border-b border-slate-200">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center mb-1">
            <img src="/logo-clinplay.svg" alt="ClinPlay" className="h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 text-center mt-4">
            Meus <span className="text-emerald-500">protocolos</span>
          </h1>
          <p className="text-slate-500 text-sm text-center mt-1">
            Selecione uma clínica para gerenciar os protocolos cadastrados nela.
          </p>

          {/* Seletor de Clínica */}
          <div className="mt-5">
            <label className="text-xs font-semibold text-slate-600 block mb-1.5 ml-1">
              Clínica de atuação
            </label>
            <select
              value={clinicaSelecionada}
              onChange={(e) => setClinicaSelecionada(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-all text-sm text-slate-700 appearance-none"
            >
              <option value="">-- Selecione uma clínica --</option>
              {clinicas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Busca + Botão Novo */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus-within:border-emerald-500 transition-all">
              <FiSearch className="text-slate-400 text-lg flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar protocolos"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                disabled={!clinicaSelecionada}
                className="bg-transparent outline-none text-sm w-full text-slate-700 placeholder:text-slate-400 disabled:opacity-50"
              />
            </div>

            <button
              disabled={!clinicaSelecionada}
              onClick={() =>
                navigate("/protocolos/formulario", {
                  state: { clinPlanId: clinicaSelecionada },
                })
              }
              className={`flex items-center gap-2 font-semibold px-4 py-3 rounded-xl shadow-sm transition-all whitespace-nowrap text-sm ${
                clinicaSelecionada
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95 shadow-md"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <FiPlus className="text-lg" /> Novo protocolo
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-4">
        {/* Contador */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">
            Meus protocolos cadastrados
          </h2>
          <span className="text-xs text-slate-500">
            Total: {protocolosFiltrados.length} protocolos
          </span>
        </div>

        {/* Lógica de Estados de Exibição */}
        {!clinicaSelecionada ? (
          <div className="text-center py-12 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
            Selecione uma clínica acima para visualizar os protocolos.
          </div>
        ) : carregando ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Carregando protocolos...
          </div>
        ) : protocolosFiltrados.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
              <FiBookOpen className="text-emerald-400 text-3xl" />
            </div>
            <div>
              <p className="text-slate-700 font-semibold text-base">
                Nenhum protocolo cadastrado
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Crie seu primeiro protocolo clicando em "Novo protocolo"
              </p>
            </div>
            <button
              onClick={() =>
                navigate("/protocolos/formulario", {
                  state: { clinPlanId: clinicaSelecionada },
                })
              }
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 text-sm mt-2"
            >
              <FiPlus /> Criar primeiro protocolo
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {protocolosFiltrados.map((protocolo) => (
              <div
                key={protocolo.id}
                onClick={() => navigate(`/protocolos/${protocolo.id}`)}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex cursor-pointer hover:border-emerald-300 transition-all group"
              >
                <div className="w-24 h-24 bg-emerald-50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <FiBookOpen className="text-emerald-300 text-3xl" />
                </div>

                <div className="flex-1 p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">
                      {protocolo.nome}
                    </h3>
                    <span className="inline-block text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium mt-1">
                      {protocolo.exercicioIds?.length || 0} exercícios
                    </span>
                  </div>

                  <div
                    className="flex flex-col gap-2 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        navigate(`/protocolos/formulario/${protocolo.id}`, {
                          state: { clinPlanId: clinicaSelecionada },
                        })
                      }
                      className="flex flex-col items-center gap-0.5 text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      <FiEdit2 className="text-base" />
                      <span className="text-xs">Editar</span>
                    </button>
                    <button
                      onClick={() => deletarProtocolo(protocolo.id)}
                      className="flex flex-col items-center gap-0.5 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <FiTrash2 className="text-base" />
                      <span className="text-xs">Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomBar tipo="profissional" ativo="protocolos" />
    </div>
  );
}

export default ProtocolosPage;
