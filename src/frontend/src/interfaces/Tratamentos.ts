/**
 * DTO de resposta da API para Tratamento (ObterTratamento.java)
 */
export interface TratamentoResponseApi {
  id: string;
  descricao: string;
  inicio: string; // LocalDate (YYYY-MM-DD)
  fim?: string | null; // LocalDate (YYYY-MM-DD)
  progresso: number; // Double
  sequencia: number;
  ultimaAcao?: string | null; // LocalDate
  lembreteConfig?: any; // Mapeia o LembreteConfig

  clinPacienteId: string;
  pacienteId: string;
  pacienteNome: string;

  clinProfissionalId?: string | null;
  profissionalId?: string | null;
  profissionalNome?: string | null;
}

/**
 * DTO de requisição para criação de Tratamento (CadastroTratamento.java)
 */
export interface CadastroTratamentoRequestApi {
  clinPacienteId: string;
  descricao: string;
  inicio: string; // LocalDate (YYYY-MM-DD)
  lembreteConfig?: any;
}
