import LoginButtonGoogle from "./LoginButtonGoogle";
import { FcGoogle } from "react-icons/fc"; // Importamos aqui para usar nos args se quiser

// Este default export configura onde o componente aparece na barra lateral
export default {
  title: "Componentes/Botoes/LoginGoogle",
  component: LoginButtonGoogle,
  tags: ["autodocs"], // Gera a documentação automática

  // Aqui está o "pulo do gato": vamos usar decorators para envolver o componente
  // e simular que ele está em um ambiente controlado.
  // Como não estamos usando bibliotecas de mock ainda,
  // vamos apenas renderizar o componente e forçar estados visuais.
  decorators: [
    (Story) => (
      <div className="p-10 bg-slate-100 dark:bg-slate-900 min-h-[200px] flex items-center justify-center">
        {/* Envolvemos em uma div para centralizar e testar dark mode */}
        <Story />
      </div>
    ),
  ],
};

// 1. Estado Padrão (Fazer login)
export const Default = {};

// 2. Estado de Carregamento (Verificando...)
// Como o seu botão pega o loading do hook, a gente não consegue mudar isso
// via args facilmente sem alterar o componente ou usar mocks.
// Uma solução paliativa para testar o visual é criar uma variante fake:
export const LoadingVisualTest = {
  // ATENÇÃO: Isso aqui é só para testar o visual do spinner/texto,
  // ele não vai testar a lógica do hook real.
  render: () => (
    <button
      disabled={true}
      className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black opacity-50"
    >
      <span className="animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-black rounded-full" />
      Verificando...
    </button>
  ),
};

// 3. Teste Mobile-First (Usando a barra de ferramentas do Storybook)
export const MobileView = {
  parameters: {
    // Força o viewport para mobile (você pode escolher outros nomes do addon-viewports)
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

// 4. Teste Dark Mode (Usando o addon-themes se você tiver)
export const DarkModeVisualTest = {
  decorators: [
    (Story) => (
      <div className="dark p-10 bg-slate-900 min-h-[200px] flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
};
