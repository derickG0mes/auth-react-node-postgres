import * as argon2 from "argon2";
import { prisma } from "../../lib/prisma.js";

export async function getUserById(req, res, next) {
  try {
    if (req.validated.params.id !== req.user.id) {
      return res.status(403).json({ erro: "Você não pode consultar outro usuário" });
    }

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

    if (!user) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    return res.status(200).json(user);
  } catch (erro) {
    return next(erro);
  }
}

export async function changePassword(req, res, next) {
  try {
    if (req.validated.params.id !== req.user.id) {
      return res.status(403).json({ erro: "Você não pode alterar a senha de outro usuário" });
    }

    const { currentPassword, newPassword } = req.validated.body;
    const userDb = await prisma.usuario.findUnique({
      where: { id: req.user.id }
    });

    if (!userDb) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    if (!(await argon2.verify(userDb.senhaHash, currentPassword))) {
      return res.status(401).json({ erro: "Senha atual incorreta" });
    }

    const passwordHash = await argon2.hash(newPassword);
    await prisma.usuario.update({
      where: { id: userDb.id },
      data: { senhaHash: passwordHash }
    });

    return res.status(200).json({ message: "Senha atualizada com sucesso" });
  } catch (erro) {
    return next(erro);
  }
}
