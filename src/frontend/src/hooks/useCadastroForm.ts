import { useState } from "react";
import { useForm } from "react-hook-form";
import { authServices } from "@services";
import {
  CadastroPacienteRequest,
  CadastroProfissionalRequest,
  UsuarioFormInput,
} from "@interfaces";

const useCadastroForm = () => {
  const [notificacao, setNotificacao] = useState<{
    isOpen: boolean;
    mensagem: string;
    tipo: "sucesso" | "erro";
  } | null>(null);

  const fecharNotificacao = () => {
    if (notificacao) {
      setNotificacao({ ...notificacao, isOpen: false });
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    control,
  } = useForm<UsuarioFormInput>({
    defaultValues: {
      tipo: "paciente",
      nome: "",
      email: "",
      cpf: "",
      especialidade: "",
    },
  });

  const tipoSelecionado = watch("tipo");

  const alternarTipo = () => {
    setValue(
      "tipo",
      tipoSelecionado === "paciente" ? "profissional" : "paciente",
    );
  };

  const salvarUsuario = async (
    formData: any,
    googleId?: string,
    avatarUrl?: string | null,
  ) => {
    const partesData = formData.dataNascimento.split("/");
    if (partesData.length !== 3) {
      setNotificacao({
        isOpen: true,
        mensagem: "Data de nascimento inválida. Use o formato DD/MM/AAAA.",
        tipo: "erro",
      });
      return;
    }

    const [dia, mes, ano] = partesData;
    const dataFormatada = `${ano}-${mes}-${dia}`;

    try {
      if (formData.tipo === "paciente") {
        const payload: CadastroPacienteRequest = {
          nome: formData.nome,
          telefone: formData.telefone,
          cpf: formData.cpf?.replace(/\D/g, ""),
          nascimento: dataFormatada,
          email: formData.email,
          avatar: avatarUrl || undefined,
        };

        await authServices.cadastrarPaciente(payload, googleId);

        setNotificacao({
          isOpen: true,
          mensagem: "Paciente cadastrado com sucesso!",
          tipo: "sucesso",
        });
      } else {
        const payload: CadastroProfissionalRequest = {
          nome: formData.nome,
          telefone: formData.telefone,
          nascimento: dataFormatada,
          email: formData.email,
          avatar: avatarUrl || undefined,
          crefito: formData.crefito,
          especialidade: formData.especialidade,
          conselhoNome: formData.conselhoNome,
          conselhoNumero: formData.conselhoNumero,
          conselhoUf: formData.conselhoUf,
        };

        await authServices.cadastrarProfissional(payload, googleId);

        setNotificacao({
          isOpen: true,
          mensagem: "Profissional cadastrado com sucesso!",
          tipo: "sucesso",
        });
      }
      reset();
    } catch (error: any) {
      const mensagemErro =
        formData.tipo === "paciente"
          ? "Erro ao cadastrar paciente."
          : "Erro ao cadastrar profissional!";

      setNotificacao({
        isOpen: true,
        mensagem: mensagemErro,
        tipo: "erro",
      });
    }
  };

  return {
    register,
    handleSubmit,
    salvarUsuario,
    errors,
    reset,
    watch,
    setValue,
    tipoSelecionado,
    alternarTipo,
    control,
    notificacao,
    fecharNotificacao,
  };
};

export default useCadastroForm;
