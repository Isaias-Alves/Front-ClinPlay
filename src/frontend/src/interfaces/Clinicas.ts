export interface Clinica {
  codigo: string;
  nome: string;
  maxProfissionais: number;
  maxPacientes: number;
  maxProtocolos: number;
  maxExercicios: number;
}

export interface ClinicaPacienteResponse {
  nome: string;
  codigo: string;
  id: string;
}

export interface ClinicaProfissionalResponse extends Clinica {
  id: string;
  profissionais: number;
  pacientes: number;
  protocolos: number;
  exercicios: number;
}
