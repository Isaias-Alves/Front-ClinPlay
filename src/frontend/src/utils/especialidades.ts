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
  "Fisioterapia Respiratória",
  "Fisioterapia Traumato-Ortopédica",
  "Outras Fisioterapias"
] as const;

export type Especialidade = (typeof ESPECIALIDADES)[number];
