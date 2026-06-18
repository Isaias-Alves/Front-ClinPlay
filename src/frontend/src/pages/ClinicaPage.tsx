import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHospital,
  FaTrash,
  FaPlus,
  FaSearch,
  FaPen,
  FaLink,
} from "react-icons/fa";
import { BottomBar } from "../components/BottomBar";
import { clinicasServices } from "@services";
import { ClinicaProfissionalResponse } from "@interfaces";

const tratarErroClinica = (error: any): string => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (typeof data === "string" && data.trim() !== "") {
      return data;
    }

    switch (status) {
      case 400:
        return "Erro nos dados enviados. Verifique se o nome possui pelo menos 5 caracteres.";
      case 401:
        return "Sua sessão expirou. Faça login novamente.";
      case 403:
        return "Você não tem permissão para realizar esta ação.";
      case 404:
        return "Clínica não encontrada no sistema.";
      case 409:
        return "Já existe uma clínica cadastrada com este código.";
      default:
        return "Erro ao processar a requisição. Verifique os dados.";
    }
  }
  return "Não foi possível conectar ao servidor. Verifique sua conexão.";
};

export function ClinicaPage() {
  const [clinicas, setClinicas] = useState<ClinicaProfissionalResponse[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const buscarClinicas = async () => {
    setCarregando(true);
    try {
      const response = await clinicasServices.buscarClinicasDoProfissional();
      setClinicas(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error("Erro ao buscar clínicas do profissional", error);
      setClinicas([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarClinicas();
  }, []);

  const deletarClinica = async (id: string) => {
    if (!window.confirm("Deseja realmente remover esta clínica?")) return;
    try {
      await clinicasServices.deletarClinica(id);
      buscarClinicas();
    } catch (error) {
      console.error("Erro ao deletar clínica", error);
      alert(tratarErroClinica(error));
    }
  };

  const handleBuscarClinicaEspecifica = async () => {
    if (!termoBusca.trim()) {
      alert("Digite um código para pesquisar.");
      return;
    }

    setCarregando(true);
    try {
      const response =
        await clinicasServices.buscarClinicaProfissional(termoBusca);
      const clinicaEncontrada = response.data || response;

      if (clinicaEncontrada) {
        setClinicas([clinicaEncontrada]);
      } else {
        alert("Clínica não encontrada.");
        setClinicas([]);
      }
    } catch (error) {
      console.error("Erro ao buscar clínica específica", error);
      alert("Nenhuma clínica localizada com este código.");
    } finally {
      setCarregando(false);
    }
  };

  const handleVincularClinica = async (e: React.MouseEvent, codigo: string) => {
    e.stopPropagation();
    try {
      const usuarioLocal = localStorage.getItem("usuario");
      const usuarioId = usuarioLocal ? JSON.parse(usuarioLocal).id : null;

      if (!usuarioId) {
        alert("Usuário não identificado. Faça login novamente.");
        return;
      }

      await clinicasServices.solicitarVinculo(codigo, usuarioId);
      alert(`Vinculação à clínica ${codigo} realizada com sucesso!`);
    } catch (error) {
      console.error("Erro ao se vincular à clínica", error);
      alert(tratarErroClinica(error));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white px-6 py-8 shadow-sm border-b border-slate-200">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaHospital className="text-emerald-500" /> Minhas Clínicas
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie os locais onde você realiza seus atendimentos.
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8">
        <button
          onClick={() => navigate("/clinica/formulario")}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <FaPlus /> Nova Clínica
        </button>

        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">
            Buscar Clínica
          </h2>

          <div className="space-y-2 mb-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Digite o código (ex: CL-001)..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 outline-none focus:border-emerald-500 transition-all text-sm shadow-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleBuscarClinicaEspecifica}
                disabled={carregando}
                className="w-1/2 bg-emerald-500 text-white text-sm py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {carregando ? "Buscando..." : "Buscar"}
              </button>

              <button
                onClick={() => {
                  setTermoBusca("");
                  buscarClinicas();
                }}
                className="w-1/2 bg-white border border-slate-200 text-sm py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Limpar Busca
              </button>
            </div>
          </div>

          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1 mt-6">
            Minhas Clínicas ({clinicas.length})
          </h2>

          {clinicas.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
              <p className="text-slate-400 text-sm">
                Nenhuma clínica encontrada.
              </p>
            </div>
          ) : (
            clinicas.map((item) => (
              <div
                key={item.codigo}
                onClick={() => navigate(`/clinica/${item.codigo}`)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2 cursor-pointer hover:border-emerald-500 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 text-xl">
                    <FaHospital />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700">{item.nome}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Código: {item.codigo}
                    </p>
                    <div className="text-xs text-slate-500 mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5">
                      <span>Profissionais: {item.maxProfissionais}</span>
                      <span>Pacientes: {item.maxPacientes}</span>
                      <span>Protocolos: {item.maxProtocolos}</span>
                      <span>Exercícios: {item.maxExercicios}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleVincularClinica(e, item.codigo)}
                    className="p-3 text-slate-300 hover:text-blue-600 rounded-xl transition-all"
                    title="Vincular à clínica"
                  >
                    <FaLink />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/clinica/formulario/${item.codigo}`);
                    }}
                    className="p-3 text-slate-300 hover:text-emerald-600 rounded-xl transition-all"
                  >
                    <FaPen />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletarClinica(item.id);
                    }}
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

      <BottomBar tipo="profissional" ativo="clínica" />
    </div>
  );
}
