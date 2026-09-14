import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FalhaAoCarregar } from "./FalhaAoCarregar";
import {
  FiSearch,
  FiX,
  FiUserPlus,
  FiFilter,
  FiCheck,
  FiArrowLeft,
  FiChevronDown,
} from "react-icons/fi";
import { RiHospitalLine } from "react-icons/ri";
import { clinicasServices } from "@services";
import { useApp } from "@contexts";
import { ESPECIALIDADES, mensagemDeErro } from "@utils";

interface BuscarClinicaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Clínica como aparece na busca pública (`GET /clinica`). É um recorte
 * menor que `ClinicaVinculo`: aqui o usuário ainda não tem vínculo.
 */
export interface ClinicaBusca {
  id: string;
  nome: string;
  codigo?: string;
  tag?: string;
  especialidade?: string;
  uf?: string;
  cidade?: string;
}

/** Uma página de resultados da busca de clínicas. */
interface PaginaClinicas {
  itens: ClinicaBusca[];
  temMais: boolean;
}

/**
 * Busca clínicas por nome/especialidade ou, quando o termo começa com "@",
 * pelo código exato da clínica (nesse caso não há paginação).
 */
const buscarPagina = async (
  busca: string,
  especialidade: string | null,
  pagina: number,
): Promise<PaginaClinicas> => {
  const termo = busca.trim();

  if (termo.startsWith("@")) {
    const response = await clinicasServices.buscarPorTag(termo);
    const itens = response.content
      ? response.content
      : Array.isArray(response)
        ? response
        : [response];
    return { itens, temMais: false };
  }

  const response = await clinicasServices.listar({
    nome: termo || undefined,
    especialidade: especialidade || undefined,
    page: pagina,
    size: 10,
  });

  const dados = Array.isArray(response)
    ? response
    : response?.content || response?.data || [];
  const itens = Array.isArray(dados) ? dados : [];

  return { itens, temMais: itens.length >= 10 };
};

/** Acrescenta só os itens ainda ausentes, preservando a ordem. */
const mesclarSemRepetir = (
  atuais: ClinicaBusca[],
  novos: ClinicaBusca[],
): ClinicaBusca[] => {
  const existentes = new Set(atuais.map((c) => c.id));
  return [...atuais, ...novos.filter((c) => !existentes.has(c.id))];
};

