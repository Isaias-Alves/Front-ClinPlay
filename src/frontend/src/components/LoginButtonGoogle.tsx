import { useGoogleAuth } from "@hooks";
import { FcGoogle } from "react-icons/fc";
import { FiLoader } from "react-icons/fi";

/**
 * Componente LoginButtonGoogle que exibe um botão de login com o Google
 * Refatorado com micro-interações de estado e alinhamento flex moderno.
 */
const LoginButtonGoogle = () => {
  const { loginWithGoogle, isLoading } = useGoogleAuth();

  return (
    <button
      onClick={loginWithGoogle}
      disabled={isLoading}
      type="button"
      className="relative flex items-center justify-center gap-3 px-4 py-3 w-full bg-transparent text-slate-700 rounded-2xl font-semibold text-sm transition-all disabled:opacity-70 disabled:cursor-wait"
    >
      {isLoading ? (
        <>
          {/* Spinner de carregamento rodando */}
          <FiLoader className="text-emerald-500 animate-spin text-xl" />
          <span>A conectar...</span>
        </>
      ) : (
        <>
          {/* Estado normal com o ícone do Google */}
          <FcGoogle className="text-xl" />
          <span>Fazer login com o Google</span>
        </>
      )}
    </button>
  );
};

export default LoginButtonGoogle;
