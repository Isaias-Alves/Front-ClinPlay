import api from "./http";
import { ProtocoloRequestApi, ProtocoloResponseApi } from "@interfaces";

/**
 * Erros não são tratados aqui de propósito: os blocos `try { ... } catch (e) { throw e }`
 * anteriores só adicionavam ruído. Renovação de token é feita pelo interceptor
 * em `http.ts` e a mensagem para o usuário é montada na camada de UI.
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
