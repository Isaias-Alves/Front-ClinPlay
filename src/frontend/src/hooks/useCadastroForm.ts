import { useState } from "react";
import { useForm } from "react-hook-form";
import { authServices } from "@services";
import { mensagemDeErro } from "@utils";
import {
  CadastroPacienteRequest,
  CadastroProfissionalRequest,
  UF,
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

  /**
   * Cria a conta a partir do formulário.
   *
   * Não recebe mais `googleId`: o parâmetro nunca foi lido no corpo da
   * função, os DTOs `CadastroPaciente`/`CadastroProfissional` não têm esse
   * campo e o backend identifica a conta pelo próprio token de setup.
   */
  const salvarUsuario = async (
    formData: UsuarioFormInput,
    avatarUrl?: string | null,
  ): Promise<boolean> => {
    const partesData = formData.dataNascimento.split("/");
    if (partesData.length !== 3) {
      setNotificacao({
        isOpen: true,
        mensagem: "Data de nascimento inválida. Use o formato DD/MM/AAAA.",
        tipo: "erro",
      });
      return false;
    }

    const [dia, mes, ano] = partesData;
    const dataFormatada = `${ano}-${mes}-${dia}`;

    /**
     * `UsuarioFormInput` marca como opcionais os campos que só existem num
     * dos perfis. A validação do formulário já os exige, mas checar aqui
     * evita enviar `undefined` ao backend caso alguma regra mude — antes,
     * com `formData: any`, isso passava direto e virava um 400 obscuro.
     */
    const exigir = (valor: string | undefined, campo: string): string => {
      if (!valor?.trim()) throw new Error(`Preencha o campo ${campo}.`);
      return valor;
    };

    try {
      if (formData.tipo === "paciente") {
        const payload: CadastroPacienteRequest = {
          nome: formData.nome,
          telefone: formData.telefone,
          cpf: exigir(formData.cpf, "CPF").replace(/\D/g, ""),
          nascimento: dataFormatada,
          email: formData.email,
          avatar: avatarUrl || undefined,
        };

        await authServices.cadastrarPaciente(payload);

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
          crefito: exigir(formData.crefito, "CREFITO"),
          especialidade: exigir(formData.especialidade, "especialidade"),
          conselhoNome: exigir(formData.conselhoNome, "nome do conselho"),
          conselhoNumero: exigir(formData.conselhoNumero, "número do conselho"),
          conselhoUf: exigir(formData.conselhoUf, "UF do conselho") as UF,
        };

        await authServices.cadastrarProfissional(payload);

        setNotificacao({
          isOpen: true,
          mensagem: "Profissional cadastrado com sucesso!",
          tipo: "sucesso",
        });
      }
      reset();
      return true;
    } catch (erro) {
      /**
       * O catch antigo trocava qualquer erro por um texto genérico. Isso
       * apagava tanto a mensagem do `exigir()` ("Preencha o campo CPF.")
       * quanto a do backend ("CPF já cadastrado"), deixando quem tenta se
       * cadastrar sem a menor pista do que corrigir.
       */
      const padrao =
        formData.tipo === "paciente"
          ? "Erro ao cadastrar paciente."
          : "Erro ao cadastrar profissional!";

      setNotificacao({
        isOpen: true,
        mensagem: mensagemDeErro(erro, padrao),
        tipo: "erro",
      });
      return false;
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
