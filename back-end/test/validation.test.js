import assert from "node:assert/strict";
import test from "node:test";
import {
  changePasswordSchema,
  loginUserSchema,
  registeredUserSchema,
  userIdParamsSchema,
  userIdSchema
} from "../src/validation.js";

test("registration schema normalizes valid user data", () => {
  const result = registeredUserSchema.safeParse({
    name: "  João da Silva ",
    userName: "  Joao123 ",
    email: "  TESTE@EXAMPLE.COM ",
    password: "senha-segura"
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    name: "João da Silva",
    userName: "Joao123",
    email: "teste@example.com",
    password: "senha-segura"
  });
});

test("registration schema rejects special username characters and extra fields", () => {
  const validUser = {
    name: "João Silva",
    userName: "joao123",
    email: "joao@example.com",
    password: "senha-segura"
  };

  assert.equal(registeredUserSchema.safeParse({ ...validUser, userName: "joao_silva" }).success, false);
  assert.equal(registeredUserSchema.safeParse({ ...validUser, extra: true }).success, false);
});

test("login schema normalizes email and rejects malformed credentials", () => {
  const result = loginUserSchema.safeParse({
    email: "  TESTE@EXAMPLE.COM ",
    password: "senha-segura"
  });

  assert.equal(result.success, true);
  assert.equal(result.data.email, "teste@example.com");
  assert.equal(loginUserSchema.safeParse({ email: "invalido", password: "senha-segura" }).success, false);
  assert.equal(loginUserSchema.safeParse({ email: "user@example.com", password: "curta" }).success, false);
});

test("user ID schema accepts only positive safe integers", () => {
  assert.equal(userIdSchema.parse("42"), 42);
  assert.deepEqual(userIdParamsSchema.parse({ id: "42" }), { id: 42 });

  for (const id of ["0", "-1", "1.5", "abc", "9007199254740992"]) {
    assert.equal(userIdSchema.safeParse(id).success, false, `expected ${id} to be rejected`);
  }

  assert.equal(userIdParamsSchema.safeParse({ id: "42", extra: true }).success, false);
});

test("change-password schema validates both passwords and rejects extra fields", () => {
  const validPasswords = {
    currentPassword: "senha-atual",
    newPassword: "senha-nova-segura"
  };

  assert.equal(changePasswordSchema.safeParse(validPasswords).success, true);
  assert.equal(changePasswordSchema.safeParse({ ...validPasswords, newPassword: "curta" }).success, false);
  assert.equal(changePasswordSchema.safeParse({ ...validPasswords, extra: true }).success, false);
});
