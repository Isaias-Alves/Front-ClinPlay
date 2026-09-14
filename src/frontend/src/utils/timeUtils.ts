/**
 * Converte um valor decimal em horas (ex: 0.016667) para o formato de relógio "HH:mm" (ex: "00:01")
 */
export const formatarHorasParaHHMM = (horasDecimais: number): string => {
  if (!horasDecimais || horasDecimais < 0) return "00:00";

  // `Math.round` nos minutos podia devolver 60 — 0.999 h virava "00:60", que
  // não é hora nenhuma e a máscara `##:##` aceitava de volta como 60 min.
  // Somar o minuto excedente na hora resolve na origem.
  const totalMinutos = Math.round(horasDecimais * 60);
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;

  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

/**
 * Converte o formato de relógio/duração "HH:mm" (ex: "00:01") para valor decimal em horas (ex: 0.016667)
 * Remove underlines de máscaras incompletas de forma segura.
 */
export const formatarHHMMParaHoras = (hhmm: string): number => {
  if (!hhmm || !hhmm.includes(":")) return 0;

  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr.replace(/\D/g, "") || 0); // \D remove tudo que não for número (como o underline _)
  const m = Number(mStr.replace(/\D/g, "") || 0);

  /**
   * Barreira final contra valores impossíveis.
   *
   * A máscara `##:##` aceita "99:99", e sem limite isso virava 100,65 horas
   * de bloqueio — mais de quatro dias em que o paciente não conseguiria
   * repetir o exercício. Os formulários já validam antes de chegar aqui;
   * esta função é chamada de três lugares e não pode confiar nisso.
   */
  const horas = Math.min(Math.max(h, 0), 23);
  const minutos = Math.min(Math.max(m, 0), 59);

  return horas + minutos / 60;
};
