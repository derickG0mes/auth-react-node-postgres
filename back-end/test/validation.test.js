import assert from "node:assert/strict";
import test from "node:test";
import {
  changePasswordSchema,
  emailSchema,
  loginUserSchema,
  registeredUserSchema,
  userIdParamsSchema,
  userIdSchema
} from "../src/validation.js";

test("registration schema normalizes valid user data", () => {
  const result = registeredUserSchema.safeParse({
    name: "  João da Silva ",
    userName: "  Joao123 ",
    email: "  TESTEE@GMAIL.COM ",
    password: "senha-segura"
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data, {
    name: "João da Silva",
    userName: "Joao123",
    email: "testee@gmail.com",
    password: "senha-segura"
  });
});

test("registration schema rejects special username characters and extra fields", () => {
  const validUser = {
    name: "João Silva",
    userName: "joao123",
    email: "joaosilva@gmail.com",
    password: "senha-segura"
  };

  assert.equal(registeredUserSchema.safeParse({ ...validUser, userName: "joao_silva" }).success, false);
  assert.equal(registeredUserSchema.safeParse({ ...validUser, extra: true }).success, false);
});

test("login schema normalizes email and rejects malformed credentials", () => {
  const result = loginUserSchema.safeParse({
    email: "  TESTEE@GMAIL.COM ",
    password: "senha-segura"
  });

  assert.equal(result.success, true);
  assert.equal(result.data.email, "testee@gmail.com");
  assert.equal(loginUserSchema.safeParse({ email: "invalido", password: "senha-segura" }).success, false);
  assert.equal(loginUserSchema.safeParse({ email: "@gmail.com", password: "senha-segura" }).success, false);
  assert.equal(loginUserSchema.safeParse({ email: "usuario@gmail.com.evil.org", password: "senha-segura" }).success, false);
  assert.equal(loginUserSchema.safeParse({ email: "usuario@outlook.com", password: "senha-segura" }).success, false);
  assert.equal(loginUserSchema.safeParse({ email: "abcde@gmail.com", password: "senha-segura" }).success, false);
  assert.equal(loginUserSchema.safeParse({ email: "user@gmail.com", password: "curta" }).success, false);
});

test("email schema accepts only complete Gmail addresses", () => {
  assert.equal(emailSchema.safeParse(" usuario.123@gmail.com ").success, true);
  assert.equal(emailSchema.safeParse("abcdef@gmail").success, false);
  assert.equal(emailSchema.safeParse("abcdef@gmail.co").success, false);
  assert.equal(emailSchema.safeParse("abcdef@gmail.com.evil.org").success, false);
  assert.equal(emailSchema.safeParse("@gmail.com").success, false);
  assert.equal(emailSchema.safeParse("abcde@gmail.com").success, false);
  assert.equal(emailSchema.safeParse(".abcdef@gmail.com").success, false);
  assert.equal(emailSchema.safeParse("abcdef.@gmail.com").success, false);
  assert.equal(emailSchema.safeParse("abc..def@gmail.com").success, false);
  assert.equal(emailSchema.safeParse("abc_def@gmail.com").success, false);
  assert.equal(emailSchema.safeParse("abc+def@gmail.com").success, false);
  assert.equal(emailSchema.safeParse(`${"a".repeat(31)}@gmail.com`).success, false);
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
