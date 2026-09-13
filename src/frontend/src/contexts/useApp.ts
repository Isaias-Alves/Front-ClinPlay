import { createContext, useContext } from "react";
import type { PedidoConfirmacao } from "@components/ConfirmacaoModal";
import type {
  ClinicaVinculo,
  PacienteInfoResponse,
  ProfissionalInfoResponse,
} from "@interfaces";

/** Plano comercial, como devolvido por `GET /plano`. */
export interface PlanoResponse {
  id: string;
  nome: string;
  maxProfissionais: number;
  maxPacientes: number;
  maxExercicios: number;
  disponivel: boolean;
}

export type TipoUsuario = "paciente" | "profissional";

/**
 * Usuário logado. É a união dos dois perfis porque `carregarDadosGlobais`
 * descobre qual deles é por tentativa e erro — `tipoUsuario` diz qual.
 */
export type UsuarioLogado = PacienteInfoResponse | ProfissionalInfoResponse;

export interface AppContextData {
  usuario: UsuarioLogado | null;
  tipoUsuario: TipoUsuario | null;
  clinicas: ClinicaVinculo[];
  clinicaSelecionadaId: string;
  setClinicaSelecionadaId: (id: string) => void;
  planos: PlanoResponse[];
  isLoadingGlobal: boolean;
  refreshData: () => Promise<void>;
  notificar: (mensagem: string, tipo: "sucesso" | "erro") => void;
  /**
   * Pede confirmação ao usuário. Substitui o `window.confirm`, que trava a
   * thread principal e aparece com a interface do navegador.
   * @returns `true` se confirmou, `false` se cancelou ou fechou.
   */
  confirmar: (pedido: PedidoConfirmacao | string) => Promise<boolean>;
  logout: () => Promise<void>;
}

/**
 * O contexto e o hook vivem fora de `AppContext.tsx` por dois motivos:
 * o Fast Refresh do Vite só funciona em arquivos que exportam apenas
 * componentes, e assim qualquer módulo pode consumir `useApp` sem arrastar
 * o provider (e as telas que ele importa) para o seu grafo de dependências.
 */
export const AppContext = createContext<AppContextData>({} as AppContextData);

export const useApp = () => useContext(AppContext);
