// Carrega as variáveis definidas no arquivo .env para process.env.
import "dotenv/config";
// Importa o Express para criar a aplicação e declarar as rotas HTTP.
import express from "express";
// Configura o acesso à API pelo front-end de outra origem.
import cors from "cors";
// Lê os cookies recebidos e os disponibiliza em req.cookies.
import cookieParser from "cookie-parser";
// Cria e valida os tokens JWT usados para autenticação.
import jwt from "jsonwebtoken";
// Gera e verifica hashes seguros das senhas.
import * as argon2 from "argon2";
// Limita a quantidade de tentativas de login por endereço IP.
import { rateLimit } from "express-rate-limit";
// Fornece as operações de acesso ao banco de dados.
import { prisma } from "../lib/prisma.js";
// Fornece middlewares para autenticação e validação das requisições.
import { autenticarToken, validar } from "./middleware.js";
// Importa as regras Zod usadas para validar os dados das rotas.
import { 
  changePasswordSchema, 
  loginUserSchema, 
  registeredUserSchema, 
  userIdParamsSchema
} from "./validation.js";

// Chave usada para assinar e verificar os tokens de autenticação.
const JWT_TOKEN = process.env.JWT_TOKEN;
// Endereço do front-end autorizado a fazer requisições com cookies.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

// Interrompe a inicialização se a chave JWT não estiver configurada.
if (!JWT_TOKEN) {
  throw new Error("A variável de ambiente JWT_TOKEN não está configurada");
}

// Interrompe a inicialização se a origem do front-end não estiver configurada.
if (!FRONTEND_ORIGIN) {
  throw new Error("A variável de ambiente FRONTEND_ORIGIN não está configurada");
}

// Cria a aplicação Express que receberá e responderá às requisições.
const app = express();
// Configura cinco tentativas de login por IP a cada quinze minutos.
const loginLimiter = rateLimit({
  // Define a duração da janela de contagem em milissegundos.
  windowMs: 15 * 60 * 1000,
  // Define o número máximo de tentativas na janela.
  limit: 5,
  // Define a mensagem enviada quando o limite é atingido.
  message: { 
    error: "Muitas tentativas de login a partir deste IP. Tente novamente após 15 minutos." 
  },
  // Inclui os headers padronizados com informações do limite.
  standardHeaders: true,
  // Desativa os headers antigos de rate limit.
  legacyHeaders: false
});

// Converte corpos JSON recebidos em objetos JavaScript em req.body.
app.use(express.json());
// Disponibiliza os cookies recebidos em req.cookies.
app.use(cookieParser());
// Permite chamadas da origem configurada e o envio de cookies entre front-end e API.
app.use(cors({
  // Autoriza somente o endereço configurado em FRONTEND_ORIGIN.
  origin: FRONTEND_ORIGIN,
  // Permite que o navegador envie cookies nas requisições cross-origin.
  credentials: true,
  // Restringe os métodos HTTP permitidos pelo CORS.
  methods: ["GET", "POST", "PUT"]
}));

// Rota simples para confirmar que a API está respondendo.
app.get("/", (req, res) => {
  return res.status(200).json({ message: "Rota principal" });
});

// Rota de verificação de saúde, com o caminho curto e o caminho antigo mantido.
app.get(["/health", "/api/health"], (req, res) => {
  return res.status(200).json({
    health: "Saudável ✅",
    message: "Aplicação está funcionando!!",
    status: res.statusCode
  });
});

app.post(["/auth/login", "/api/logins"], loginLimiter,
  // Valida e normaliza os dados de login antes de executar a rota.
  validar(loginUserSchema, { mensagem: "Preencha todos os campos corretamente" }),
  async (req, res, next) => {
    try {
      // Usa os dados já validados e normalizados pelo middleware.
      const { email, password } = req.validated.body;
      // Busca a conta pelo e-mail normalizado.
      const userDb = await prisma.usuario.findUnique({
        where: { email }
      });

      // Retorna a mesma mensagem para e-mail inexistente ou senha incorreta.
      if (!userDb || !(await argon2.verify(userDb.senhaHash, password))) {
        return res.status(401).json({ erro: "E-mail ou senha inválidos" });
      }

      // Assina um token com a identidade do usuário, válido por um dia.
      const token = jwt.sign(
        { id: userDb.id, email: userDb.email },
        JWT_TOKEN,
        { expiresIn: "1d" }
      );

      // Envia o token em cookie protegido, não acessível pelo JavaScript do navegador.
      res.cookie("token_acesso", token, {
        // Impede o acesso ao cookie por scripts no navegador.
        httpOnly: true,
        // Restringe o envio do cookie a navegação no mesmo site.
        sameSite: "lax",
        // Exige HTTPS em produção.
        secure: process.env.NODE_ENV === "production",
        // Define a validade do cookie como um dia.
        maxAge: 24 * 60 * 60 * 1000
      });

      // Registra a data e hora do login no horário local do servidor.
      const now = new Date();
      const loginDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
      // Informa no log do servidor qual usuário realizou o login e quando.
      console.log(`${userDb.nome} logou no sistema - ${loginDate}`);

      // Confirma o login e devolve a data registrada.
      return res.status(200).json({
        message: "Login realizado com sucesso!",
        data: loginDate
      });
    } catch (erro) {
      // Encaminha erros inesperados para o tratamento de erros do Express.
      return next(erro);
    }
  }
);

// Retorna os dados de identidade presentes no token autenticado.
app.get(["/auth/me", "/api/logado"], autenticarToken, (req, res) => {
  return res.json({ usuario: req.user });
});

