import { useState, useCallback } from "react";
import { authServices } from "@services";
import { LoginSetup } from "@interfaces";

/**
 * Hook responsável pela lógica de autenticação com Google.
 * @returns Um objeto contendo funções e estados para autenticação via Google.
 */
const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loginWithGoogle = (): void => {
    const apiUrl = import.meta.env.VITE_API_URL || "https://clinplay-api.onrender.com";
    const googleAuthUrl = `${apiUrl}/auth/oauth2/google`;

    setIsLoading(true);

    window.location.href = googleAuthUrl;
  };

  /**
   * Função responsável por buscar os dados do usuário autenticado via Google.
   * @returns Uma promessa que resolve com os dados do usuário ou `null` em caso de erro.
   */

  const fetchGoogleData = useCallback(async (): Promise<LoginSetup | null> => {
    setIsLoading(true);
    try {
      const userData = await authServices.getLoginSetup();
      return userData;
    } catch (error) {
      console.error("Erro ao recuperar setup do Google:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  return { loginWithGoogle, fetchGoogleData, isLoading };
};

export default useGoogleAuth;
