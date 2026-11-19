import "dotenv/config";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { enviarEmailRedefinicao } from "../email.js";
import {
  RESET_TOKEN_TTL_MS,
  gerarTokenRedefinicao,
  hashTokenRedefinicao,
  montarLinkRedefinicao
} from "../password-reset.js";

const JWT_TOKEN = process.env.JWT_TOKEN;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

if (!JWT_TOKEN) {
  throw new Error("A variável de ambiente JWT_TOKEN não está configurada");
}

if (!FRONTEND_ORIGIN) {
  throw new Error("A variável de ambiente FRONTEND_ORIGIN não está configurada");
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.validated.body;
    const userDb = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!userDb || !(await argon2.verify(userDb.senhaHash, password))) {
      return res.status(401).json({ erro: "E-mail ou senha inválidos" });
    }

    const token = jwt.sign(
      { id: userDb.id, email: userDb.email },
      JWT_TOKEN,
      { expiresIn: "1d" }
    );

    res.cookie("token_acesso", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000
    });

    const now = new Date();
    const loginDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;

    console.log(`${userDb.nome} logou no sistema - ${loginDate}`);
    return res.status(200).json({
      message: "Login realizado com sucesso!",
      data: loginDate
    });
  } catch (erro) {
    return next(erro);
  }
}

export function getCurrentUser(req, res) {
  return res.json({ usuario: req.user });
}

export function logout(req, res) {
  res.clearCookie("token_acesso");
  return res.status(200).json({ message: "Você saiu da sua conta" });
}

export async function register(req, res, next) {
  try {
    const { name, userName, email, password } = req.validated.body;
    const passwordHash = await argon2.hash(password);
    const createUser = await prisma.usuario.create({
      data: { nome: name, userName, email, senhaHash: passwordHash },
      select: { nome: true, userName: true, email: true }
    });

    console.log("Usuário cadastrado no banco de dados");
    return res.status(201).json(createUser);
  } catch (erro) {
    if (erro?.code === "P2002") {
      return res.status(409).json({ erro: "Este e-mail já está cadastrado" });
    }

    return next(erro);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.validated.body;
    const userDb = await prisma.usuario.findUnique({ where: { email } });

    if (userDb) {
      const token = gerarTokenRedefinicao();
      const agora = new Date();

      // Mantém um único token por usuário e limpa os expirados na mesma transação.
      await prisma.$transaction([
        prisma.tokenRedefinicaoSenha.deleteMany({
          where: { OR: [{ usuarioId: userDb.id }, { expiraEm: { lt: agora } }] }
        }),
        prisma.tokenRedefinicaoSenha.create({
          data: {
            usuarioId: userDb.id,
            tokenHash: hashTokenRedefinicao(token),
            expiraEm: new Date(agora.getTime() + RESET_TOKEN_TTL_MS)
          }
        })
      ]);

      // Não espera o envio, para o tempo de resposta não revelar se a conta existe.
      enviarEmailRedefinicao({
        para: userDb.email,
        link: montarLinkRedefinicao(FRONTEND_ORIGIN, token)
      }).catch((erro) => console.error("Falha ao enviar e-mail de redefinição:", erro));
    }

    // A mesma resposta vale para e-mails cadastrados e não cadastrados.
    return res.status(200).json({
      message: "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha."
    });
  } catch (erro) {
    return next(erro);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.validated.body;
    const tokenInvalido = () => res.status(400).json({
      erro: "Link inválido ou expirado. Solicite um novo."
    });

    const registro = await prisma.tokenRedefinicaoSenha.findUnique({
      where: { tokenHash: hashTokenRedefinicao(token) }
    });

    // Evita o custo do hash da senha quando o token não existe ou já venceu.
    if (!registro || registro.expiraEm <= new Date()) {
      return tokenInvalido();
    }

    const passwordHash = await argon2.hash(newPassword);

    const redefinida = await prisma.$transaction(async (tx) => {
      // Apagar o token o consome: se duas requisições chegarem juntas, só uma apaga a linha.
      const consumido = await tx.tokenRedefinicaoSenha.deleteMany({
        where: { id: registro.id, expiraEm: { gt: new Date() } }
      });

      if (consumido.count !== 1) {
        return false;
      }

      await tx.usuario.update({
        where: { id: registro.usuarioId },
        data: { senhaHash: passwordHash }
      });

      return true;
    });

    if (!redefinida) {
      return tokenInvalido();
    }

    return res.status(200).json({ message: "Senha redefinida com sucesso! Faça login." });
  } catch (erro) {
    return next(erro);
  }
}