import { ESTADOS_BR } from "@utils";

export type UF = (typeof ESTADOS_BR)[number]["sigla"];

export interface Usuario {
  nome: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  avatar: string | null;
  criadoEm: string;
}

export interface Paciente extends Usuario {
  tipo: "paciente";
  tokenFisioterapeuta?: string;
  cpf: string;
}

export interface Profissional extends Usuario {
  tipo: "profissional";
  crefito: string;
  especialidade: string;
  conselhoNome: string;
  conselhoNumero: string;
  conselhoUf: UF;
  cnpj: string;
  vinculoClinica?: boolean;
  cnpjClinica?: string;
}

export type UsuarioCadastro = Paciente | Profissional;

export interface UsuarioResponse extends Usuario {
  id: number;
  googleId: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface CadastroPacienteRequest {
  nome: string;
  nascimento: string;
  email: string;
  telefone: string;
  cpf: string;
  senha?: string;
  avatar?: string;
}

export interface CadastroProfissionalRequest {
  nome: string;
  nascimento: string;
  email: string;
  telefone: string;
  senha?: string;
  avatar?: string;
  especialidade: string;
  crefito: string;
  conselhoNome: string;
  conselhoNumero: string;
  conselhoUf: UF;
  vinculoClinica?: boolean;
  cnpjClinica?: string;
}

export interface UsuarioFormInput extends Usuario {
  tipo: "paciente" | "profissional";
  cpf?: string;
  cnpj?: string;
  crefito?: string;
  especialidade?: string;
  conselhoNome?: string;
  conselhoNumero?: string;
  conselhoUf?: UF;
  tokenFisioterapeuta?: string;
  vinculoClinica?: boolean;
  cnpjClinica?: string;
  termosDeUso?: boolean;
  politicaDePrivacidade?: boolean;
}
