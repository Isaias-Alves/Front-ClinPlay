import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaHospital, FaArrowLeft, FaUserCheck, FaLink } from "react-icons/fa";
import { BottomBar } from "../components/BottomBar";
import { clinicasServices } from "@services";

export function ClinicaUserDetalhesPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();
  const [clinicaNome, setClinicaNome] = useState("Consultando Clínica...");
  const [clinicaData, setClinicaData] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [estaVinculado, setEstaVinculado] = useState(false);

  const carregarDados = async () => {
    if (!codigo) return;

    try {
      const data = await clinicasServices.buscarClinicaPaciente(codigo);
      setClinicaData(data);
      setClinicaNome(data.nome || "Clínica sem nome");

      try {
        const minhasClinicas = await clinicasServices.buscarMeus();

        const vinculado = minhasClinicas.some((c: any) => c.codigo === codigo);

        console.log("[DEBUG] Código da URL:", codigo);
        console.log("[DEBUG] Clínicas retornadas:", minhasClinicas);
        console.log("[DEBUG] Está vinculado:", vinculado);

        setEstaVinculado(vinculado);
      } catch (e) {
        console.error("[DEBUG] Erro ao buscar clínicas:", e);
        setEstaVinculado(false);
      }
    } catch (error) {
      console.error("Erro ao carregar dados da clínica:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [codigo]);

  const handleSolicitarVinculo = async () => {
    try {
      const usuarioLocal = localStorage.getItem("usuario");
      const usuarioId = usuarioLocal ? JSON.parse(usuarioLocal).id : null;

      if (!usuarioId || !codigo) {
        alert("Erro ao identificar o usuário ou clínica.");
        return;
      }

      await clinicasServices.solicitarVinculoPaciente(codigo, usuarioId);
      alert("Solicitação de vínculo enviada com sucesso!");
      carregarDados();
    } catch (error) {
      console.error("Erro ao solicitar vínculo", error);
      alert("Não foi possível solicitar o vínculo.");
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
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FaHospital className="text-emerald-500" /> {clinicaNome}
            </h1>
            <p className="text-slate-400 text-xs font-mono">Código: {codigo}</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-6">
        {carregando ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Carregando informações...
          </div>
        ) : (
          <>
            {estaVinculado && (
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-between text-emerald-800 shadow-sm animate-in fade-in duration-300">
                <div>
                  <h3 className="font-semibold text-emerald-900">
                    Vínculo Ativo
                  </h3>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Você já possui ou terá em breve acesso a esta unidade.
                  </p>
                </div>
                <span className="text-xs font-medium bg-white px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-2">
                  <FaUserCheck /> Vinculado
                </span>
              </div>
            )}

            <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Informações da Clínica
              </h2>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Nome da Clínica
                </p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">
                  {clinicaData?.nome || clinicaNome}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  Código
                </p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">
                  {clinicaData?.codigo || "Não disponível"}
                </p>
              </div>

              {!estaVinculado && (
                <div className="pt-4 border-t border-slate-100 mt-6">
                  <button
                    onClick={handleSolicitarVinculo}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold py-3 rounded-xl transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2"
                  >
                    <FaLink /> Solicitar Vínculo
                  </button>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <BottomBar tipo="profissional" ativo="clínica" />
    </div>
  );
}

export default ClinicaUserDetalhesPage;
