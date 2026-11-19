// Funções para gerar, proteger e enviar por link o token de redefinição de senha.
import { createHash, randomBytes } from "node:crypto";

// Tempo de validade do link de redefinição: 15 minutos.
export const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

// Gera 32 bytes aleatórios em base64url (43 caracteres, seguros para uso em URL).
export function gerarTokenRedefinicao() {
  return randomBytes(32).toString("base64url");
}

// Calcula o hash salvo no banco; o token original só existe no link enviado ao usuário.
export function hashTokenRedefinicao(token) {
  return createHash("sha256").update(token).digest("hex");
}

// Monta o link da página do front-end que recebe o token pela query string.
export function montarLinkRedefinicao(frontendOrigin, token) {
  const url = new URL("/redefinir-senha", frontendOrigin);
  url.searchParams.set("token", token);
  return url.toString();
}
