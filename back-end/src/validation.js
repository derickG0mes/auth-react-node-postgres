// Importa o Zod para declarar os formatos aceitos pela API.
import { z } from "zod";

// Define e-mail e senha aceitos pela rota de login.
export const loginUserSchema = z.object({
  // Remove espaços e normaliza o e-mail antes de validá-lo.
  email: z.string().trim().toLowerCase().pipe(z.email()),
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
  // Normaliza o e-mail para minúsculas e verifica seu formato.
  email: z.string().trim().toLowerCase().pipe(z.email()),
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
