import api from "./api";
import { ProtocoloRequestApi, ProtocoloResponseApi } from "@interfaces";

export const protocolosServices = {
  /**
   * Busca um protocolo específico pelo seu ID.
   * Corresponde ao endpoint: GET /protocolo/{id}
   * * @param {string} id - O identificador único (UUID) do protocolo.
   * @returns {Promise<ProtocoloResponseApi>} Os dados detalhados do protocolo retornado pela API.
   * @throws {Error} Lança um erro caso a requisição falhe (ex: 404 Not Found, 500 Internal Server Error).
   */
  buscarPorId: async (id: string): Promise<ProtocoloResponseApi> => {
    try {
      const response = await api.get(`/protocolo/${id}`);
      return response.data;
    } catch (error) {
      // TODO: Caso necessário, adicione a lógica de renovação de token como em exercicios.ts
      throw error;
    }
  },

  /**
   * Lista todos os protocolos associados a um plano de clínica (clinPlanId).
   * Corresponde ao endpoint: GET /protocolo/clin/{clinPlanId}
   * * @param {string} clinPlanId - O identificador único (UUID) do plano da clínica.
   * @returns {Promise<ProtocoloResponseApi[]>} Uma lista de protocolos.
   * @throws {Error} Lança um erro em caso de falha de permissão (403) ou erro interno.
   */
  listar: async (clinPlanId: string): Promise<ProtocoloResponseApi[]> => {
    try {
      const response = await api.get(`/protocolo/clin/${clinPlanId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cadastra um novo protocolo no sistema.
   * Corresponde ao endpoint: POST /protocolo
   * * @param {ProtocoloRequestApi} dadosProtocolo - O payload contendo o 'nome', 'clinPlanId' e 'exercicioIds'.
   * @returns {Promise<ProtocoloResponseApi>} O protocolo recém-criado.
   * @throws {Error} Lança um erro caso o cadastro falhe.
   */
  cadastrar: async (
    dadosProtocolo: ProtocoloRequestApi,
  ): Promise<ProtocoloResponseApi> => {
    try {
      const response = await api.post("/protocolo", dadosProtocolo);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Atualiza os dados de um protocolo existente.
   * Corresponde ao endpoint: PUT /protocolo/{id}
   * * @param {string} id - O identificador único (UUID) do protocolo a ser atualizado.
   * @param {ProtocoloRequestApi} dadosProtocolo - O payload contendo os dados modificados do protocolo.
   * @returns {Promise<ProtocoloResponseApi>} O protocolo atualizado com sucesso.
   * @throws {Error} Lança um erro em caso de falha na atualização (ex: 403 Forbidden, 404 Not Found).
   */
  atualizar: async (
    id: string,
    dadosProtocolo: ProtocoloRequestApi,
  ): Promise<ProtocoloResponseApi> => {
    try {
      const response = await api.put(`/protocolo/${id}`, dadosProtocolo);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Deleta um protocolo específico pelo seu ID.
   * Corresponde ao endpoint: DELETE /protocolo/{id}
   * * @param {string} id - O identificador único (UUID) do protocolo a ser deletado.
   * @returns {Promise<void>} Não retorna conteúdo (204 No Content) em caso de sucesso.
   * @throws {Error} Lança um erro caso a exclusão falhe.
   */
  deletar: async (id: string): Promise<void> => {
    try {
      await api.delete(`/protocolo/${id}`);
    } catch (error) {
      throw error;
    }
  },
};

export default protocolosServices;
