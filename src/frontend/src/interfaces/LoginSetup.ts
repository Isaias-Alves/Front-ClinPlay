/**
 * Resposta de `GET /auth/setup`.
 *
 * São exatamente os três campos que o backend extrai das claims do token de
 * setup (ver `JwtService.extrairSetup`): o que o Google devolveu sobre a
 * conta, para pré-preencher o formulário de cadastro.
 *
 * A versão anterior desta interface declarava `loginId`, `googleId`,
 * `provedor`, `senhaHash`, `verificado`, `criadoEm` e um `usuario` aninhado.
 * Nenhum deles existe na resposta — e era por isso que o `googleId` lido em
 * `FormCadastro` vinha sempre indefinido. A identificação da conta não passa
 * por aqui: o backend a resolve a partir do próprio token de setup
 * (`jwtService.extrairSub`).
 */
export interface LoginSetup {
  /** Nome da conta Google. */
  nome: string;
  /** E-mail da conta Google. */
  email: string;
  /** URL da foto de perfil do Google. */
  avatar: string;
}
