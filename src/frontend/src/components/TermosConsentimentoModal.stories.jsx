import TermosConsentimentoModal from "./TermosConsentimentoModal";
import { useModal } from "@hooks/modalHooks";

export default {
  title: "Componentes/Modais/TermosConsentimento",
  component: TermosConsentimentoModal,
  tags: ["autodocs"],
};

// Criamos um wrapper para gerenciar o estado de "aberto/fechado" dentro do Storybook
const ModalWrapper = (args) => {
  const { isOpen, openModal, closeModal } = useModal(true); // Começa aberto no Storybook para facilitar o teste

  return (
    <div className="min-h-[600px] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-10 font-sans">
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Clique no botão abaixo caso tenha fechado o modal e queira abrir novamente:
      </p>
      <button
        onClick={openModal}
        className="rounded-xl bg-amber-400 px-6 py-3 font-medium text-black hover:bg-amber-500 transition-colors"
      >
        Abrir Modal de Termos
      </button>

      <TermosConsentimentoModal
        {...args}
        isOpen={isOpen}
        onClose={closeModal}
        onAccept={() => {
          alert("Termos e LGPD Aceitos com sucesso!");
          closeModal();
        }}
      />
    </div>
  );
};

// 1. Visualização Padrão (Light Mode)
export const Default = {
  render: (args) => <ModalWrapper {...args} />,
};

// 2. Visualização Dark Mode
export const DarkMode = {
  render: (args) => (
    <div className="dark">
      <ModalWrapper {...args} />
    </div>
  ),
};