import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit2,
  FiChevronRight,
  FiBookOpen,
} from "react-icons/fi";
import { BottomBar } from "@components";
import { protocolosServices } from "@services";
import { exerciciosServices } from "@services";
import { ProtocoloResponseApi, ExercicioInfoResponse } from "@interfaces";

const BADGE_CORES: Record<string, string> = {
  Alongamento: "bg-blue-50 text-blue-600",
  Fortalecimento: "bg-orange-50 text-orange-600",
  Reabilitação: "bg-purple-50 text-purple-600",
  Mobilidade: "bg-pink-50 text-pink-600",
  Educação: "bg-yellow-50 text-yellow-600",
  Outro: "bg-slate-100 text-slate-600",
};

/**
 * Componente da página de detalhes do protocolo.
 * Removeu-se os mocks visuais que não existem na API (objetivo, pacientes, categoria do protocolo).
 * Busca o protocolo pelo ID e, em seguida, os detalhes de cada exercício vinculado.
 * @returns {JSX.Element} A página de detalhes.
 */
export function ProtocoloDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Preserva o clinPlanId se veio da navegação anterior
  const clinPlanIdAnterior = location.state?.clinPlanId;

  const [protocolo, setProtocolo] = useState<ProtocoloResponseApi | null>(null);
  const [exercicios, setExercicios] = useState<ExercicioInfoResponse[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [id]);

  /**
   * Realiza o fetch do protocolo e, caso possua exercícios vinculados,
   * dispara chamadas paralelas à API para buscar os detalhes de cada um.
   */
  const carregarDados = async () => {
    if (!id) return;
    setCarregando(true);
    try {
      // 1. Busca os dados estritos do protocolo
      const protocoloData = await protocolosServices.buscarPorId(id);
      setProtocolo(protocoloData);

      // 2. Busca os detalhes reais dos exercícios usando os IDs do protocolo
      if (protocoloData.exercicioIds && protocoloData.exercicioIds.length > 0) {
        const promessasExercicios = protocoloData.exercicioIds.map(
          (exId: string) => exerciciosServices.buscarExercicioPorId(exId),
        );
        const exerciciosDetalhados = await Promise.all(promessasExercicios);
        setExercicios(exerciciosDetalhados);
      } else {
        setExercicios([]);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do protocolo", error);
      alert("Não foi possível carregar os detalhes do protocolo.");
    } finally {
      setCarregando(false);
    }
  };

  if (carregando || !protocolo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400 text-sm">
          Carregando detalhes do protocolo...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-4 shadow-sm border-b border-slate-200">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
          >
            <FiArrowLeft className="text-xl" />
          </button>
          <img src="/logo-clinplay.svg" alt="ClinPlay" className="h-7" />
          <button
            onClick={() =>
              navigate(`/protocolos/formulario/${protocolo.id}`, {
                state: {
                  clinPlanId: clinPlanIdAnterior || protocolo.clinPlanId,
                },
              })
            }
            className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            <FiEdit2 /> Editar
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-5">
        {/* Info do protocolo focado no que a API suporta */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex gap-4">
          <div className="w-24 h-24 bg-emerald-50 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
            <FiBookOpen className="text-emerald-300 text-4xl" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h1 className="text-lg font-bold text-slate-800 leading-tight">
              {protocolo.nome}
            </h1>
            <span className="inline-block w-max text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium mt-3">
              {protocolo.exercicioIds?.length || 0} exercícios
            </span>
          </div>
        </div>

        {/* Lista Real de Exercícios */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              Exercícios do protocolo
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {exercicios.length === 0 ? (
              <p className="p-6 text-sm text-slate-400 text-center">
                Nenhum exercício vinculado a este protocolo.
              </p>
            ) : (
              exercicios.map((ex, index) => (
                <div
                  key={ex.id}
                  className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/tratamentos/detalhes/${ex.id}`)}
                >
                  <span className="text-xs font-bold text-slate-400 w-5 flex-shrink-0">
                    {index + 1}.
                  </span>
                  <div className="w-14 h-12 bg-emerald-50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {/* Se no futuro a API retornar URL da thumb, renderiza-se a img aqui */}
                    <FiBookOpen className="text-emerald-300 text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 leading-tight truncate">
                      {ex.nome}
                    </p>
                    <span
                      className={`inline-block mt-1.5 text-xs px-2.5 py-0.5 rounded-full font-medium ${
                        BADGE_CORES[ex.categoria] ||
                        "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {ex.categoria}
                    </span>
                  </div>
                  <FiChevronRight className="text-slate-300 flex-shrink-0" />
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <BottomBar tipo="profissional" ativo="protocolos" />
    </div>
  );
}

export default ProtocoloDetalhesPage;
