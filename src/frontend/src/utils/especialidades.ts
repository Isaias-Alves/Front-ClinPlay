export const ESPECIALIDADES = [
  "Fisioterapia em Geral",
  "Fisioterapia Aquática",
  "Fisioterapia Cardiovascular",
  "Fisioterapia Dermatofuncional",
  "Fisioterapia do Trabalho",
  "Fisioterapia em Acupuntura",
  "Fisioterapia em Gerontologia",
  "Fisioterapia em Oncologia",
  "Fisioterapia em Osteopatia",
  "Fisioterapia em Quiropraxia",
  "Fisioterapia em Reumatologia",
  "Fisioterapia em Saúde da Mulher",
  "Fisioterapia em Terapia Intensiva",
  "Fisioterapia Esportiva",
  "Fisioterapia Neurofuncional",
  "Fisioterapia Pélvica",
  "Fisioterapia Respiratória",
  "Fisioterapia Traumato-Ortopédica",
  // Fora da ordem alfabética de propósito: "Pilates" não é uma
  // "Fisioterapia X", e "Outras Fisioterapias" é a opção de escape — tem
  // que continuar sendo a última da lista.
  "Pilates",
  "Outras Fisioterapias",
] as const;

export type Especialidade = (typeof ESPECIALIDADES)[number];
