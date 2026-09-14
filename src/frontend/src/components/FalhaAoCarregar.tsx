import { FiAlertCircle, FiRefreshCw } from "react-icons/fi";

interface FalhaAoCarregarProps {
  /** O que não veio. Ex.: "os protocolos", "as suas clínicas". */
  oQue: string;
  onTentarNovamente?: () => void;
}

/**
 * Estado de falha de carregamento.
 *
 * Várias telas tratavam erro de rede com `setLista([])` e caíam no estado
 * vazio — que diz "Nenhum protocolo cadastrado" ou "Nenhum tratamento nesta
 * clínica". Num app de saúde isso é pior do que não dizer nada: a tela
 * afirma que não existe dado clínico quando na verdade a requisição falhou.
 *
 * O cenário não é raro aqui. O backend roda no plano gratuito do Render, que
 * hiberna após 15 minutos ociosos e leva minutos para acordar — quem abrir o
 * app nesse intervalo veria a lista "vazia".
 */
export const FalhaAoCarregar = ({
  oQue,
  onTentarNovamente,
}: FalhaAoCarregarProps) => (
  <div
    role="alert"
    className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/60 p-10 text-center"
  >
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
      <FiAlertCircle className="text-3xl text-amber-500" />
    </div>
    <div>
      <p className="text-base font-semibold text-slate-700">
        Não foi possível carregar {oQue}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Verifique a sua conexão. Se o problema persistir, o servidor pode estar
        reiniciando — tente de novo em alguns instantes.
      </p>
    </div>
    {onTentarNovamente && (
      <button
        type="button"
        onClick={onTentarNovamente}
        className="mt-1 flex min-h-12 items-center gap-2 rounded-xl bg-slate-800 px-6 text-sm font-bold text-white transition-transform active:scale-95"
      >
        <FiRefreshCw /> Tentar novamente
      </button>
    )}
  </div>
);

export default FalhaAoCarregar;
