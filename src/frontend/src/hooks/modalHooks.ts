import { useState } from "react";

/**
 * Hook genérico para controle de estado de qualquer Modal.
 * Pode ser utilizado nas páginas para abrir/fechar facilmente modais.
 * @param initialState Estado inicial do modal (aberto ou fechado).
 * @returns Um objeto contendo o estado e funções para abrir/fechar o modal.
 */
export const useModal = (initialState: boolean = false) => {
  const [isOpen, setIsOpen] = useState<boolean>(initialState);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen((prev) => !prev);

  return { isOpen, openModal, closeModal, toggleModal };
};

/**
 * Hook específico para a lógica de negócio do Modal de Termos de Consentimento.
 * Cuida das regras de aceite e chamadas de função associadas.
 * @param onAccept Função a ser chamada quando os termos e LGPD forem aceitos.
 * @returns Um objeto contendo o estado e funções para aceitar os termos e LGPD.
 */
export const useTermosModal = (onAccept: () => void) => {
  const [termosAceitos, setTermosAceitos] = useState<boolean>(false);
  const [lgpdAceita, setLgpdAceita] = useState<boolean>(false);

  const todosAceitos = termosAceitos && lgpdAceita;

  const handleAccept = () => {
    if (todosAceitos) {
      onAccept();
    }
  };

  return {
    termosAceitos,
    setTermosAceitos,
    lgpdAceita,
    setLgpdAceita,
    todosAceitos,
    handleAccept,
  };
};