// Exige autenticação e remove o cookie de acesso do navegador.
app.post(["/auth/logout", "/api/logout"], autenticarToken, (req, res) => {
  res.clearCookie("token_acesso");
  return res.status(200).json({ message: "Você saiu da sua conta" });
});

app.post(["/auth/register", "/api/cadastro-usuarios"],
  // Valida os campos e normaliza nome e e-mail antes do cadastro.
  validar(registeredUserSchema, { mensagem: "Preencha todos os campos corretamente" }),
  async (req, res, next) => {
    try {
      // Obtém os dados confiáveis que passaram pela validação.
      const { name, userName, email, password } = req.validated.body;
      // Armazena somente o hash da senha, nunca a senha original.
      const passwordHash = await argon2.hash(password);
      // Cria o usuário e seleciona apenas os dados públicos para a resposta.
      const createUser = await prisma.usuario.create({
        data: { nome: name, userName, email, senhaHash: passwordHash },
        select: { nome: true, userName: true, email: true }
      });

      // Registra o cadastro no log e responde com status de criação.
      console.log("Usuário cadastrado no banco de dados");
      return res.status(201).json(createUser);
    } catch (erro) {
      // Converte violação de campo único (por exemplo, e-mail duplicado) em conflito HTTP.
      if (erro?.code === "P2002") {
        return res.status(409).json({ erro: "Este e-mail já está cadastrado" });
      }

      // Encaminha os demais erros para o tratamento de erros do Express.
      return next(erro);
    }
  }
);

app.get("/api/usuarios/:id",
  autenticarToken,
  // Converte e valida o ID recebido na URL antes de consultar o banco.
  validar(userIdParamsSchema, {
    origem: "params",
    mensagem: "ID de usuário inválido"
  }),
  async (req, res, next) => {
    try {
      // Permite que cada pessoa consulte somente o próprio perfil.
      if (req.validated.params.id !== req.user.id) {
        return res.status(403).json({ erro: "Você não pode consultar outro usuário" });
      }

      // Busca a conta pelo ID e seleciona somente campos que podem ser expostos.
      const user = await prisma.usuario.findUnique({
        where: { id: req.validated.params.id },
        select: {
          id: true,
          nome: true,
          userName: true,
          email: true,
          criadoEm: true,
          atualizadoEm: true
        }
      });

      // Responde com 404 quando não existe usuário com esse ID.
      if (!user) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      // Devolve os dados públicos do usuário encontrado.
      return res.status(200).json(user);
    } catch (erro) {
      // Encaminha erros inesperados para o tratamento de erros do Express.
      return next(erro);
    }
  }
);

app.put("/api/atualizar/usuarios/:id", autenticarToken,
  // Valida o ID da URL para garantir que seja um inteiro positivo seguro.
  validar(userIdParamsSchema, {
    origem: "params",
    mensagem: "ID de usuário inválido"
  }),
  // Valida a senha atual e a nova senha antes de executar a alteração.
  validar(changePasswordSchema, { mensagem: "Informe a senha atual e a nova senha" }),
  async (req, res, next) => {
    try {
      // Impede que o usuário autenticado altere a senha de outra conta.
      if (req.validated.params.id !== req.user.id) {
        return res.status(403).json({ erro: "Você não pode alterar a senha de outro usuário" });
      }

      // Obtém as senhas que passaram pela validação.
      const { currentPassword, newPassword } = req.validated.body;
      // Busca a conta autenticada e o hash necessário para conferir a senha atual.
      const userDb = await prisma.usuario.findUnique({
        where: { id: req.user.id }
      });

      // Informa que a conta do token não existe mais no banco.
      if (!userDb) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
      }

      // Confere se a senha atual corresponde ao hash armazenado.
      if (!(await argon2.verify(userDb.senhaHash, currentPassword))) {
        return res.status(401).json({ erro: "Senha atual incorreta" });
      }

      // Gera um novo hash para não armazenar a senha nova em texto puro.
      const passwordHash = await argon2.hash(newPassword);
      // Atualiza o hash da senha na conta do usuário autenticado.
      await prisma.usuario.update({
        where: { id: userDb.id },
        data: { senhaHash: passwordHash }
      });

      // Confirma que a senha foi atualizada com sucesso.
      return res.status(200).json({ message: "Senha atualizada com sucesso" });
    } catch (erro) {
      // Encaminha erros inesperados para o tratamento de erros do Express.
      return next(erro);
    }
  }
);

// Responde em JSON quando nenhuma rota corresponde ao caminho solicitado.
app.use((req, res) => {
  return res.status(404).json({ erro: "Rota não encontrada" });
});

// Converte erros encaminhados pelo Express em respostas JSON sem expor detalhes internos.
app.use((erro, req, res, next) => {
  // Deixa o Express tratar o erro caso a resposta já tenha começado.
  if (res.headersSent) {
    return next(erro);
  }

  // Mantém erros de requisição conhecidos e usa 500 para falhas inesperadas.
  const status = Number.isInteger(erro.status) && erro.status >= 400 && erro.status < 500
    ? erro.status
    : 500;
  // Usa mensagens genéricas para não revelar detalhes internos do servidor.
  const mensagem = status === 400
    ? "Requisição inválida"
    : status === 413
      ? "Requisição muito grande"
      : "Erro interno do servidor";

  // Registra detalhes técnicos apenas no log do servidor.
  if (status >= 500) {
    console.error(erro);
  }

  return res.status(status).json({ erro: mensagem });
});

export default app;