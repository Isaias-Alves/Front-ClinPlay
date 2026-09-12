import api from "./http";
import { ProtocoloRequestApi, ProtocoloResponseApi } from "@interfaces";

/**
 * Erros não são tratados aqui de propósito: os blocos `try { ... } catch (e) { throw e }`
 * anteriores só adicionavam ruído. Renovação de token é feita pelo interceptor
 * em `http.ts` e a mensagem para o usuário é montada na camada de UI.
 */
/**
 * Protocolos.
 *
 * ATENÇÃO: NÃO EXISTE módulo de protocolos no backend. Uma busca por
 * "protocolo" em todo o `ClinPlaY_API` não retorna nada — não há
 * controller, entidade nem tabela. Todas as chamadas abaixo respondem 404.
 *
 * As telas que dependem disto (`ProtocolosPage`, `ProtocolosFormPage`,
 * `ProtocoloDetalhesPage` e a aba "missões" de `MeusProtocolosPage`) não
 * funcionam até o recurso ser implementado no servidor. O serviço foi
 * mantido, e não removido, para que a decisão de cortar ou implementar a
 * funcionalidade seja de quem toca o produto.
 */
export const protocolosServices = {
  /** GET /protocolo/{id} */
  buscarPorId: async (id: string): Promise<ProtocoloResponseApi> => {
    const { data } = await api.get(`/protocolo/${id}`);
    return data;
  },

  /** GET /protocolo/clin/{clinPlanId} */
  listar: async (clinPlanId: string): Promise<ProtocoloResponseApi[]> => {
    const { data } = await api.get(`/protocolo/clin/${clinPlanId}`);
    return data;
  },

  /** POST /protocolo */
  cadastrar: async (
    dadosProtocolo: ProtocoloRequestApi,
  ): Promise<ProtocoloResponseApi> => {
    const { data } = await api.post("/protocolo", dadosProtocolo);
    return data;
  },

  /** PUT /protocolo/{id} */
  atualizar: async (
    id: string,
    dadosProtocolo: ProtocoloRequestApi,
  ): Promise<ProtocoloResponseApi> => {
    const { data } = await api.put(`/protocolo/${id}`, dadosProtocolo);
    return data;
  },

  /** DELETE /protocolo/{id} */
  deletar: async (id: string): Promise<void> => {
    await api.delete(`/protocolo/${id}`);
  },
};

export default protocolosServices;
