import assert from "node:assert/strict";
import test from "node:test";
import { sessaoAindaValida } from "../src/session.js";

test("session is valid when the token version matches the database", () => {
  assert.equal(sessaoAindaValida({ id: 1, tv: 0 }, { versaoToken: 0 }), true);
  assert.equal(sessaoAindaValida({ id: 1, tv: 3 }, { versaoToken: 3 }), true);
});

test("session is invalid after the version is bumped by a password reset", () => {
  assert.equal(sessaoAindaValida({ id: 1, tv: 0 }, { versaoToken: 1 }), false);
});

test("session is invalid when the account no longer exists", () => {
  assert.equal(sessaoAindaValida({ id: 1, tv: 0 }, null), false);
  assert.equal(sessaoAindaValida({ id: 1, tv: 0 }, undefined), false);
});

test("tokens issued before the version existed are rejected", () => {
  assert.equal(sessaoAindaValida({ id: 1 }, { versaoToken: 0 }), false);
  assert.equal(sessaoAindaValida({ id: 1, tv: "0" }, { versaoToken: 0 }), false);
  assert.equal(sessaoAindaValida(undefined, { versaoToken: 0 }), false);
});
