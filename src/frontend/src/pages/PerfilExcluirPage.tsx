import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaTrashAlt,
  FaTimes,
  FaExclamationTriangle,
} from "react-icons/fa";
import { BottomBar } from "../components/BottomBar";
import { profissionalServices } from "@services";
import { pacienteServices } from "@services";

export function PerfilExcluirPage() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const tipo: string = localStorage.getItem("tipoUsuario");

  const handleExcluir = async () => {
    setCarregando(true);
    try {
      if (tipo === "profissional") {
        await profissionalServices.deletar();
      } else if (tipo === "paciente") {
        await pacienteServices.deletar();
      }
      alert("Conta excluída com sucesso!");
      localStorage.clear();
      navigate("/");
    } catch (error: any) {
      alert(
        "Erro ao excluir conta: " + (error.response?.data || error.message),
      );
    } finally {
      setCarregando(false);
      setModalAberto(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-28">
      <header className="bg-white px-6 py-8 shadow-sm border-b border-slate-200">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Excluir Conta</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6">
        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            <FaTrashAlt />
          </div>

          <div>
            <h2 className="font-bold text-slate-800 text-lg">
              Você tem certeza?
            </h2>
            <p className="text-xs text-slate-500 mt-2 px-2 leading-relaxed">
              Tem certeza mesmo que deseja excluir sua conta? Essa ação é
              irreversível! Todos os seus dados, clínicas e vínculos serão
              removidos do sistema.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={() => setModalAberto(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-95"
            >
              Excluir minha conta
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-slate-100 border border-slate-200 text-slate-600 font-medium py-4 rounded-xl transition-colors"
            >
              <FaTimes className="inline mr-2" /> Cancelar
            </button>
          </div>
        </div>
      </main>

      {/* Modal de Confirmação Final */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-xl border border-slate-200 text-center space-y-6">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl">
              <FaExclamationTriangle />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Confirmação de Exclusão
              </h3>
              <p className="text-xs text-slate-500 mt-2 px-2 leading-relaxed">
                Essa ação é definitiva e apagará todos os seus dados. Tem
                certeza absoluta de que deseja prosseguir?
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={handleExcluir}
                disabled={carregando}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                {carregando ? "Excluindo..." : "Sim, excluir permanentemente"}
              </button>
              <button
                onClick={() => setModalAberto(false)}
                className="w-full bg-slate-100 text-slate-600 py-3.5 rounded-xl font-medium transition-colors"
              >
                Não, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomBar tipo="profissional" ativo="configuracoes" />
    </div>
  );
}

export default PerfilExcluirPage;
