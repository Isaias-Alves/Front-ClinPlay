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
import { ClinicaVinculo } from "@interfaces";
import { tratarErroClinica } from "@utils";
import { useApp } from "@contexts";

/** Lista as clínicas do profissional, normalizando a resposta para um array. */
const buscarMinhasClinicas = async (): Promise<ClinicaVinculo[]> => {
  const response = await clinicasServices.buscarMinhasClinicas();
  return Array.isArray(response) ? response : [];
};

export function ClinicaPage() {
  const { confirmar, notificar } = useApp();
  const [clinicas, setClinicas] = useState<ClinicaVinculo[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  // Já nasce carregando: a tela busca as clínicas na montagem. Assim o efeito
  // não precisa ligar a flag de forma síncrona, o que forçaria uma
  // renderização extra antes da primeira pintura.
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // `cancelado` descarta a resposta se a tela sair antes de ela chegar.
    let cancelado = false;

    buscarMinhasClinicas()
      .then((lista) => {
        if (!cancelado) setClinicas(lista);
      })
      .catch((error) => {
        if (cancelado) return;
        console.error("Erro ao buscar clínicas do profissional", error);
        setClinicas([]);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  /** Recarrega a lista a pedido do usuário (após excluir, por exemplo). */
  const recarregarClinicas = async () => {
    setCarregando(true);
    try {
      setClinicas(await buscarMinhasClinicas());
    } catch (error) {
      console.error("Erro ao buscar clínicas do profissional", error);
      setClinicas([]);
    } finally {
      setCarregando(false);
    }
  };

  const deletarClinica = async (id: string) => {
    if (
      !(await confirmar({
        mensagem: "Deseja realmente remover esta clínica?",
        rotuloConfirmar: "Remover",
        destrutivo: true,
      }))
    )
      return;
    try {
      await clinicasServices.deletarClinica(id);
      await recarregarClinicas();
    } catch (error) {
      console.error("Erro ao deletar clínica", error);
      notificar(tratarErroClinica(error), "erro");
    }
  };

  const handleBuscarClinicaEspecifica = async () => {
    if (!termoBusca.trim()) {
      notificar("Digite um código para pesquisar.", "erro");
      return;
    }

    setCarregando(true);
    try {
      const response = await clinicasServices.buscarPorTag(termoBusca);
      const clinicaEncontrada = response.data || response;

      if (clinicaEncontrada) {
        setClinicas([clinicaEncontrada]);
      } else {
        notificar("Clínica não encontrada.", "erro");
        setClinicas([]);
      }
    } catch (error) {
      console.error("Erro ao buscar clínica específica", error);
      notificar("Nenhuma clínica localizada com este código.", "erro");
    } finally {
      setCarregando(false);
    }
  };

  const handleVincularClinica = async (e: React.MouseEvent, codigo: string) => {
    e.stopPropagation();
    try {
      // O backend identifica o solicitante pelo token; não há ID para enviar.
      // A leitura anterior de localStorage("usuario") nunca resolvia, pois essa
      // chave nunca é gravada — o vínculo falhava sempre.
      await clinicasServices.solicitarVinculoProfissional(codigo);
      notificar(
        `Vinculação à clínica ${codigo} realizada com sucesso!`,
        "sucesso",
      );
    } catch (error) {
      console.error("Erro ao se vincular à clínica", error);
      notificar(tratarErroClinica(error), "erro");
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
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
          onClick={() => navigate("/planos")}
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
                  void recarregarClinicas();
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
                key={item.clinicaId}
                onClick={() => navigate(`/clinicas/${item.clinicaId}`)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2 cursor-pointer hover:border-emerald-500 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 text-xl">
                    <FaHospital />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700">{item.nome}</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Código: {item.tag ?? "—"}
                    </p>
                    {/*
                      `GET /clinica/minhas` devolve o plano contratado, não os
                      limites: `maxProfissionais` e afins pertencem ao `Plano`
                      (`GET /plano`) e chegavam sempre `undefined` aqui.
                    */}
                    {item.planoNome && (
                      <p className="text-xs text-slate-500 mt-1">
                        Plano: {item.planoNome}
                        {item.planoStatus ? ` (${item.planoStatus})` : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) =>
                      item.tag && handleVincularClinica(e, item.tag)
                    }
                    className="p-3 text-slate-300 hover:text-blue-600 rounded-xl transition-all"
                    title="Vincular à clínica"
                  >
                    <FaLink />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/clinicas/${item.clinicaId}`);
                    }}
                    className="p-3 text-slate-300 hover:text-emerald-600 rounded-xl transition-all"
                  >
                    <FaPen />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletarClinica(item.clinicaId);
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

      <BottomBar />
    </div>
  );
}

export default ClinicaPage;
