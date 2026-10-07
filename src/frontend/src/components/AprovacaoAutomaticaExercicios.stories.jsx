import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { AppContext } from "@contexts";
import { clinicasServices } from "@services";
import AprovacaoAutomaticaExercicios from "./AprovacaoAutomaticaExercicios";

// Só o que o componente lê do contexto; o resto do AppContext não importa aqui.
const contexto = {
  notificar: fn(),
  confirmar: fn(async () => true),
  refreshData: fn(async () => {}),
};

export default {
  title: "ClinPlay/Clinica/AprovacaoAutomaticaExercicios",
  component: AprovacaoAutomaticaExercicios,
  args: { clinicaId: "clinica-1", ativo: false },
  decorators: [
    (Story) => (
      <AppContext.Provider value={contexto}>
        <div className="p-8 bg-white max-w-xl">
          <Story />
        </div>
      </AppContext.Provider>
    ),
  ],
  // Sem rede no teste: o service é trocado por um espião e restaurado depois.
  beforeEach: () => {
    const original = clinicasServices.atualizarAprovacaoAutomatica;
    clinicasServices.atualizarAprovacaoAutomatica = fn(async () => {});
    contexto.confirmar.mockImplementation(async () => true);
    contexto.notificar.mockClear();
    contexto.confirmar.mockClear();
    return () => {
      clinicasServices.atualizarAprovacaoAutomatica = original;
    };
  },
};

export const Desligado = {};

export const Ligado = { args: { ativo: true } };

export const LigarPedeConfirmacaoESalva = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("switch"));

    await expect(contexto.confirmar).toHaveBeenCalledOnce();
    await waitFor(() =>
      expect(clinicasServices.atualizarAprovacaoAutomatica).toHaveBeenCalledWith(
        "clinica-1",
        true,
      ),
    );
    await waitFor(() =>
      expect(contexto.notificar).toHaveBeenCalledWith(
        "Aprovação automática de exercícios ativada.",
        "sucesso",
      ),
    );
  },
};

export const RecusarConfirmacaoNaoSalva = {
  play: async ({ canvasElement }) => {
    contexto.confirmar.mockImplementation(async () => false);
    const canvas = within(canvasElement);
    const chave = canvas.getByRole("switch");
    await userEvent.click(chave);

    await expect(contexto.confirmar).toHaveBeenCalledOnce();
    await expect(chave).not.toBeChecked();
    await expect(
      clinicasServices.atualizarAprovacaoAutomatica,
    ).not.toHaveBeenCalled();
  },
};

export const DesligarNaoPedeConfirmacao = {
  args: { ativo: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("switch"));

    await expect(contexto.confirmar).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(clinicasServices.atualizarAprovacaoAutomatica).toHaveBeenCalledWith(
        "clinica-1",
        false,
      ),
    );
  },
};
