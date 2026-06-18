export interface Exercicio {
  nome_exercicio: string;
  descricao: string;
  url_video: string;
  categoria: string;
}

export interface ExercicioInfoResponse extends Exercicio {
  id: string;
}
