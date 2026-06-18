import FormClinica from "./FormClinica.tsx";
import { BrowserRouter } from "react-router-dom";

export default {
  title: "ClinPlay/Forms/FormClinica",
  component: FormClinica,
  decorators: [
    (Story) => (
      // O BrowserRouter é obrigatório aqui porque o formulário usa o useNavigate()
      <BrowserRouter>
        <div className="p-8 bg-slate-50 min-h-screen flex items-start justify-center">
          <div className="w-full max-w-2xl">
            <Story />
          </div>
        </div>
      </BrowserRouter>
    ),
  ],
};

export const Default = {};