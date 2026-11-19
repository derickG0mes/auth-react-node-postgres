import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { autenticarToken, validar } from "./middleware.js";
import {
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  register,
  resetPassword
} from "./controllers/authController.js";
import { changePassword, getUserById } from "./controllers/userController.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginUserSchema,
  registeredUserSchema,
  resetPasswordSchema,
  userIdParamsSchema
} from "./validation.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    error: "Muitas tentativas de login a partir deste IP. Tente novamente após 15 minutos."
  },
  standardHeaders: true,
  legacyHeaders: false
});

function criarLimitadorRedefinicao() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: { erro: "Muitas tentativas. Tente novamente após 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false
  });
}

// Cada rota tem o próprio contador, para uma não consumir o limite da outra.
const forgotPasswordLimiter = criarLimitadorRedefinicao();
const resetPasswordLimiter = criarLimitadorRedefinicao();

router.get("/", (req, res) => {
  return res.status(200).json({ message: "Rota principal" });
});

router.get(["/health", "/api/health"], (req, res) => {
  return res.status(200).json({
    health: "Saudável ✅",
    message: "Aplicação está funcionando!!",
    status: res.statusCode
  });
});

router.post([ "/auth/login", "/api/logins" ], loginLimiter,
  validar(loginUserSchema, { mensagem: "Preencha todos os campos corretamente" }),
  login
);

router.get(["/auth/me", "/api/logado"], autenticarToken, getCurrentUser);

router.post(["/auth/logout", "/api/logout"], autenticarToken, logout);

router.post([ "/auth/register", "/api/cadastro-usuarios" ],
validar(registeredUserSchema, { mensagem: "Preencha todos os campos corretamente" }),
  register
);

router.post("/auth/forgot-password", forgotPasswordLimiter,
  validar(forgotPasswordSchema, { mensagem: "Informe um e-mail válido" }),
  forgotPassword
);

router.post("/auth/reset-password", resetPasswordLimiter,
  validar(resetPasswordSchema, { mensagem: "Preencha todos os campos corretamente" }),
  resetPassword
);

router.get("/api/usuarios/:id", autenticarToken, validar(userIdParamsSchema, {
    origem: "params",
    mensagem: "ID de usuário inválido"
  }),
  getUserById
);

router.put("/api/atualizar/usuarios/:id", autenticarToken, validar(userIdParamsSchema, {
    origem: "params",
    mensagem: "ID de usuário inválido"
  }),
  validar(changePasswordSchema, { mensagem: "Informe a senha atual e a nova senha" }),
  changePassword
);

export default router;
