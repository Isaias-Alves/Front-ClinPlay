import { UF } from "@interfaces";

interface ValidationMessages {
  required: string;
  email: string;
  telefone: string;
  cpf: string;
  cnpj: string;
  date: string;
  crefito: string;
  tokenFisioterapeuta: string;
  minLength: (min: number) => string;
  maxLength: (max: number) => string;
  conselhoNome: string;
  conselhoNumero: string;
  conselhoUf: UF;
}

const validationMessages: ValidationMessages = {
  required: "Este campo é obrigatório!",
  email: "Formato de email inválido!",
  telefone: "Formato de telefone inválido!",
  cpf: "Formato de CPF inválido!",
  cnpj: "Formato de CNPJ inválido!",
  date: "Formato de data inválido!",
  crefito: "O CREFITO é obrigatório para profissionais!",
  tokenFisioterapeuta: "Token do fisioterapeuta inválido!",
  minLength: (min) => `Mínimo de caracteres inválido! (mínimo: ${min})`,
  maxLength: (max) => `Máximo de caracteres inválido! (máximo: ${max})`,
  conselhoNome: "Nome do conselho inválido!",
  conselhoNumero: "Número do conselho inválido!",
  conselhoUf: "UF do conselho inválida!",
};

const validationPatterns: Record<string, RegExp> = {
  // Aceita 11 números OU formato 000.000.000-00
  cpf: /^(\d{11}|\d{3}\.\d{3}\.\d{3}-\d{2})$/,

  // Aceita 14 números OU formato 00.000.000/0000-00
  cnpj: /^(\d{14}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/,

  // telefone: /^\(\d{2}\) \d{5}-\d{4}$/,
  email: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/i,

  // CREFITO: apenas números, letras e traço, máximo 9 caracteres
  crefito: /^[A-Za-z0-9\-]{1,9}$/,

  // Nome do conselho: letras, números e espaços, 2-100 chars
  conselhoNome: /^[A-Za-zÀ-ÿ0-9\s\-]{2,100}$/,

  // Número do conselho: alfanumérico, até 20 chars
  conselhoNumero: /^[A-Za-z0-9\-\/]{1,20}$/,
};

const validateNascimento = (value: string | undefined): string | boolean => {
  if (!value || value.includes("_")) return "Data incompleta!";

  const partes = value.split("/");
  if (partes.length !== 3) return "Formato inválido!";

  const dia = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10);
  const ano = parseInt(partes[2], 10);

  const dataSelecionada = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (
    isNaN(dataSelecionada.getTime()) ||
    dataSelecionada.getDate() !== dia ||
    dataSelecionada.getMonth() !== mes - 1
  ) {
    return "Data inválida!";
  }

  if (dataSelecionada > hoje) return "Data de nascimento não pode ser futura.";

  if (ano < 1900) return "Ano inválido!";

  return true;
};

export { validationMessages, validationPatterns, validateNascimento };
