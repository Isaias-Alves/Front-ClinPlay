import FormCadastro from "./FormCadastro.jsx";
import { BrowserRouter } from "react-router-dom";
import { userEvent, within, expect } from "storybook/test";

export default {
  title: "ClinPlay/Forms/FormCadastro",
  component: FormCadastro,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="p-8 bg-slate-50 max-w-xl">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
};

// Story padrão
export const Default = {};

// Story para testar os Erros de Validação
export const TestarValidacao = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. Localiza o botão de cadastrar
    const submitBtn = canvas.getByRole("button", { name: /cadastrar/i });

    // 2. Clica sem preencher nada para disparar o "required"
    await userEvent.click(submitBtn);

    // 3. Verifica se as mensagens de erro apareceram na tela
    // (Ajuste o texto conforme o que estiver no seu validationMessages.required)
    const errorMessages = await canvas.findAllByText(/obrigatório/i);
    await expect(errorMessages.length).toBeGreaterThan(0);
  },
};