export function BuscarClinicaModal({
  isOpen,
  onClose,
}: BuscarClinicaModalProps) {
  const { tipoUsuario, notificar } = useApp();

  const [busca, setBusca] = useState("");
  const [clinicas, setClinicas] = useState<ClinicaBusca[]>([]);
  const [pagina, setPagina] = useState(0);
  const [temMais, setTemMais] = useState(false);
  /** Busca que falhou não é busca sem resultado. */
  const [falhou, setFalhou] = useState(false);
  /**
   * Contador de novas tentativas. Só zerar `pagina` não refaz a busca quando
   * ela já está em 0 — que é exatamente o caso depois de uma falha.
   */
  const [tentativa, setTentativa] = useState(0);

  /**
   * Consulta cujo resultado já está em `clinicas`. "Carregando" vira valor
   * derivado disso: não existe mais um `setCarregando(true)` síncrono dentro
   * do efeito, e o spinner aparece já durante o debounce da digitação.
   */
  const [carregadoDe, setCarregadoDe] = useState<string | null>(null);

  const [filtroEspecialidade, setFiltroEspecialidade] = useState<string | null>(
    null,
  );

  // Guarda o objeto da clínica selecionada para exibir na tela de confirmação (Slider)
  const [clinicaConfirmacao, setClinicaConfirmacao] =
    useState<ClinicaBusca | null>(null);

  const criterio = `${busca}|${filtroEspecialidade ?? ""}`;
  const chaveBusca = `${criterio}|${pagina}`;
  const carregando = isOpen && carregadoDe !== chaveBusca;

  // Limpa tudo ao fechar o modal. Ajustado durante a renderização, e não num
  // efeito: por efeito, a busca anterior reaparecia por um quadro ao reabrir.
  const [estavaAberto, setEstavaAberto] = useState(isOpen);
  if (estavaAberto !== isOpen) {
    setEstavaAberto(isOpen);
    if (!isOpen) {
      setBusca("");
      setClinicas([]);
      setFiltroEspecialidade(null);
      setClinicaConfirmacao(null);
      setPagina(0);
      setTemMais(false);
      setCarregadoDe(null);
    }
  }

  // Trocar o termo ou o filtro volta para a primeira página — senão a nova
  // busca começaria na página em que a anterior tinha parado.
  const [criterioAnterior, setCriterioAnterior] = useState(criterio);
  if (criterioAnterior !== criterio) {
    setCriterioAnterior(criterio);
    setPagina(0);
  }

  useEffect(() => {
    if (!isOpen) return;

    // `cancelado` descarta respostas fora de ordem: sem isso, uma busca
    // lenta antiga sobrescrevia o resultado da busca mais recente.
    let cancelado = false;

    // Debounce só na primeira página (digitação). "Carregar mais" é um
    // toque explícito e dispara de imediato.
    const atraso = pagina === 0 ? 600 : 0;

    const temporizador = setTimeout(async () => {
      try {
        const { itens, temMais: ha } = await buscarPagina(
          busca,
          filtroEspecialidade,
          pagina,
        );
        if (cancelado) return;
        setClinicas((prev) =>
          pagina === 0 ? itens : mesclarSemRepetir(prev, itens),
        );
        setTemMais(ha);
        setFalhou(false);
      } catch {
        if (cancelado) return;
        if (pagina === 0) setClinicas([]);
        setTemMais(false);
        setFalhou(true);
      } finally {
        if (!cancelado) setCarregadoDe(chaveBusca);
      }
    }, atraso);

    return () => {
      cancelado = true;
      clearTimeout(temporizador);
    };
    // `chaveBusca` deriva exatamente destas entradas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, busca, filtroEspecialidade, pagina, tentativa]);

  const handleCarregarMais = () => {
    setPagina((prev) => prev + 1);
  };

  const solicitarVinculo = async () => {
    if (!tipoUsuario) {
      notificar("Faça login para solicitar vínculo.", "erro");
      return;
    }
    if (!clinicaConfirmacao) return;

    // A solicitação é feita pelo código da clínica; `tag` e `codigo` são o
    // mesmo dado com nomes diferentes conforme o endpoint que a devolveu.
    const codigo = clinicaConfirmacao.tag ?? clinicaConfirmacao.codigo;
    if (!codigo) {
      notificar("Clínica sem código de vínculo.", "erro");
      return;
    }

    try {
      if (tipoUsuario === "paciente") {
        await clinicasServices.solicitarVinculoPaciente(codigo);
      } else {
        await clinicasServices.solicitarVinculoProfissional(codigo);
      }
      notificar("Solicitação enviada com sucesso!", "sucesso");
      setClinicaConfirmacao(null);
      onClose();
    } catch (error) {
      notificar(mensagemDeErro(error, "Erro ao solicitar vínculo."), "erro");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[80vh] min-h-[400px]"
          >
            <AnimatePresence mode="wait">
              {!clinicaConfirmacao ? (
                // ==========================================
                // VISÃO 1: BUSCA E LISTAGEM
                // ==========================================
                <motion.div
                  key="lista"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full"
                >
                  <div className="p-6 border-b border-slate-100 flex items-center gap-4 shrink-0">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                      <FiSearch className="text-xl" />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Busque por @tag ou nome..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full text-base sm:text-lg font-bold text-slate-700 outline-none placeholder:text-slate-300"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={onClose}
                      className="p-3 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      <FiX className="text-xl" />
                    </button>
                  </div>

                  <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 shrink-0 flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                      <FiFilter /> Filtro
                    </div>

                    <div className="relative flex-1">
                      <select
                        value={filtroEspecialidade ?? ""}
                        onChange={(e) =>
                          setFiltroEspecialidade(e.target.value || null)
                        }
                        className={`w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-bold border transition-all outline-none cursor-pointer bg-white text-slate-600 ${
                          filtroEspecialidade
                            ? "border-emerald-400"
                            : "border-slate-200 hover:border-emerald-300"
                        }`}
                      >
                        <option value="">Todas as especialidades</option>
                        {ESPECIALIDADES.map((esp) => (
                          <option key={esp} value={esp}>
                            {esp}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs pointer-events-none text-slate-400" />
                    </div>

                    <AnimatePresence>
                      {filtroEspecialidade && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => setFiltroEspecialidade(null)}
                          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:border-red-300 hover:text-red-500 transition-all"
                        >
                          <FiX className="text-xs" /> Limpar
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 bg-white">
                    <div className="space-y-3">
                      {carregando && clinicas.length === 0 ? (
                        <div className="py-12 flex justify-center">
                          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : falhou && clinicas.length === 0 ? (
                        <FalhaAoCarregar
                          oQue="a lista de clínicas"
                          onTentarNovamente={() => {
                            setCarregadoDe(null);
                            setFalhou(false);
                            setTentativa((n) => n + 1);
                          }}
                        />
                      ) : clinicas.length === 0 ? (
                        <div className="text-center py-16 px-4">
                          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
                            <RiHospitalLine />
                          </div>
                          <p className="text-slate-500 font-medium">
                            Nenhuma clínica encontrada.
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Tente buscar por uma @tag específica ou altere os
                            filtros.
                          </p>
                        </div>
                      ) : (
                        clinicas.map((clinica) => (
                          <div
                            key={clinica.id}
                            className="group border border-slate-100 hover:border-emerald-200 bg-white hover:bg-emerald-50/30 p-3 sm:p-4 rounded-2xl flex items-center justify-between transition-all"
                          >
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-2 flex-1">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-slate-400 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 shadow-sm">
                                <RiHospitalLine className="text-xl" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-slate-800 text-sm truncate">
                                    {clinica.nome}
                                  </h3>
                                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                                    {clinica.tag}
                                  </span>
                                </div>
                                <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 mt-0.5 sm:mt-1 truncate">
                                  {clinica.especialidade} • {clinica.cidade} -{" "}
                                  {clinica.uf}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={() => setClinicaConfirmacao(clinica)}
                              className="shrink-0 px-3 py-2 sm:px-4 sm:py-2.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all active:scale-95 flex items-center gap-1.5"
                              title="Solicitar vínculo"
                            >
                              <FiUserPlus className="text-sm sm:text-base" />
                              <span className="hidden sm:inline">VINCULAR</span>
                            </button>
                          </div>
                        ))
                      )}

                      {temMais && !carregando && (
                        <button
                          onClick={handleCarregarMais}
                          className="w-full mt-4 py-3 bg-transparent border border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors active:scale-95"
                        >
                          Carregar mais resultados
                        </button>
                      )}

                      {temMais && carregando && clinicas.length > 0 && (
                        <div className="flex justify-center py-4">
                          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                // ==========================================
                // VISÃO 2: TELA DE CONFIRMAÇÃO CENTRALIZADA
                // ==========================================
                <motion.div
                  key="confirmacao"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col h-full bg-white relative"
                >
                  <button
                    onClick={() => setClinicaConfirmacao(null)}
                    className="absolute top-4 left-4 p-3 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 text-sm font-bold"
                  >
                    <FiArrowLeft /> Voltar
                  </button>
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-3 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <FiX className="text-xl" />
                  </button>

                  <div className="flex flex-col items-center justify-center flex-1 p-8 text-center mt-10">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl mb-6 border-4 border-white shadow-lg shadow-emerald-100">
                      <FiUserPlus />
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mb-2">
                      Confirmar Vínculo
                    </h2>

                    <p className="text-slate-500 font-medium mb-8 max-w-sm">
                      Você está prestes a solicitar um vínculo com a clínica{" "}
                      <span className="text-slate-800 font-bold block mt-1 text-lg">
                        {clinicaConfirmacao.nome}
                      </span>
                    </p>

                    <div className="w-full max-w-sm space-y-3">
                      <button
                        onClick={solicitarVinculo}
                        className="w-full py-4 bg-emerald-500 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-2 text-base"
                      >
                        <FiCheck className="text-lg" /> Enviar Solicitação
                      </button>

                      <button
                        onClick={() => setClinicaConfirmacao(null)}
                        className="w-full py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl border border-slate-200 hover:bg-slate-100 transition-colors active:scale-95 text-base"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BuscarClinicaModal;
