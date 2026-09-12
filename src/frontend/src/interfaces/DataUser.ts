/** Campos comuns a `GET /paciente` e `GET /profissional`. */
interface UsuarioInfoBase {
  id: string;
  nome: string;
  avatar: string | null;
  telefone: string;
  dataNascimento: string;
  email?: string;
  /** Alguns endpoints devolvem a foto do Google neste campo. */
  avatarUrl?: string | null;
  /** Alias de `dataNascimento` usado pelos formulários de edição. */
  nascimento?: string;
}

export interface PacienteInfoResponse extends UsuarioInfoBase {
  cpf: string;
}

export interface ProfissionalInfoResponse extends UsuarioInfoBase {
  cnpj: string;
  crefito: string;
  conselhoNome: string;
  conselhoNumero: string;
  conselhoUf: string;
  especialidade?: string;
}
