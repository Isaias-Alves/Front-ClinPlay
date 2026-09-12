import type { ExercicioInfoResponse } from "@interfaces";
import api from "./http";

/**
 * Exercícios.
 *
 * O `ExercicioController` do backend só expõe `GET /exercicio/{id}` e
 * `PUT /exercicio/{id}`. Listagem e criação passam por outros módulos:
 *
 * - listar  → `GET /clinica/{clinicaId}/exercicios` (`clinicasServices`)
 * - criar   → `POST /solicitacao/exercicio/{clinicaId}`, que cria uma
 *             solicitação a ser aprovada por quem tem `adminExercicios`
 * - excluir → `DELETE /clinica/{clinicaId}/exercicio/{exercicioId}`, ou
 *             seja, desvincula o exercício da clínica
 */
export const exerciciosServices = {
  /** GET /exercicio/{id} */
  buscarPorId: async (id: string): Promise<ExercicioInfoResponse> => {
    const { data } = await api.get(`/exercicio/${id}`);
    return data;
  },

  /**
   * Exercícios disponíveis numa clínica.
   *
   * Antes chamava `GET /exercicio`, rota que não existe — a listagem sempre
   * falhava. O recurso é da clínica, então exige o id dela.
   */
  listarDaClinica: async (
    clinicaId: string,
  ): Promise<ExercicioInfoResponse[]> => {
    const { data } = await api.get(`/clinica/${clinicaId}/exercicios`);
    return Array.isArray(data) ? data : [];
  },

  /** PUT /exercicio/{id} */
  atualizar: async (id: string, dados: Record<string, unknown>) => {
    const { data } = await api.put(`/exercicio/${id}`, dados);
    return data;
  },

  /**
   * Desvincula o exercício da clínica.
   *
   * Não existe `DELETE /exercicio/{id}` no backend: a exclusão é sempre
   * relativa ao vínculo com a clínica.
   */
  desvincularDaClinica: async (clinicaId: string, exercicioId: string) => {
    const { data } = await api.delete(
      `/clinica/${clinicaId}/exercicio/${exercicioId}`,
    );
    return data;
  },
};

export default exerciciosServices;
