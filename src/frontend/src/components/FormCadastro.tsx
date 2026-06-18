import { useCadastroForm, useGoogleAuth, useModal } from "@hooks";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@contexts";
import {
  validationMessages,
  validationPatterns,
  validateNascimento,
  ESTADOS_BR,
  ESPECIALIDADES,
} from "@utils";
import { Controller } from "react-hook-form";
import { PatternFormat } from "react-number-format";
import {
  LuUser,
  LuPhone,
  LuLandmark,
  LuMapPin,
  LuHash,
  LuStethoscope,
} from "react-icons/lu";
import {
  FaRegCalendarAlt,
  FaRegIdCard,
  FaRegEnvelope,
  FaRegIdBadge,
} from "react-icons/fa";
import {
  NotificacaoModal,
  TermosConsentimentoModal,
  SwitchTipo,
} from "@components";
import { motion, AnimatePresence } from "framer-motion";

interface LocationState {
  googleData?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

function FormCadastro() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const { isOpen, openModal, closeModal } = useModal();
  const { fetchGoogleData } = useGoogleAuth();
  const { refreshData } = useApp();

  const [googleId, setGoogleId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const {
    register,
    handleSubmit,
    salvarUsuario,
    errors,
    alternarTipo,
    tipoSelecionado,
    control,
    setValue,
    notificacao,
    fecharNotificacao,
  } = useCadastroForm();

  const onSubmit = () => {
    openModal();
  };

  const confirmarECadastrar = () => {
    closeModal();
    handleSubmit(async (data) => {
      try {
        await salvarUsuario(data, googleId || undefined, avatarUrl);
        await refreshData();
        const destino =
          data.tipo === "paciente" ? "/inicio" : "/inicio-profissional";
        setTimeout(() => navigate(destino), 2500);
      } catch (error) {
        console.error("Erro no cadastro:", error);
      }
    })();
  };

  useEffect(() => {
    const carregarDados = async () => {
      let rawData = state?.googleData;

      if (!rawData) {
        rawData = (await fetchGoogleData()) as any;
      }

      if (rawData) {
        const data = Array.isArray(rawData) ? rawData[0] : rawData;
        setGoogleId(data.id);

        setTimeout(() => {
          if (data?.nome)
            setValue("nome", data.nome, {
              shouldValidate: true,
              shouldDirty: true,
            });
          if (data?.email)
            setValue("email", data.email, {
              shouldValidate: true,
              shouldDirty: true,
            });
          setAvatarUrl(data?.avatar || "");
        }, 100);
      }
    };
    carregarDados();
  }, [location.state, setValue, fetchGoogleData]);

  return (
    <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      {notificacao && (
        <NotificacaoModal
          isOpen={notificacao.isOpen}
          onClose={fecharNotificacao}
          mensagem={notificacao.mensagem}
          tipo={notificacao.tipo}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {avatarUrl && (
          <div className="flex flex-col items-center gap-2 mb-2">
            <p className="text-xs text-slate-500 font-medium">Foto do Perfil</p>
            <img
              referrerPolicy="no-referrer"
              src={avatarUrl}
              alt="Foto de perfil"
              className="w-20 h-20 rounded-full border-2 border-emerald-100 shadow-sm object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <h2 className="font-semibold text-slate-700 text-sm text-center mb-1">
          Cadastrar Como:
        </h2>
        <SwitchTipo tipo={tipoSelecionado} onChange={alternarTipo} />
        <input type="hidden" {...register("tipo")} />

        {/* 1. Nome */}
        <div>
          <div className="relative flex items-center">
            <LuUser className="absolute left-4 text-slate-400 text-lg" />
            <input
              type="text"
              placeholder="Nome Completo"
              {...register("nome", { required: validationMessages.required })}
              className={`w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border outline-none text-sm transition-colors ${errors.nome ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"}`}
            />
          </div>
          {errors.nome && (
            <span className="text-red-500 text-[10px] ml-2 font-medium">
              {errors.nome.message}
            </span>
          )}
        </div>

        {/* 2. Data de Nascimento */}
        <div>
          <div className="relative flex items-center">
            <FaRegCalendarAlt className="absolute left-4 text-slate-400 text-lg" />
            <Controller
              control={control}
              name="dataNascimento"
              rules={{
                required: validationMessages.required,
                validate: validateNascimento,
              }}
              render={({ field: { onChange, value, ref } }) => (
                <PatternFormat
                  format="##/##/####"
                  mask="_"
                  value={value}
                  onValueChange={(values) => onChange(values.formattedValue)}
                  getInputRef={ref}
                  placeholder="Data de Nascimento"
                  className={`w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border outline-none text-sm transition-colors ${errors.dataNascimento ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"}`}
                />
              )}
            />
          </div>
          {errors.dataNascimento && (
            <span className="text-red-500 text-[10px] ml-2 font-medium">
              {errors.dataNascimento.message}
            </span>
          )}
        </div>

        {/* 3. Telefone */}
        <div>
          <div className="relative flex items-center">
            <LuPhone className="absolute left-4 text-slate-400 text-lg" />
            <Controller
              control={control}
              name="telefone"
              rules={{
                required: validationMessages.required,
                validate: (val) => {
                  const d = (val || "").length;
                  return d === 10 || d === 11 || validationMessages.telefone;
                },
              }}
              render={({ field: { onChange, value, ref } }) => (
                <PatternFormat
                  format="(##) # ####-####"
                  mask="_"
                  value={value}
                  onValueChange={(values) => onChange(values.value)}
                  getInputRef={ref}
                  placeholder="Telefone/Celular"
                  className={`w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border outline-none text-sm transition-colors ${errors.telefone ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"}`}
                />
              )}
            />
          </div>
          {errors.telefone && (
            <span className="text-red-500 text-[10px] ml-2 font-medium">
              {errors.telefone.message}
            </span>
          )}
        </div>

        {/* 4. CPF (somente paciente) */}
        <AnimatePresence>
          {tipoSelecionado === "paciente" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Controller
                control={control}
                name="cpf"
                rules={{
                  required: validationMessages.required,
                  pattern: {
                    value: validationPatterns.cpf,
                    message: validationMessages.cpf,
                  },
                }}
                render={({ field: { onChange, value, ref } }) => (
                  <div className="relative flex items-center">
                    <FaRegIdCard className="absolute left-4 text-slate-400 text-lg" />
                    <PatternFormat
                      format="###.###.###-##"
                      mask="_"
                      value={value as string}
                      onValueChange={(values) => onChange(values.value)}
                      getInputRef={ref}
                      placeholder="CPF"
                      className={`w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border outline-none text-sm transition-colors ${errors.cpf ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"}`}
                    />
                  </div>
                )}
              />
              {errors.cpf && (
                <span className="text-red-500 text-[10px] ml-2 font-medium">
                  {errors.cpf?.message}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* BLOCO 1 DO PROFISSIONAL: 5. Crefito e 6. Especialidade */}
        <AnimatePresence>
          {tipoSelecionado === "profissional" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-4 overflow-hidden"
            >
              {/* CREFITO */}
              <div>
                <div className="relative flex items-center">
                  <FaRegIdBadge className="absolute left-4 text-slate-400 text-lg" />
                  {(() => {
                    const { onChange: crfOnChange, ...crfRest } = register("crefito", {
                      required: validationMessages.required,
                      pattern: {
                        value: validationPatterns.crefito,
                        message: validationMessages.crefito,
                      },
                    });
                    return (
                      <input
                        type="text"
                        placeholder="CREFITO"
                        maxLength={9}
                        {...crfRest}
                        onChange={(e) => {
                          e.target.value = e.target.value.replace(/[^A-Za-z0-9\-]/g, "").slice(0, 9);
                          crfOnChange(e);
                        }}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border outline-none text-sm transition-colors ${errors.crefito ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"}`}
                      />
                    );
                  })()}
                </div>
                {errors.crefito && (
                  <span className="text-red-500 text-[10px] ml-2 font-medium">
                    {errors.crefito.message}
                  </span>
                )}
              </div>

              {/* ESPECIALIDADE */}
              <div>
                <div className="relative flex items-center">
                  <LuStethoscope className="absolute left-4 text-slate-400 text-lg" />
                  <select
                    {...register("especialidade", {
                      required: "Especialidade é obrigatória",
                    })}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border outline-none text-sm transition-colors appearance-none ${errors.especialidade ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"}`}
                  >
                    <option value="">Especialidade Principal</option>
                    {ESPECIALIDADES.map((esp) => (
                      <option key={esp} value={esp}>
                        {esp}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.especialidade && (
                  <span className="text-red-500 text-[10px] ml-2 font-medium">
                    {errors.especialidade.message}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 7. E-mail (Comum a ambos) */}
        <div>
          <div className="relative flex items-center">
            <FaRegEnvelope className="absolute left-4 text-slate-400 text-lg" />
            <input
              type="text"
              placeholder="E-mail"
              {...register("email", {
                required: validationMessages.required,
                pattern: {
                  value: validationPatterns.email,
                  message: validationMessages.email,
                },
              })}
              className={`w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border outline-none text-sm transition-colors ${errors.email ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"}`}
            />
          </div>
          {errors.email && (
            <span className="text-red-500 text-[10px] ml-2 font-medium">
              {errors.email.message}
            </span>
          )}
        </div>

        {/* BLOCO 2 DO PROFISSIONAL: 8. Dados do Conselho */}
        <AnimatePresence>
          {tipoSelecionado === "profissional" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-4 overflow-hidden pt-2"
            >
              <div className="h-px bg-slate-100 my-1 w-full rounded-full"></div>
              <h2 className="text-slate-700 font-semibold text-sm text-center">
                Dados do Conselho
              </h2>

              <div>
                <div className="relative flex items-center">
                  <LuLandmark className="absolute left-4 text-slate-400 text-lg" />
                  <input
                    type="text"
                    placeholder="Nome do Conselho"
                    {...register("conselhoNome", {
                      required: validationMessages.required,
                      pattern: {
                        value: validationPatterns.conselhoNome,
                        message: validationMessages.conselhoNome,
                      },
                    })}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border outline-none text-sm transition-colors ${errors.conselhoNome ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"}`}
                  />
                </div>
                {errors.conselhoNome && (
                  <span className="text-red-500 text-[10px] ml-2 font-medium">
                    {errors.conselhoNome.message}
                  </span>
                )}
              </div>

              <div>
                <div className="relative flex items-center">
                  <LuHash className="absolute left-4 text-slate-400 text-lg" />
                  <input
                    type="text"
                    placeholder="Número do Conselho"
                    {...register("conselhoNumero", {
                      required: validationMessages.required,
                      pattern: {
                        value: validationPatterns.conselhoNumero,
                        message: validationMessages.conselhoNumero,
                      },
                    })}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border outline-none text-sm transition-colors ${errors.conselhoNumero ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"}`}
                  />
                </div>
                {errors.conselhoNumero && (
                  <span className="text-red-500 text-[10px] ml-2 font-medium">
                    {errors.conselhoNumero.message}
                  </span>
                )}
              </div>

              <div>
                <div className="relative flex items-center">
                  <LuMapPin className="absolute left-4 text-slate-400 text-lg" />
                  <select
                    {...register("conselhoUf", { required: validationMessages.required })}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl border outline-none text-sm transition-colors appearance-none ${errors.conselhoUf ? "border-red-500 focus:border-red-500" : "border-slate-200 focus:border-emerald-500"}`}
                  >
                    <option value="">UF do Conselho</option>
                    {ESTADOS_BR.map((estado) => (
                      <option key={estado.sigla} value={estado.sigla}>
                        {estado.nome}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.conselhoUf && (
                  <span className="text-red-500 text-[10px] ml-2 font-medium">
                    {errors.conselhoUf.message}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          className="w-full py-3 mt-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-colors shadow-md shadow-emerald-200"
        >
          Finalizar Cadastro
        </motion.button>
      </form>

      <TermosConsentimentoModal
        isOpen={isOpen}
        onClose={closeModal}
        onAccept={confirmarECadastrar}
      />
    </div>
  );
}

export default FormCadastro;
