import assert from "node:assert/strict";
import test from "node:test";
import { forgotPasswordSchema, resetPasswordSchema } from "../src/validation.js";
import {
  gerarTokenRedefinicao,
  hashTokenRedefinicao,
  montarLinkRedefinicao
} from "../src/password-reset.js";

test("forgot-password schema normalizes the email and rejects extra fields", () => {
  const result = forgotPasswordSchema.safeParse({ email: "  USUARIO123@GMAIL.COM " });

  assert.equal(result.success, true);
  assert.equal(result.data.email, "usuario123@gmail.com");
  assert.equal(forgotPasswordSchema.safeParse({ email: "usuario@outlook.com" }).success, false);
  assert.equal(forgotPasswordSchema.safeParse({ email: "usuario123@gmail.com", extra: true }).success, false);
});

test("generated reset tokens are unique and accepted by the reset schema", () => {
  const token = gerarTokenRedefinicao();

  assert.equal(token.length, 43);
  assert.notEqual(token, gerarTokenRedefinicao());
  assert.equal(resetPasswordSchema.safeParse({ token, newPassword: "senha-nova-segura" }).success, true);
});

test("reset-password schema rejects malformed tokens, short passwords and extra fields", () => {
  const token = gerarTokenRedefinicao();

  assert.equal(resetPasswordSchema.safeParse({ token: "curto", newPassword: "senha-nova-segura" }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ token: `${token}!`, newPassword: "senha-nova-segura" }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ token, newPassword: "curta" }).success, false);
  assert.equal(resetPasswordSchema.safeParse({ token, newPassword: "senha-nova-segura", extra: true }).success, false);
});

test("token hash is deterministic and does not expose the token", () => {
  const token = gerarTokenRedefinicao();
  const hash = hashTokenRedefinicao(token);

  assert.equal(hash, hashTokenRedefinicao(token));
  assert.notEqual(hash, token);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test("reset link points to the front-end page with the token in the query string", () => {
  const link = montarLinkRedefinicao("http://localhost:5173/", "abc_DEF-123");

  assert.equal(link, "http://localhost:5173/redefinir-senha?token=abc_DEF-123");
});
