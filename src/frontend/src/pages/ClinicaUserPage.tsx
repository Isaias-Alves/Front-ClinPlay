import { useState, useEffect } from "react";
import { FaHospital, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { BottomBar } from "../components/BottomBar";
import { clinicasServices } from "@services";

interface Clinica {
  codigo: string;
  nome: string;
  maxProfissionais: number;
  maxPacientes: number;
  maxProtocolos: number;
  maxExercicios: number;
}

export function ClinicaUserPage() {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const buscarClinicas = async () => {
    setCarregando(true);
    try {
      const response = await clinicasServices.buscarClinicasDoPaciente();
      setClinicas(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error("Erro ao buscar clínicas", error);
      setClinicas([]);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarClinicas();
  }, []);

  const handleBuscarClinicaEspecifica = async () => {
    if (!termoBusca.trim()) {
      alert("Digite um código para pesquisar.");
      return;
    }

    setCarregando(true);
    try {
      const response = await clinicasServices.buscarClinicaPaciente(termoBusca);
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

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white px-6 py-8 shadow-sm border-b border-slate-200">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaHospital className="text-emerald-500" /> Consultar Clínicas
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Pesquise as clínicas onde você realiza seus atendimentos.
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-8">
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
                onClick={() => navigate(`/clinicaUser/${item.codigo}`)}
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
                  </div>
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

export default ClinicaUserPage;
