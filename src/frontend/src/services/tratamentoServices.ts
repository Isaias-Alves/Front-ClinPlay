import api from "./http";
import {
  CadastroTratamentoRequestApi,
  TratamentoResponseApi,
} from "@interfaces";

/**
 * Tratamentos.
 *
 * ATENÇÃO: o `TratamentoController` do backend expõe apenas
 * `POST /tratamento/{clinicaId}` e `PUT /tratamento/{id}/finalizar`. Toda a
 * leitura e edição acontece pelo WebSocket, em `/app/tratamento/{id}`
 * (ver `useTratamentoSocket` e o enum `TipoMensagem`):
 *
 * - obter um tratamento        → mensagem `OBTER`
 * - editar descrição/fim       → `EDITAR_TRATAMENTO`
 * - prescrições                → `ADICIONAR_PRESCRICAO`, `EDITAR_PRESCRICAO`,
 *                                `REMOVER_PRESCRICAO`, `REORDENAR_PRESCRICOES`
 * - feedback                   → `CRIAR_FEEDBACK`, `MARCAR_FEEDBACK_VISTO`
 *
 * A lista de tratamentos de um usuário vem aninhada em
 * `GET /clinica/minhas` (campo `tratamentos`), não de uma rota própria.
 *
 * Os métodos abaixo marcados como INEXISTENTE chamam rotas que o backend
 * não implementa e respondem 404. Ficaram documentados em vez de removidos
 * porque as telas que os usam continuam no app — ver `MeusProtocolosPage`.
 */
export const tratamentoServices = {
  /** POST /tratamento/{clinicaId} — cria um tratamento para um paciente da clínica. */
  criar: async (
    clinicaId: string,
    dados: CadastroTratamentoRequestApi,
  ): Promise<TratamentoResponseApi> => {
    const { data } = await api.post(`/tratamento/${clinicaId}`, dados);
    return data;
  },

  /** PUT /tratamento/{id}/finalizar */
  finalizar: async (id: string) => {
    const { data } = await api.put(`/tratamento/${id}/finalizar`);
    return data;
  },

  /** INEXISTENTE no backend (404). Use a mensagem `OBTER` do WebSocket. */
  buscarPorId: async (id: string): Promise<TratamentoResponseApi> => {
    const { data } = await api.get(`/tratamento/${id}`);
    return data;
  },

  /** INEXISTENTE no backend (404). Os tratamentos vêm de `GET /clinica/minhas`. */
  listarMeus: async (): Promise<TratamentoResponseApi[]> => {
    const { data } = await api.get("/tratamento/meus");
    return data;
  },

  /** INEXISTENTE no backend (404). Idem: vêm de `GET /clinica/minhas`. */
  listarPorClinica: async (
    clinicaId: string,
  ): Promise<TratamentoResponseApi[]> => {
    const { data } = await api.get(`/tratamento/clinica/${clinicaId}`);
    return data;
  },

  /** INEXISTENTE no backend (404). Só existe `PUT /tratamento/{id}/finalizar`. */
  deletar: async (id: string): Promise<void> => {
    await api.delete(`/tratamento/${id}`);
  },

  /** INEXISTENTE no backend (404): não há módulo de protocolos. */
  definirProtocolo: async (id: string, protocoloId: string) => {
    const { data } = await api.put(`/tratamento/${id}/protocolo`, {
      protocoloId,
    });
    return data;
  },
};

export default tratamentoServices;
