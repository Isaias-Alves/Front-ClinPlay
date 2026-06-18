import { Usuario } from "./Usuario";
import { Provedor } from "@utils";

export interface LoginSetup {
  /**
   * ID do usuário usado para login
   */
  loginId: string;
  /**
   * ID do usuário no Google
   */
  googleId: string;
  /**
   * Nome do usuário
   */
  nome: string;
  /**
   * Email do usuário
   */
  email: string;
  /**
   * Provedor de autenticação
   */
  provedor: Provedor;
  /**
   * Hash da senha do usuário
   */
  senhaHash?: string;
  /**
   * Indica se o usuário foi verificado
   */
  verificado: boolean;
  /**
   * Foto de avatar do usuário
   */
  avatar: string;
  /**
   * Data de criação do usuário
   */
  criadoEm: Date;
  /**
   * Dados do usuário
   */
  usuario: Usuario;
}
