import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaDumbbell, FaTrash, FaPlus, FaPen, FaYoutube } from "react-icons/fa";
import { BottomBar } from "../components/BottomBar";
import { exerciciosServices } from "@services";
import { Exercicio } from "@interfaces";

export function TratamentosProfPage() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const carregarExercicios = async () => {
    setCarregando(true);
    try {
      const usuarioLocal = localStorage.getItem("usuario");
      const usuarioId = usuarioLocal ? JSON.parse(usuarioLocal).id : null;

      if (!usuarioId) {
        console.warn("Usuário não identificado.");
        return;
      }

      const response =
        await exerciciosServices.buscarExerciciosDoProfissional(usuarioId);
      setExercicios(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error("Erro ao buscar exercícios", error);
      setExercicios([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarExercicios();
  }, []);

  const deletarExercicio = async (id: string) => {
    if (!window.confirm("Deseja realmente remover este exercício?")) return;
    try {
      await exerciciosServices.deletarExercicio(id);
      alert("Exercício deletado com sucesso!");
      carregarExercicios();
    } catch (error) {
      console.error("Erro ao deletar exercício", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
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
          ) : exercicios.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
              <p className="text-slate-400 text-sm">
                Nenhum exercício encontrado.
              </p>
            </div>
          ) : (
            exercicios.map((item: any) => (
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
                      Categoria: {item.categoria || "---"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.descricao}
                    </p>
                    {item.url_video && (
                      <a
                        href={item.url_video}
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
                    onClick={() => navigate(`/tratamentos/detalhes/${item.id}`)}
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

      <BottomBar tipo="profissional" ativo="tratamentos" />
    </div>
  );
}

export default TratamentosProfPage;
