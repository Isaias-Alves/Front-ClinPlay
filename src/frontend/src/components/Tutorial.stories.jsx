import { useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import useTutorial from "@hooks/useTutorial";
import Tutorial from "./Tutorial";

const PASSOS = [
  { titulo: "Início", texto: "Passo sem alvo." },
  { alvo: "botao-a", titulo: "Botão A", texto: "Destaca o botão A." },
  { alvo: "nao-existe", titulo: "Sem alvo na tela", texto: "Alvo ausente." },
  { alvo: "botao-b", titulo: "Botão B", texto: "Último passo." },
];

const Pagina = ({ children }) => (
  <div className="p-8 space-y-[60vh]">
    <button data-tutorial="botao-a">A</button>
    <button data-tutorial="botao-b">B</button>
    {children}
  </div>
);

const onFechar = fn();

/** Tutorial controlado pelo próprio estado, como as telas fazem com o hook. */
const ComEstado = () => {
  const [aberto, setAberto] = useState(true);
  return (
    <Pagina>
      <Tutorial
        passos={PASSOS}
        aberto={aberto}
        onFechar={() => {
          onFechar();
          setAberto(false);
        }}
      />
    </Pagina>
  );
};

export default {
  title: "ClinPlay/Tutorial",
  component: Tutorial,
  render: () => <ComEstado />,
  beforeEach: () => onFechar.mockClear(),
};

// O tutorial é renderizado num portal em <body>, fora do canvas.
const tela = () => within(document.body);
const proximo = () => userEvent.click(tela().getByRole("button", { name: "Próximo" }));

export const NavegaEntrePassos = {
  play: async () => {
    await expect(tela().getByText("Passo 1 de 4")).toBeInTheDocument();
    await expect(tela().queryByRole("button", { name: "Voltar" })).toBeNull();

    await proximo();
    await expect(tela().getByText("Passo 2 de 4")).toBeInTheDocument();

    await userEvent.click(tela().getByRole("button", { name: "Voltar" }));
    await expect(tela().getByText("Passo 1 de 4")).toBeInTheDocument();
  },
};

export const DestacaOAlvoDoPasso = {
  play: async () => {
    await proximo();
    const alvo = document.querySelector('[data-tutorial="botao-a"]');
    const destaque = () =>
      document.querySelector('[role="dialog"] > [aria-hidden="true"]');

    await waitFor(() => {
      const r = alvo.getBoundingClientRect();
      // 8 px de folga em volta do elemento.
      expect(parseFloat(destaque().style.top)).toBeCloseTo(r.top - 8, 0);
      expect(parseFloat(destaque().style.width)).toBeCloseTo(r.width + 16, 0);
    });
  },
};

export const PassoComAlvoAusenteContinuaLegivel = {
  play: async () => {
    await proximo();
    await proximo();
    await expect(tela().getByText("Sem alvo na tela")).toBeInTheDocument();
    await expect(tela().getByRole("button", { name: "Próximo" })).toBeEnabled();
  },
};

export const PularFecha = {
  play: async () => {
    await proximo();
    await userEvent.click(tela().getByRole("button", { name: "Pular tutorial" }));
    await expect(onFechar).toHaveBeenCalledOnce();
    await expect(tela().queryByRole("dialog")).toBeNull();
  },
};

export const EscFecha = {
  play: async () => {
    await userEvent.keyboard("{Escape}");
    await expect(onFechar).toHaveBeenCalledOnce();
    await expect(tela().queryByRole("dialog")).toBeNull();
  },
};

export const ConcluirNoUltimoPasso = {
  play: async () => {
    await proximo();
    await proximo();
    await proximo();
    await expect(tela().queryByRole("button", { name: "Próximo" })).toBeNull();
    await userEvent.click(tela().getByRole("button", { name: "Concluir" }));
    await expect(onFechar).toHaveBeenCalledOnce();
  },
};

// ---------------------------------------------------------------- useTutorial

const CHAVE = "tutorial:story:usuario-1";

const ComHook = () => {
  const tutorial = useTutorial("story", "usuario-1");
  return (
    <Pagina>
      <button onClick={tutorial.abrir}>Rever tutorial</button>
      <Tutorial
        passos={PASSOS}
        aberto={tutorial.aberto}
        onFechar={tutorial.fechar}
      />
    </Pagina>
  );
};

export const PrimeiraVisitaAbreEMarcaComoVisto = {
  render: () => <ComHook />,
  beforeEach: () => localStorage.removeItem(CHAVE),
  play: async () => {
    await expect(tela().getByRole("dialog")).toBeInTheDocument();
    await userEvent.click(tela().getByRole("button", { name: "Pular tutorial" }));
    await expect(localStorage.getItem(CHAVE)).toBe("1");
  },
};

export const JaVistoNaoAbreMasPodeRever = {
  render: () => <ComHook />,
  beforeEach: () => {
    localStorage.setItem(CHAVE, "1");
    return () => localStorage.removeItem(CHAVE);
  },
  play: async ({ canvasElement }) => {
    await expect(tela().queryByRole("dialog")).toBeNull();
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "Rever tutorial" }),
    );
    await expect(tela().getByText("Passo 1 de 4")).toBeInTheDocument();
  },
};
