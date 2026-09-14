import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaDumbbell, FaTrash, FaPlus, FaPen, FaYoutube } from "react-icons/fa";
import { BottomBar } from "../components/BottomBar";
import { FalhaAoCarregar } from "@components";
import { exerciciosServices } from "@services";
import { useApp } from "@contexts";
import { ExercicioInfoResponse } from "@interfaces";
import { mensagemDeErro } from "@utils";

export function TratamentosProfPage() {
  const [exercicios, setExercicios] = useState<ExercicioInfoResponse[]>([]);
  const navigate = useNavigate();
  // Os exercícios pertencem à clínica, não ao profissional: a listagem é
  // `GET /clinica/{id}/exercicios`. A rota `GET /exercicio` usada antes não
  // existe no backend, então esta tela nunca carregou nada.
  const { clinicaSelecionadaId, confirmar, notificar } = useApp();

  /** Clínica cujos exercícios já estão em memória. */
  const [carregadosDe, setCarregadosDe] = useState<string | null>(null);
  const [recargasPedidas, setRecargasPedidas] = useState(0);
  /** Separa "clínica sem exercícios" de "a lista não carregou". */
  const [falhou, setFalhou] = useState(false);

  const chave = `${clinicaSelecionadaId}|${recargasPedidas}`;
  const carregando = Boolean(clinicaSelecionadaId) && carregadosDe !== chave;

  useEffect(() => {
    if (!clinicaSelecionadaId) return;

    let cancelado = false;

    exerciciosServices
      .listarDaClinica(clinicaSelecionadaId)
      .then((lista) => {
        if (cancelado) return;
        setExercicios(lista);
        setFalhou(false);
      })
      .catch((error) => {
        if (cancelado) return;
        console.error("Erro ao buscar exercícios", error);
        setExercicios([]);
        setFalhou(true);
      })
      .finally(() => {
        if (!cancelado) setCarregadosDe(chave);
      });

    return () => {
      cancelado = true;
    };
    // `chave` deriva das duas entradas abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicaSelecionadaId, recargasPedidas]);

  const deletarExercicio = async (id: string) => {
    if (!clinicaSelecionadaId) return;
    if (
      !(await confirmar({
        mensagem: "Deseja remover este exercício da clínica?",
        rotuloConfirmar: "Remover",
        destrutivo: true,
      }))
    )
      return;
    try {
      // Não existe `DELETE /exercicio/{id}`: a remoção desfaz o vínculo com
      // a clínica.
      await exerciciosServices.desvincularDaClinica(clinicaSelecionadaId, id);
      notificar("Exercício removido da clínica.", "sucesso");
      setRecargasPedidas((n) => n + 1);
    } catch (error) {
      console.error("Erro ao remover exercício", error);
      notificar(mensagemDeErro(error, "Erro ao remover o exercício."), "erro");
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      <header className="bg-white px-6 py-8 shadow-sm border-b border-slate-200">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaDumbbell className="text-emerald-500" /> Meus Exercícios
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie e crie seus próprios exercícios.
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-6">
        <button
          onClick={() => navigate("/tratamentos/formulario")}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <FaPlus /> Adicionar Exercício
        </button>

        <section className="space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mt-4">
            Exercícios Cadastrados ({exercicios.length})
          </h2>

          {carregando ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Carregando informações...
            </div>
          ) : falhou ? (
            <FalhaAoCarregar
              oQue="os exercícios"
              onTentarNovamente={() => setRecargasPedidas((n) => n + 1)}
            />
          ) : exercicios.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
              <p className="text-slate-400 text-sm">
                Nenhum exercício encontrado.
              </p>
            </div>
          ) : (
            exercicios.map((item) => (
              <div
                key={item.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2 hover:border-emerald-500 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 text-xl">
                    <FaDumbbell />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700">{item.nome}</h3>
                    <p className="text-xs text-slate-400">
                      Motor: {item.jogo || "---"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.descricao}
                    </p>
                    {(item.videoUrl ?? item.url_video) && (
                      <a
                        href={item.videoUrl ?? item.url_video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-red-600 hover:underline flex items-center gap-1 mt-1 font-medium"
                      >
                        <FaYoutube /> Ver no YouTube
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      navigate(`/exercicios/${item.id}`, {
                        state: { exercicio: item },
                      })
                    }
                    className="p-3 text-slate-300 hover:text-emerald-600 rounded-xl transition-all"
                  >
                    <FaPen />
                  </button>
                  <button
                    onClick={() => deletarExercicio(item.id)}
                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <BottomBar />
    </div>
  );
}

export default TratamentosProfPage;
