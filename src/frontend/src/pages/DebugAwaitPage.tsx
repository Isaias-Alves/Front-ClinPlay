import { LuConstruction } from "react-icons/lu"; // Se tiver react-icons, fica legal

/**
 * Página temporária de Placeholder para acessos autenticados.
 * Utilizada enquanto o Dashboard principal está sob desenvolvimento.
 */
export function DebugAwaitPage() {
  const handleLogout = (): void => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
      <div className="bg-white p-10 rounded-3xl shadow-lg border border-slate-200 max-w-md">
        <LuConstruction className="text-6xl text-yellow-500 mx-auto mb-6" />

        <h1 className="text-2xl font-bold text-slate-800 mb-4">
          Acesso Identificado
        </h1>

        <p className="text-slate-600 leading-relaxed">
          Dashboard ainda em desenvolvimento, por favor, aguardar novas
          atualizações do sistema.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="text-sm text-blue-500 hover:underline"
          >
            Sair e voltar ao Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default DebugAwaitPage;
