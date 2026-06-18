import { motion } from "framer-motion";
import { LoginButtonGoogle, LogotipoClinPlay } from "@components";
import { MedicoEPaciente } from "@assets";

// Variantes do Framer Motion para o efeito de entrada em cascata (Stagger)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // Atraso de 0.15s entre a entrada de cada elemento
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 150, damping: 24 },
  },
};

const LoginPage = () => {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-slate-50 overflow-hidden">
      {/* BACKGROUND: Efeito Aura Glow (Gamificado) */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div
        className="absolute bottom-[10%] right-[-10%] w-72 h-72 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* CONTEÚDO PRINCIPAL (Animado) */}
      <motion.div
        className="relative z-10 flex flex-col items-center w-full px-6 mb-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logotipo com efeito mola na entrada */}
        <motion.div variants={itemVariants}>
          <LogotipoClinPlay mt="mt-0" mb="mb-8" />
        </motion.div>

        {/* Textos de Boas-vindas */}
        <motion.h2
          variants={itemVariants}
          className="text-2xl font-extrabold text-slate-800 mb-1 tracking-tight"
        >
          Bem-vindo!
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="text-slate-500 mb-8 font-medium text-sm"
        >
          Entre para continuar
        </motion.p>

        {/* BOTAO DO GOOGLE: Wrapper animado com micro-interações */}
        <motion.div
          variants={itemVariants}
          whileTap={{ scale: 0.95 }} // Efeito de afundar ao toque
          whileHover={{ y: -2 }} // Efeito de levitar ao passar o mouse
          className="w-full max-w-xs relative cursor-pointer"
        >
          {/* Efeito Glow (Sombra colorida suave atrás do botão) */}
          <div className="absolute -inset-0.5 bg-linear-to-r from-emerald-400 to-blue-400 rounded-2xl blur opacity-12 group-hover:opacity-40 transition duration-300"></div>

          {/* Caixa real do botão */}
          <div className="relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <LoginButtonGoogle />
          </div>
        </motion.div>
      </motion.div>

      {/* IMAGEM DE RODAPÉ (Desliza da direita para a esquerda) */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 100, damping: 20 }}
        className="absolute bottom-0 right-0 flex items-end justify-end pointer-events-none"
      >
        <img
          src={MedicoEPaciente}
          alt="Médico e Paciente"
          className="h-48 md:h-56 max-w-full opacity-95"
        />
      </motion.div>
    </div>
  );
};

export default LoginPage;
