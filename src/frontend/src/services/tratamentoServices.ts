import api from "./http";
import {
  CadastroTratamentoRequestApi,
  TratamentoResponseApi,
} from "@interfaces";

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

  /** GET /tratamento/{id} */
  buscarPorId: async (id: string): Promise<TratamentoResponseApi> => {
    const { data } = await api.get(`/tratamento/${id}`);
    return data;
  },

  /** GET /tratamento/meus — tratamentos do paciente logado. */
  listarMeus: async (): Promise<TratamentoResponseApi[]> => {
    const { data } = await api.get("/tratamento/meus");
    return data;
  },

  /** GET /tratamento/clinica/{clinicaId} — tratamentos conduzidos na clínica. */
  listarPorClinica: async (
    clinicaId: string,
  ): Promise<TratamentoResponseApi[]> => {
    const { data } = await api.get(`/tratamento/clinica/${clinicaId}`);
    return data;
  },

  /** DELETE /tratamento/{id} */
  deletar: async (id: string): Promise<void> => {
    await api.delete(`/tratamento/${id}`);
  },

  /** PUT /tratamento/{id}/protocolo — associa um protocolo ao tratamento. */
  definirProtocolo: async (id: string, protocoloId: string) => {
    const { data } = await api.put(`/tratamento/${id}/protocolo`, {
      protocoloId,
    });
    return data;
  },
};

export default tratamentoServices;
