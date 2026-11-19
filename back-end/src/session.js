// Decide se o token de acesso ainda vale, comparando a versão assinada nele com a do banco.
// Quando a senha é redefinida, a versão do usuário sobe e todos os tokens anteriores deixam de valer.
export function sessaoAindaValida(payload, usuarioDb) {
  if (!usuarioDb) {
    return false;
  }

  // Tokens emitidos antes deste recurso não têm "tv" e precisam de um novo login.
  return Number.isInteger(payload?.tv) && payload.tv === usuarioDb.versaoToken;
}
