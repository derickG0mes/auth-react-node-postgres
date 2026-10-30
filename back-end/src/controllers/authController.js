import "dotenv/config";
import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";

const JWT_TOKEN = process.env.JWT_TOKEN;

if (!JWT_TOKEN) {
  throw new Error("A variável de ambiente JWT_TOKEN não está configurada");
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
