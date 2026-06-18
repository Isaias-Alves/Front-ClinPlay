/**
 * Converte um valor decimal em horas (ex: 0.016667) para o formato de relógio "HH:mm" (ex: "00:01")
 */
export const formatarHorasParaHHMM = (horasDecimais: number): string => {
  if (!horasDecimais) return "00:00";
  const h = Math.floor(horasDecimais);
  const m = Math.round((horasDecimais - h) * 60);
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

  return h + m / 60;
};
