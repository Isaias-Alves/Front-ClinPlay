import api from "./http";
import { authServices } from "./authServices";
import {
  AtualizarPacienteRequest,
  AtualizarProfissionalRequest,
} from "@interfaces";

/**
 * Operações de conta do profissional logado.
 *
 * A renovação de token em caso de 401 é feita pelo interceptor de `http.ts`,
 * não mais por blocos try/catch replicados em cada método.
 */
export const profissionalServices = {
  atualizar: (dados: AtualizarProfissionalRequest) =>
    authServices.atualizarProfissional(dados),

  deletar: async () => {
    const { data } = await api.delete("/profissional");
    return data;
  },
};

/** Operações de conta do paciente logado. */
export const pacienteServices = {
  atualizar: (dados: AtualizarPacienteRequest) =>
    authServices.atualizarPaciente(dados),

  deletar: async () => {
    const { data } = await api.delete("/paciente");
    return data;
  },
};
