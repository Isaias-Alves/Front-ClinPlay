export interface PacienteInfoResponse {
  id: string;
  nome: string;
  avatar: string | null;
  telefone: string;
  cpf: string;
  dataNascimento: string;
}

export interface ProfissionalInfoResponse {
  id: string;
  nome: string;
  avatar: string | null;
  telefone: string;
  cnpj: string;
  crefito: string;
  conselhoNome: string;
  conselhoNumero: string;
  conselhoUf: string;
  dataNascimento: string;
}
