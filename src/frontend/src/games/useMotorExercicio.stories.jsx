import { useEffect, useRef, useState } from "react";
import { expect, waitFor, within } from "storybook/test";
import { normalizarConfig, useMotorExercicio } from "./useMotorExercicio";

/**
 * Roda o motor de verdade e registra cada fase com a duração medida.
 * Tempos curtos para o teste não demorar; o preparo de 3 s é fixo do motor.
 */
const CONFIG = {
  acaoPrincipal: "Contraia",
  acaoSecundaria: "Relaxe",
  tempoPrincipal: 0.1,
  tempoSecundario: 0.1,
  tempoPausa: 0.1,
  tempoPausaSeries: 1,
  seriesTotais: 2,
  repeticoesTotais: 2,
};

const Registro = () => {
  const { estado } = useMotorExercicio(CONFIG);
  const [fases, setFases] = useState([]);
  const anterior = useRef(null);

  useEffect(() => {
    const chave = `${estado.fase}|${estado.serieAtual}|${estado.repAtual}`;
    if (anterior.current?.chave === chave) return;
    const agora = performance.now();
    const fechada = anterior.current;
    anterior.current = { chave, inicio: agora, estado };
    if (!fechada) return;
    setFases((f) => [
      ...f,
      {
        fase: fechada.estado.fase,
        serie: fechada.estado.serieAtual,
        rep: fechada.estado.repAtual,
        entreSeries: fechada.estado.pausaEntreSeries,
        segundos: (agora - fechada.inicio) / 1000,
      },
    ]);
  }, [estado]);

  return (
    <div>
      <p data-testid="fase">{estado.fase}</p>
      <pre data-testid="registro">{JSON.stringify(fases)}</pre>
    </div>
  );
};

export default {
  title: "ClinPlay/Motor/useMotorExercicio",
  render: () => <Registro />,
};

export const PausaEntreSeriesUsaOTempoProprio = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => expect(canvas.getByTestId("fase")).toHaveTextContent("CONCLUIDO"),
      { timeout: 12000 },
    );
    // O registro da última fase é gravado um render depois do CONCLUIDO.
    const lerRegistro = () =>
      JSON.parse(canvas.getByTestId("registro").textContent);
    await waitFor(() =>
      expect(lerRegistro().at(-1)).toMatchObject({
        fase: "ACAO_SECUNDARIA",
        serie: 2,
        rep: 2,
      }),
    );
    const fases = lerRegistro();
    const pausas = fases.filter((f) => f.fase === "PAUSA");

    // 2 séries × 2 reps: pausa entre reps em cada série + 1 pausa entre séries.
    // A última repetição da última série vai direto para CONCLUIDO.
    await expect(pausas.map((p) => p.entreSeries)).toEqual([false, true, false]);

    const entreSeries = pausas.find((p) => p.entreSeries);
    await expect(entreSeries.serie).toBe(1);
    await expect(entreSeries.segundos).toBeGreaterThan(0.9);
    await expect(entreSeries.segundos).toBeLessThan(1.4);

    for (const p of pausas.filter((p) => !p.entreSeries))
      await expect(p.segundos).toBeLessThan(0.5);

  },
};

export const NormalizarConfigDaPrescricao = {
  render: () => <p>normalizarConfig</p>,
  play: async () => {
    // Campo novo informado: vale como está, inclusive 0 (séries emendadas).
    await expect(
      normalizarConfig({ tempoDescanso: 5, tempoDescansoSeries: 90 })
        .tempoPausaSeries,
    ).toBe(90);
    await expect(
      normalizarConfig({ tempoDescanso: 5, tempoDescansoSeries: 0 })
        .tempoPausaSeries,
    ).toBe(0);

    // Prescrição antiga, sem o campo: herda a pausa entre repetições.
    await expect(
      normalizarConfig({ tempoDescanso: 5, tempoDescansoSeries: null })
        .tempoPausaSeries,
    ).toBe(5);
    await expect(normalizarConfig({ tempoDescanso: 5 }).tempoPausaSeries).toBe(5);
    await expect(normalizarConfig({ tempoDescanso: 5 }).tempoPausa).toBe(5);
  },
};
