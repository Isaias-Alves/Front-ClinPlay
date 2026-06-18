import { FormCadastro, LogotipoClinPlay } from "@components";
import { motion } from "framer-motion";

// Variantes do Framer Motion para o efeito de entrada em cascata (Stagger)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 150, damping: 20 },
  },
};

const CadastroPage = () => {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-slate-50 overflow-x-hidden overflow-y-auto scrollbar-thin py-10">
      {/* BACKGROUND: Efeito Aura Glow (Gamificado) */}
      <div className="fixed top-[-5%] left-[-10%] w-72 h-72 bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse pointer-events-none"></div>
      <div
        className="fixed bottom-[-5%] right-[-10%] w-72 h-72 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse pointer-events-none"
        style={{ animationDelay: "2s" }}
      ></div>

      <motion.div
        className="relative z-10 flex flex-col items-center w-full px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logotipo com efeito mola */}
        <motion.div variants={itemVariants}>
          <LogotipoClinPlay mt="mt-0" mb="mb-4" />
        </motion.div>

        {/* Cabeçalho */}
        <motion.header variants={itemVariants} className="text-center mb-6">
          <h1 className="text-slate-800 font-bold text-2xl tracking-tight">
            Cadastro de <span className="text-emerald-500">Usuário</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Crie a sua conta para começar
          </p>
        </motion.header>

        {/* Formulário envolto em animação */}
        <motion.div variants={itemVariants} className="w-full max-w-md">
          <FormCadastro />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CadastroPage;
