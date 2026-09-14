import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { profissionalServices, pacienteServices } from "@services";
import { BottomBar } from "../components/BottomBar";
import { useApp } from "@contexts"; // <-- IMPORTANDO O SEU CONTEXTO!
import {
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiCalendar,
  FiAward,
  FiBriefcase,
  FiCreditCard,
  FiSave,
  FiX,
} from "react-icons/fi";
import { UsuarioFormInput } from "@interfaces";
import {
  mensagemDeErro,
  formatarCPF,
  validationPatterns,
  ESTADOS_BR,
} from "@utils";

/** Mensagem de erro de um campo. Sem isto o `required` bloqueia o envio em
 *  silêncio — o usuário toca em "Salvar" e nada acontece. */
const Erro = ({ mensagem }: { mensagem?: string }) =>
  mensagem ? (
    <p role="alert" className="mt-1 text-[11px] font-medium text-red-500">
      {mensagem}
    </p>
  ) : null;

/** Data de hoje em `yyyy-MM-dd`, o formato que o `<input type="date">` usa. */
const hojeISO = () => new Date().toISOString().slice(0, 10);

export function PerfilEditarPage() {
  const navigate = useNavigate();
  // 1. Puxamos os dados exatos e atualizados do contexto (sem depender de localStorage falho)
  const {
    notificar,
    refreshData,
    tipoUsuario: tipoLogado,
    usuario: usuarioLogado,
  } = useApp();

  const [carregando, setCarregando] = useState(false);

  // 2. Verificação rígida do tipo
  const isProfissional = tipoLogado === "profissional";

  // `usuario` é a união paciente|profissional; só um dos perfis tem cada
  // documento. O `in` estreita a união em vez de assumir que o campo existe.
  const cpfSalvo =
    usuarioLogado && "cpf" in usuarioLogado ? usuarioLogado.cpf : "";

  // 3. O useForm já inicia com os dados do usuário, fazendo o "pre-fill" automaticamente
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UsuarioFormInput>({
    // Valida ao sair do campo: avisar a cada tecla digitada faz a tela
    // piscar em vermelho enquanto a pessoa ainda está preenchendo.
    mode: "onBlur",
    defaultValues: {
      ...usuarioLogado,
      dataNascimento:
        usuarioLogado?.nascimento || usuarioLogado?.dataNascimento || "",
      cpf: cpfSalvo ? formatarCPF(cpfSalvo) : "",
    },
  });

  // Atualiza os valores do formulário caso o usuarioLogado seja carregado de forma assíncrona
  useEffect(() => {
    if (usuarioLogado) {
      reset({
        ...usuarioLogado,
        dataNascimento:
          usuarioLogado.nascimento || usuarioLogado.dataNascimento || "",
        cpf: cpfSalvo ? formatarCPF(cpfSalvo) : "",
      });
    }
  }, [usuarioLogado, cpfSalvo, reset]);

  const onSubmit = async (data: UsuarioFormInput) => {
    setCarregando(true);

    const payload = {
      ...usuarioLogado, // Garante que não vamos perder nenhum dado que não está no form
      ...data,
      nome: data.nome.trim().replace(/\s+/g, " "),
      // As máscaras guardam só os dígitos; o backend espera o mesmo.
      telefone: data.telefone?.replace(/\D/g, ""),
      nascimento: data.dataNascimento, // Mapeia o nome do input para o esperado pela API
      cpf: data.cpf ? data.cpf.replace(/\D/g, "") : undefined,
      conselhoUf: data.conselhoUf,
      cnpj: undefined, // Campo não existe no backend
    };

    try {
      if (isProfissional) {
        await profissionalServices.atualizar(payload);
      } else {
        await pacienteServices.atualizar(payload);
      }

      // Recarregar a página inteira (`window.location.href`) descartava o
      // bundle, o service worker e a conexão WebSocket só para reler o
      // perfil. `refreshData` busca os dados novos e a navegação continua
      // dentro do app — que é o ponto de ser um PWA.
      await refreshData();
      notificar("Perfil atualizado com sucesso!", "sucesso");
      navigate("/perfil", { replace: true });
    } catch (error) {
      notificar(mensagemDeErro(error, "Erro ao atualizar o perfil."), "erro");
    } finally {
      setCarregando(false);
    }
  };

  // Se por algum motivo não carregou o usuário do contexto, mostra tela de loading
  if (!usuarioLogado) {
    return (
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-28">
      {/* HEADER DE FUNDO */}
      <div className="bg-slate-900 h-64 w-full relative rounded-b-[40px] shadow-lg">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-b-[40px]">
          <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-3xl mx-auto px-6 pt-8 relative z-10 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95 flex items-center gap-2 text-sm font-bold backdrop-blur-sm"
          >
            <FiArrowLeft className="text-lg" /> Cancelar
          </button>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 -mt-24 relative z-20 space-y-8">
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-8"
        >
          {/* CARD PRINCIPAL - AVATAR E NOME */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left relative overflow-hidden"
          >
            <div className="w-32 h-32 rounded-3xl bg-slate-100 border-4 border-white shadow-lg overflow-hidden shrink-0 flex items-center justify-center text-slate-300 text-5xl">
              {usuarioLogado.avatar ? (
                <img
                  src={usuarioLogado.avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser />
              )}
            </div>

            <div className="flex-1 pt-2 w-full">
              <div className="inline-block px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase tracking-widest rounded-lg mb-3">
                Editando Perfil
              </div>
              <input
                {...register("nome", {
                  required: "Nome é obrigatório",
                  // Um nome não tem dígito nem símbolo, e o backend corta em
                  // 100. Barrar aqui evita o 400 sem explicação.
                  minLength: { value: 3, message: "Mínimo de 3 caracteres" },
                  maxLength: { value: 100, message: "Máximo de 100 caracteres" },
                  pattern: {
                    value: /^[A-Za-zÀ-ÿ]+(?:[ '-][A-Za-zÀ-ÿ]+)*$/,
                    message: "Use apenas letras e espaços",
                  },
                })}
                maxLength={100}
                autoComplete="name"
                autoCapitalize="words"
                aria-invalid={!!errors.nome}
                aria-label="Nome completo"
                className="w-full text-3xl font-extrabold text-slate-800 tracking-tight bg-transparent border-b-2 border-slate-100 focus:border-emerald-500 outline-none pb-1 transition-colors"
              />
              <Erro mensagem={errors.nome?.message} />
              <p className="text-slate-400 text-sm font-medium mt-2">
                Você pode editar seu nome acima.
              </p>
            </div>
          </motion.div>

          {/* GRID DE CARDS - Adicionado items-start para evitar distorção de altura */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
          >
            {/* DADOS GERAIS - DISPONÍVEL PARA AMBOS */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <FiUser className="text-blue-500" /> Dados Pessoais
              </h2>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                    <FiPhone />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Telefone
                    </p>
                    <Controller
                      control={control}
                      name="telefone"
                      rules={{
                        required: "Obrigatório",
                        validate: (valor) =>
                          (valor ?? "").replace(/\D/g, "").length === 11 ||
                          "Telefone incompleto",
                      }}
                      render={({ field: { value, onChange, ref, onBlur } }) => (
                        // Mesma máscara do cadastro. `inputMode="numeric"`
                        // abre o teclado numérico no celular — o alfabético
                        // aqui é só atrito.
                        <PatternFormat
                          format="(##) # ####-####"
                          mask="_"
                          inputMode="numeric"
                          value={value ?? ""}
                          onValueChange={(v) => onChange(v.value)}
                          onBlur={onBlur}
                          getInputRef={ref}
                          autoComplete="tel"
                          aria-invalid={!!errors.telefone}
                          className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none pb-1"
                        />
                      )}
                    />
                    <Erro mensagem={errors.telefone?.message} />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                    <FiCalendar />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Data de Nascimento
                    </p>
                    <input
                      type="date"
                      // `min`/`max` fazem o próprio seletor do celular
                      // bloquear datas impossíveis; a validação abaixo cobre
                      // quem digita direto no campo.
                      min="1900-01-01"
                      max={hojeISO()}
                      {...register("dataNascimento", {
                        required: "Obrigatório",
                        validate: (valor) => {
                          if (!valor) return "Obrigatório";
                          if (valor > hojeISO())
                            return "A data não pode ser futura";
                          if (valor < "1900-01-01") return "Ano inválido";
                          return true;
                        },
                      })}
                      autoComplete="bday"
                      aria-invalid={!!errors.dataNascimento}
                      className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-blue-500 outline-none pb-1"
                    />
                    <Erro mensagem={errors.dataNascimento?.message} />
                  </div>
                </div>

                {/* CPF APENAS PARA PACIENTE */}
                {!isProfissional && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0">
                      <FiCreditCard />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Documento (CPF)
                      </p>
                      {/* Sem `required`: o campo é somente leitura, então um
                          cadastro antigo sem CPF travaria o envio para
                          sempre — e sem nenhum erro na tela. */}
                      <input
                        {...register("cpf")}
                        readOnly
                        inputMode="numeric"
                        aria-readonly="true"
                        className="w-full text-sm font-bold text-slate-400 bg-transparent border-b border-slate-200 outline-none pb-1 cursor-not-allowed"
                        title="O CPF não pode ser alterado."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DADOS PROFISSIONAIS - DISPONÍVEL APENAS PARA PROFISSIONAL */}
            {isProfissional && (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FiBriefcase className="text-indigo-500" /> Registro
                  Profissional
                </h2>

                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      <FiAward />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                        Registro CREFITO
                      </p>
                      <input
                        {...register("crefito", {
                          required: "Obrigatório",
                          pattern: {
                            value: validationPatterns.crefito,
                            message: "Use até 9 letras, números ou traço",
                          },
                        })}
                        maxLength={9}
                        autoCapitalize="characters"
                        aria-invalid={!!errors.crefito}
                        className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none pb-1 uppercase"
                      />
                      <Erro mensagem={errors.crefito?.message} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                      <FiBriefcase />
                    </div>
                    <div className="grid grid-cols-2 gap-4 flex-1">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Conselho / UF
                        </p>
                        <div className="flex gap-2">
                          <input
                            {...register("conselhoNome", {
                              required: "Obrigatório",
                              pattern: {
                                value: validationPatterns.conselhoNome,
                                message: "Use letras, números e espaços",
                              },
                            })}
                            maxLength={100}
                            aria-invalid={!!errors.conselhoNome}
                            className="w-2/3 text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none pb-1"
                          />
                          {/* Era um campo livre de 2 letras: aceitava "XX",
                              "12" ou vazio e só quebrava no backend. A lista
                              de UFs é fechada, então o controle certo é um
                              select — e no celular vira a roleta nativa. */}
                          <select
                            {...register("conselhoUf", {
                              required: "Obrigatório",
                            })}
                            aria-label="UF do conselho"
                            aria-invalid={!!errors.conselhoUf}
                            className="w-1/3 text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none pb-1"
                          >
                            <option value="">UF</option>
                            {ESTADOS_BR.map((estado) => (
                              <option key={estado.sigla} value={estado.sigla}>
                                {estado.sigla}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Erro
                          mensagem={
                            errors.conselhoNome?.message ??
                            errors.conselhoUf?.message
                          }
                        />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Número
                        </p>
                        <input
                          {...register("conselhoNumero", {
                            required: "Obrigatório",
                            pattern: {
                              value: validationPatterns.conselhoNumero,
                              message: "Até 20 caracteres alfanuméricos",
                            },
                          })}
                          maxLength={20}
                          inputMode="numeric"
                          aria-invalid={!!errors.conselhoNumero}
                          className="w-full text-sm font-bold text-slate-700 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none pb-1"
                        />
                        <Erro mensagem={errors.conselhoNumero?.message} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* BOTÕES DE AÇÃO - Movidos para FORA do Grid */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-end">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="py-4 px-8 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <FiX className="text-lg" /> Cancelar
            </button>

            <button
              type="submit"
              disabled={carregando}
              className="py-4 px-8 rounded-2xl text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600"
            >
              {carregando ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FiSave className="text-lg" /> Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default PerfilEditarPage;
