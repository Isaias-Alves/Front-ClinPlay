export interface Clinica {
  codigo: string;
  nome: string;
  maxProfissionais: number;
  maxPacientes: number;
  maxProtocolos: number;
  maxExercicios: number;
}

/**
 * Contagens de uso de uma clínica, devolvidas junto do vínculo do
 * profissional. Ver `ClinicaVinculo` em `Vinculos.ts`, que é o tipo único
 * de `GET /clinica/minhas` — antes o mesmo endpoint tinha três tipos
 * diferentes (`ClinicaPacienteResponse`, `ClinicaProfissionalResponse` e um
 * `Clinica` declarado à mão dentro de `ClinicaUserPage`), o que permitia
 * que cada tela acreditasse numa forma distinta da mesma resposta.
 */
export interface ContagensClinica {
  profissionais?: number;
  pacientes?: number;
  protocolos?: number;
  exercicios?: number;
}
