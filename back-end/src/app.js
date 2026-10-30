import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routers.js";

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN;

if (!FRONTEND_ORIGIN) {
  throw new Error("A variável de ambiente FRONTEND_ORIGIN não está configurada");
}

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT"]
}));

app.use(router);

app.use((req, res) => {
  return res.status(404).json({ erro: "Rota não encontrada" });
});

app.use((erro, req, res, next) => {
  if (res.headersSent) {
    return next(erro);
  }

  const status = Number.isInteger(erro.status) && erro.status >= 400 && erro.status < 500
    ? erro.status : 500;
  const mensagem = status === 400
    ? "Requisição inválida"
    : status === 413
      ? "Requisição muito grande"
      : "Erro interno do servidor";

  if (status >= 500) {
    console.error(erro);
  }

  return res.status(status).json({ erro: mensagem });
});

export default app;
