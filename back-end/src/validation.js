// Importa o Zod para declarar os formatos aceitos pela API.
import { z } from "zod";

// Normaliza o e-mail, verifica seu formato e aceita somente endereços do Gmail.
export const emailSchema = z.string()
  .trim()
  .toLowerCase()
  .pipe(z.email())
  .refine((email) => {
    const [username, domain] = email.split("@");

    return domain === "gmail.com" &&
      username.length >= 6 &&
      username.length <= 30 &&
      /^[a-z0-9]+(?:\.[a-z0-9]+)*$/.test(username);
  }, {
    error: "Informe um Gmail com usuário de 6 a 30 letras, números ou pontos"
  });

// Define e-mail e senha aceitos pela rota de login.
export const loginUserSchema = z.object({
  // Aplica o formato válido e restringe o domínio ao Gmail.
  email: emailSchema,
  // Exige senha com pelo menos 8 e no máximo 300 caracteres.
  password: z.string().min(8).max(300)
  // Rejeita propriedades adicionais no objeto recebido.
}).strict();

// Define e normaliza os campos aceitos na criação de uma conta.
export const registeredUserSchema = z.object({
  // Aceita nome com letras e espaços, após remover espaços nas extremidades.
  name: z.string().trim().min(3).max(100).regex(/^[\p{L}\p{M} ]+$/u),
  // Aceita somente letras Unicode e números no nome de usuário.
  userName: z.string().trim().min(2).max(100).regex(/^(?:\p{L}\p{M}*|\p{N})+$/u),
  // Aplica o formato válido e restringe o domínio ao Gmail.
  email: emailSchema,
  // Limita o tamanho da senha antes de gerar o hash.
  password: z.string().min(8).max(300)
  // Rejeita propriedades adicionais no objeto recebido.
}).strict();

// Converte o ID textual da URL e exige um inteiro positivo dentro do limite seguro do JavaScript.
export const userIdSchema = z.coerce.number().int().positive().refine(Number.isSafeInteger);

// Valida os parâmetros de rotas que recebem um ID no caminho.
export const userIdParamsSchema = z.object({
  id: userIdSchema
}).strict();

// Define os campos necessários para trocar uma senha.
export const changePasswordSchema = z.object({
  // Exige que a senha atual não esteja vazia e tenha no máximo 300 caracteres.
  currentPassword: z.string().min(1).max(300),
  // Exige que a senha nova tenha entre 8 e 300 caracteres.
  newPassword: z.string().min(8).max(300)
  // Rejeita propriedades adicionais no objeto recebido.
}).strict();
