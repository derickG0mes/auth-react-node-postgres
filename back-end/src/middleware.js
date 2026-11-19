// Carrega as variáveis de ambiente antes de ler a chave JWT.
import "dotenv/config";
// Fornece as funções para verificar a assinatura e validade de tokens JWT.
import jwt from "jsonwebtoken";

// Lê a chave usada para validar os tokens enviados pelos clientes.
const JWT_TOKEN = process.env.JWT_TOKEN;

// Impede que o servidor continue sem uma chave para autenticação.
if (!JWT_TOKEN) {
  throw new Error("A variável de ambiente JWT_TOKEN não está configurada");
}

// Cria um middleware reutilizável para validar o corpo ou os parâmetros da requisição.
export function validar(schema, { origem = "body", mensagem = "Dados inválidos" } = {}) {
  return (req, res, next) => {
    // Valida os dados escolhidos usando o schema Zod e obtém a versão transformada.
    const resultado = schema.safeParse(req[origem]);

    // Interrompe a requisição com status 400 se os dados não passarem na validação.
    if (!resultado.success) {
      return res.status(400).json({ erro: mensagem });
    }

    // Guarda os dados validados para as rotas usarem sem ler novamente a entrada bruta.
    req.validated = {
      ...req.validated,
      [origem]: resultado.data
    };

    // Continua para o próximo middleware ou para a rota.
    return next();
  };
}

// Verifica o cookie de acesso e identifica o usuário antes de liberar uma rota protegida.
export function autenticarToken(req, res, next) {
  // O ?. evita erro se req.cookies não existir; nesse caso, o token fica undefined.
  const token = req.cookies?.token_acesso;

  // Rejeita a requisição se não houver token de acesso no cookie.
  if (!token) {
    return res.status(401).json({ erro: "Acesso negado. Token ausente." });
  }

  try {
    // Verifica assinatura e expiração; se válido, devolve os dados assinados do usuário.
    req.user = jwt.verify(token, JWT_TOKEN);
  } catch {
    // Retorna 403 se o token estiver inválido, adulterado ou expirado.
    return res.status(403).json({ erro: "Token inválido ou expirado." });
  }

  // Libera a rota protegida após autenticar o usuário.
  return next();
}